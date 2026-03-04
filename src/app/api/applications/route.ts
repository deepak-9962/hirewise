import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/applications?job_id=xxx  OR  ?candidate_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id");
  const candidateId = searchParams.get("candidate_id");

  const admin = getSupabaseAdmin();

  if (jobId) {
    // Try FK join first, fall back to manual join if FK doesn't exist
    let { data, error } = await admin
      .from("applications")
      .select("*, profiles!candidate_id(name, email)")
      .eq("job_id", jobId)
      .order("applied_at", { ascending: false });

    if (error) {
      // Fallback: fetch without FK join, then enrich manually
      const { data: apps, error: appsError } = await admin
        .from("applications")
        .select("*")
        .eq("job_id", jobId)
        .order("applied_at", { ascending: false });
      if (appsError) return NextResponse.json({ error: appsError.message }, { status: 500 });

      // Fetch profiles for all candidate_ids
      const candidateIds = [...new Set((apps ?? []).map((a: any) => a.candidate_id).filter(Boolean))];
      let profileMap = new Map<string, any>();
      if (candidateIds.length > 0) {
        const { data: profiles } = await admin.from("profiles").select("id, name, email").in("id", candidateIds);
        profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
      }
      data = (apps ?? []).map((a: any) => ({ ...a, profiles: profileMap.get(a.candidate_id) ?? null }));
    }

    return NextResponse.json(data);
  }

  if (candidateId) {
    let { data, error } = await admin
      .from("applications")
      .select("*, jobs(id, title, department, type, status, target_skills)")
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false });

    if (error) {
      // Fallback: fetch without FK join, then enrich manually
      const { data: apps, error: appsError } = await admin
        .from("applications")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("applied_at", { ascending: false });
      if (appsError) return NextResponse.json({ error: appsError.message }, { status: 500 });

      const jobIds = [...new Set((apps ?? []).map((a: any) => a.job_id).filter(Boolean))];
      let jobMap = new Map<string, any>();
      if (jobIds.length > 0) {
        const { data: jobs } = await admin.from("jobs").select("id, title, department, type, status, target_skills").in("id", jobIds);
        jobMap = new Map((jobs ?? []).map((j: any) => [j.id, j]));
      }
      data = (apps ?? []).map((a: any) => ({ ...a, jobs: jobMap.get(a.job_id) ?? null }));
    }

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
