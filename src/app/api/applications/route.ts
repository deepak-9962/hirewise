import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/applications?job_id=xxx  OR  ?candidate_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const candidateId = searchParams.get("candidate_id");

  const admin = getSupabaseAdmin();

  if (jobId) {
    const { data, error } = await admin
      .from("applications")
      .select("*, profiles!candidate_id(name, email)")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  if (candidateId) {
    const { data, error } = await admin
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
  const body = await req.json();
  const { job_id, candidate_id, cover_note } = body;

  if (!job_id || !candidate_id) {
    return NextResponse.json({ error: "job_id and candidate_id required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Ensure candidate profile exists
  const { data: profile } = await admin
    .from("profiles")
    .select("id")
    .eq("id", candidate_id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Candidate profile not found" }, { status: 404 });
  }

  const { data, error } = await admin
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
