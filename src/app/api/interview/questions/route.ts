import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/interview/questions?interview_id=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const interviewId = searchParams.get("interview_id");

  if (!interviewId) {
    return NextResponse.json({ error: "interview_id required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Get interview + job_id
  const { data: interview, error: interviewError } = await admin
    .from("interviews")
    .select("id, job_id, jobs(title, department)")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const jobId = interview.job_id;
  if (!jobId) {
    return NextResponse.json({ questions: [], jobTitle: "Technical Interview" });
  }

  // Get questions via job_questions join table
  const { data: jobQuestions, error: jqError } = await admin
    .from("job_questions")
    .select("order_index, time_limit_seconds, questions(*)")
    .eq("job_id", jobId)
    .order("order_index", { ascending: true });

  if (jqError || !jobQuestions?.length) {
    return NextResponse.json({ questions: [], jobTitle: (interview.jobs as any)?.title ?? "Technical Interview" });
  }

  const questions = jobQuestions.map((jq: any) => ({
    id: jq.questions.id,
    text: jq.questions.text,
    type: jq.questions.type,
    skill: jq.questions.skill,
    difficulty: jq.questions.difficulty,
    timeLimit: jq.time_limit_seconds ?? jq.questions.time_limit ?? 300,
    language: jq.questions.language ?? "javascript",
    starterCode: jq.questions.starter_code ?? null,
  }));

  return NextResponse.json({
    questions,
    jobTitle: (interview.jobs as any)?.title ?? "Technical Interview",
    jobId,
  });
}
