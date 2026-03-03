import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

// GET /api/applications?job_id=xxx  OR  ?candidate_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const candidateId = searchParams.get("candidate_id");

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Try admin client for cross-user queries (recruiter viewing all applications for a job)
  let client = supabase;
  if (jobId) {
    try {
      const { getSupabaseAdmin } = await import("@/lib/supabaseAdmin");
      client = getSupabaseAdmin();
    } catch {
      // Admin client not available; fall back to auth client
    }
  }

  if (jobId) {
    const { data, error } = await client
      .from("applications")
      .select("*, profiles!candidate_id(name, email)")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (candidateId) {
    const { data, error } = await supabase
      .from("applications")
      .select("*, jobs(id, title, department, type, status, target_skills)")
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: "job_id or candidate_id required" }, { status: 400 });
}

// POST /api/applications  — candidate applies
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { job_id, cover_note } = body;

  if (!job_id) {
    return NextResponse.json({ error: "job_id is required" }, { status: 400 });
  }

  // Use the authenticated user's ID (don't trust client-sent candidate_id)
  const candidate_id = user.id;

  const { data, error } = await supabase
    .from("applications")
    .insert({ job_id, candidate_id, cover_note, status: "applied" })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Already applied to this job" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

