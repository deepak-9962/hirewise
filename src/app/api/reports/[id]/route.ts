import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/reports/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const admin = getSupabaseAdmin();

  // Fetch the report
  const { data: report, error } = await admin
    .from("reports")
    .select("*, interviews(id, job_id, status, score, total_questions, started_at, completed_at, application_id, jobs(id, title, department, type))")
    .eq("id", id)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: error?.message ?? "Not found" }, { status: 404 });
  }

  // Fetch candidate profile
  const { data: profile } = await admin
    .from("profiles")
    .select("id, name, email, phone, location, experience, skills, avatar_url, resume_url")
    .eq("id", report.candidate_id)
    .single();

  // Fetch interview responses with questions
  const interviewId = report.interviews?.id ?? report.interview_id;
  const { data: responses } = await admin
    .from("interview_responses")
    .select("*, questions(id, text, difficulty, type, tags, correct_answer, expected_answer)")
    .eq("interview_id", interviewId)
    .order("created_at", { ascending: true });

  // Fetch application (for hire button)
  let application = null;
  const appId = report.interviews?.application_id;
  if (appId) {
    const { data: app } = await admin
      .from("applications")
      .select("id, status")
      .eq("id", appId)
      .single();
    application = app;
  }

  return NextResponse.json({
    ...report,
    profile: profile ?? null,
    responses: responses ?? [],
    application: application ?? null,
  });
}
