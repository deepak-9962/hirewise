import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/ats/pipeline — Get all applications across all jobs with enrichment
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("job_id"); // optional filter
  const status = searchParams.get("status"); // optional filter
  const search = searchParams.get("search"); // optional search term
  const recruiterId = searchParams.get("recruiter_id"); // only show recruiter's jobs

  const admin = getSupabaseAdmin();

  // Build applications query
  let query = admin
    .from("applications")
    .select("*")
    .order("applied_at", { ascending: false });

  if (jobId && jobId !== "all") {
    query = query.eq("job_id", jobId);
  }
  if (status && status !== "all") {
    query = query.eq("status", status);
  }

  const { data: applications, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!applications || applications.length === 0) {
    return NextResponse.json({ applications: [], stats: getEmptyStats() });
  }

  // Enrich with profiles
  const candidateIds = [...new Set(applications.map((a: any) => a.candidate_id).filter(Boolean))];
  const jobIds = [...new Set(applications.map((a: any) => a.job_id).filter(Boolean))];

  const [profilesRes, jobsRes, interviewsRes, reportsRes, notesRes] = await Promise.all([
    candidateIds.length > 0
      ? admin.from("profiles").select("id, name, email, phone, skills, experience, location, resume_url, avatar_url").in("id", candidateIds)
      : { data: [] },
    jobIds.length > 0
      ? admin.from("jobs").select("id, title, department, type, status, target_skills, recruiter_id").in("id", jobIds)
      : { data: [] },
    admin.from("interviews").select("id, application_id, status, score, completed_at").in(
      "application_id",
      applications.map((a: any) => a.id)
    ),
    admin.from("reports").select("id, candidate_id, overall_score, ai_summary").in("candidate_id", candidateIds),
    admin.from("pipeline_notes").select("*").in(
      "application_id",
      applications.map((a: any) => a.id)
    ).order("created_at", { ascending: false }).then(
      (res) => res,
      // If table doesn't exist yet, return empty
      () => ({ data: [], error: null })
    ),
  ]);

  const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.id, p]));
  const jobMap = new Map((jobsRes.data ?? []).map((j: any) => [j.id, j]));
  const interviewMap = new Map((interviewsRes.data ?? []).map((i: any) => [i.application_id, i]));
  const reportMap = new Map<string, any>();
  for (const r of (reportsRes.data ?? []) as any[]) {
    if (!reportMap.has(r.candidate_id)) reportMap.set(r.candidate_id, r);
  }
  const notesMap = new Map<string, any[]>();
  for (const n of (notesRes.data ?? []) as any[]) {
    if (!notesMap.has(n.application_id)) notesMap.set(n.application_id, []);
    notesMap.get(n.application_id)!.push(n);
  }

  // Filter by recruiter's jobs if needed
  let filteredJobIds: Set<string> | null = null;
  if (recruiterId) {
    filteredJobIds = new Set(
      (jobsRes.data ?? []).filter((j: any) => j.recruiter_id === recruiterId).map((j: any) => j.id)
    );
  }

  // Build enriched applications
  let enriched = applications.map((app: any) => ({
    ...app,
    profiles: profileMap.get(app.candidate_id) ?? null,
    jobs: jobMap.get(app.job_id) ?? null,
    interviews: interviewMap.get(app.id) ?? null,
    reports: reportMap.get(app.candidate_id) ?? null,
    notes: notesMap.get(app.id) ?? [],
  }));

  // Filter by recruiter's jobs
  if (filteredJobIds) {
    enriched = enriched.filter((a: any) => filteredJobIds!.has(a.job_id));
  }

  // Filter by search term
  if (search) {
    const term = search.toLowerCase();
    enriched = enriched.filter((a: any) => {
      const name = (a.profiles?.name ?? "").toLowerCase();
      const email = (a.profiles?.email ?? "").toLowerCase();
      const jobTitle = (a.jobs?.title ?? "").toLowerCase();
      return name.includes(term) || email.includes(term) || jobTitle.includes(term);
    });
  }

  // Compute stats
  const stats = computeStats(enriched, jobMap);

  return NextResponse.json({ applications: enriched, stats });
}

function getEmptyStats() {
  return {
    total: 0,
    byStage: {},
    byJob: [],
    avgTimeToHire: 0,
    conversionRate: 0,
  };
}

function computeStats(applications: any[], jobMap: Map<string, any>) {
  const byStage: Record<string, number> = {};
  const byJobCount: Record<string, number> = {};
  let hiredCount = 0;
  let totalDaysToHire = 0;

  for (const app of applications) {
    byStage[app.status] = (byStage[app.status] || 0) + 1;
    byJobCount[app.job_id] = (byJobCount[app.job_id] || 0) + 1;

    if (app.status === "hired") {
      hiredCount++;
      const applied = new Date(app.applied_at).getTime();
      const now = Date.now();
      totalDaysToHire += Math.round((now - applied) / (1000 * 60 * 60 * 24));
    }
  }

  const byJob = Object.entries(byJobCount).map(([jobId, count]) => ({
    job_id: jobId,
    title: jobMap.get(jobId)?.title ?? "Unknown",
    count,
  }));

  return {
    total: applications.length,
    byStage,
    byJob: byJob.sort((a, b) => b.count - a.count),
    avgTimeToHire: hiredCount > 0 ? Math.round(totalDaysToHire / hiredCount) : 0,
    conversionRate: applications.length > 0 ? Math.round((hiredCount / applications.length) * 100) : 0,
  };
}
