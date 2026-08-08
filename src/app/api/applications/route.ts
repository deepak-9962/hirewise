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
      .select("*, jobs(id, title, department, type, status, target_skills), interviews(id, status, scheduled_at)")
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
      const appIds = [...new Set((apps ?? []).map((a: any) => a.id).filter(Boolean))];

      const [jobsRes, interviewsRes] = await Promise.all([
        jobIds.length > 0 ? admin.from("jobs").select("id, title, department, type, status, target_skills").in("id", jobIds) : Promise.resolve({ data: [] }),
        appIds.length > 0 ? admin.from("interviews").select("id, status, scheduled_at, application_id").in("application_id", appIds) : Promise.resolve({ data: [] }),
      ]);

      const jobMap = new Map((jobsRes.data ?? []).map((j: any) => [j.id, j]));
      const interviewMap = new Map((interviewsRes.data ?? []).map((i: any) => [i.application_id, i]));

      data = (apps ?? []).map((a: any) => ({
        ...a,
        jobs: jobMap.get(a.job_id) ?? null,
        interviews: interviewMap.get(a.id) ?? null,
      }));
    }

    return NextResponse.json(data);
  }


  // Fetch all applications if no specific filter is passed
  let { data, error } = await admin
    .from("applications")
    .select("*, profiles!candidate_id(name, email), jobs(id, title, department, type, status, target_skills)")
    .order("applied_at", { ascending: false });

  if (error) {
    const { data: apps, error: appsError } = await admin
      .from("applications")
      .select("*")
      .order("applied_at", { ascending: false });
    if (appsError) return NextResponse.json({ error: appsError.message }, { status: 500 });

    const candidateIds = [...new Set((apps ?? []).map((a: any) => a.candidate_id).filter(Boolean))];
    const jobIds = [...new Set((apps ?? []).map((a: any) => a.job_id).filter(Boolean))];

    const [profilesRes, jobsRes] = await Promise.all([
      candidateIds.length > 0 ? admin.from("profiles").select("id, name, email").in("id", candidateIds) : Promise.resolve({ data: [] }),
      jobIds.length > 0 ? admin.from("jobs").select("id, title, department, type, status, target_skills").in("id", jobIds) : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const jobMap = new Map((jobsRes.data ?? []).map((j: any) => [j.id, j]));

    data = (apps ?? []).map((a: any) => ({
      ...a,
      profiles: profileMap.get(a.candidate_id) ?? null,
      jobs: jobMap.get(a.job_id) ?? null,
    }));
  }

  return NextResponse.json(data ?? []);
}

// POST /api/applications  — candidate applies
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { job_id, candidate_id, cover_note } = body;

    if (!job_id || !candidate_id) {
      return NextResponse.json({ error: "job_id and candidate_id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Ensure candidate profile exists (auto-create if missing)
    let { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", candidate_id)
      .maybeSingle();

    if (!profile) {
      const { data: newProf, error: createProfErr } = await admin
        .from("profiles")
        .upsert({
          id: candidate_id,
          name: "Candidate",
          email: "",
          role: "candidate",
          status: "active",
        })
        .select("id")
        .maybeSingle();

      if (createProfErr) {
        console.error("Failed to auto-create profile for application:", createProfErr);
      }
      profile = newProf;
    }

    // Check if application already exists
    const { data: existingApp } = await admin
      .from("applications")
      .select("id")
      .eq("job_id", job_id)
      .eq("candidate_id", candidate_id)
      .maybeSingle();

    let data: any = null;
    let error: any = null;

    if (existingApp?.id) {
      const res = await admin
        .from("applications")
        .update({
          cover_note: cover_note || "",
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .eq("id", existingApp.id)
        .select()
        .single();
      data = res.data;
      error = res.error;
    } else {
      const res = await admin
        .from("applications")
        .insert({
          job_id,
          candidate_id,
          cover_note: cover_note || "",
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();
      data = res.data;
      error = res.error;
    }

    if (error) {
      console.error("Application insert/update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Increment applicants_count on the job
    const { data: jobRow } = await admin
      .from("jobs")
      .select("applicants_count")
      .eq("id", job_id)
      .maybeSingle();

    if (jobRow) {
      await admin
        .from("jobs")
        .update({ applicants_count: ((jobRow as any).applicants_count || 0) + 1 })
        .eq("id", job_id);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/applications exception:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred" }, { status: 500 });
  }
}
