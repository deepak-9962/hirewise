import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/reports?candidate_id=xxx
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidate_id");

    const admin = getSupabaseAdmin();
    let query = admin.from("reports").select("*").order("generated_at", { ascending: false });

    if (candidateId) {
      query = query.eq("candidate_id", candidateId);
    }

    const { data: reports, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!reports || reports.length === 0) return NextResponse.json([]);

    // Enrich with profiles and interviews -> jobs
    const candidateIds = [...new Set(reports.map((r: any) => r.candidate_id).filter(Boolean))];
    const interviewIds = [...new Set(reports.map((r: any) => r.interview_id).filter(Boolean))];

    const [profilesRes, interviewsRes] = await Promise.all([
      candidateIds.length ? admin.from("profiles").select("id, name, email").in("id", candidateIds) : { data: [] },
      interviewIds.length ? admin.from("interviews").select("id, job_id").in("id", interviewIds) : { data: [] },
    ]);

    const jobIds = [...new Set((interviewsRes.data ?? []).map((i: any) => i.job_id).filter(Boolean))];
    const jobsRes = jobIds.length ? await admin.from("jobs").select("id, title, department").in("id", jobIds) : { data: [] };

    const pMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
    const jMap = new Map((jobsRes.data ?? []).map((j: any) => [j.id, j]));
    const iMap = new Map((interviewsRes.data ?? []).map((i: any) => [i.id, { ...i, jobs: jMap.get(i.job_id) ?? null }]));

    const enriched = reports.map((r: any) => ({
      ...r,
      profiles: pMap.get(r.candidate_id) ?? null,
      interviews: iMap.get(r.interview_id) ?? null,
    }));

    return NextResponse.json(enriched);
  } catch (err: any) {
    console.error("GET /api/reports error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch reports" }, { status: 500 });
  }
}
