import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/reports/[id]/hire
// Marks the linked application as "hired"
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  // Get the report to find the application
  const { data: report, error: rErr } = await admin
    .from("reports")
    .select("interview_id, candidate_id, interviews(application_id, job_id)")
    .eq("id", id)
    .single();

  if (rErr || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const appId = (report.interviews as any)?.application_id;
  const jobId = (report.interviews as any)?.job_id;

  if (!appId) {
    return NextResponse.json({ error: "No linked application" }, { status: 400 });
  }

  // Update application status to hired
  const { error: appErr } = await admin
    .from("applications")
    .update({ status: "hired" })
    .eq("id", appId);

  if (appErr) return NextResponse.json({ error: appErr.message }, { status: 500 });

  // Fetch candidate + job for offer details
  const [profileRes, jobRes] = await Promise.all([
    admin.from("profiles").select("name, email").eq("id", report.candidate_id).single(),
    jobId ? admin.from("jobs").select("title, department").eq("id", jobId).single() : Promise.resolve({ data: null }),
  ]);

  return NextResponse.json({
    success: true,
    candidateName: profileRes.data?.name ?? "Candidate",
    candidateEmail: profileRes.data?.email ?? "",
    jobTitle: jobRes.data?.title ?? "",
    applicationId: appId,
  });
}
