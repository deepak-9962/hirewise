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

  // Get interview + job_id + application_id + candidate_id
  const { data: interview, error: interviewError } = await admin
    .from("interviews")
    .select("id, job_id, application_id, candidate_id, jobs(title, department, target_skills)")
    .eq("id", interviewId)
    .single();

  if (interviewError || !interview) {
    return NextResponse.json({ error: "Interview not found" }, { status: 404 });
  }

  const jobId = interview.job_id;
  const applicationId = interview.application_id ?? null;
  const candidateId = interview.candidate_id ?? null;
  const jobTitle = (interview.jobs as any)?.title ?? "Technical Interview";

  if (!jobId) {
    return NextResponse.json({ questions: [], jobTitle, applicationId, candidateId });
  }

  let questions: any[] = [];

  // Tier 1: Try job_questions join table
  const { data: jqData, error: jqError } = await admin
    .from("job_questions")
    .select("order_index, time_limit_seconds, questions(*)")
    .eq("job_id", jobId)
    .order("order_index", { ascending: true });

  if (!jqError && jqData && jqData.length > 0) {
    questions = jqData
      .filter((jq: any) => jq.questions)
      .map((jq: any) => ({
        id: jq.questions.id,
        dbId: jq.questions.id,
        text: jq.questions.text,
        type: jq.questions.type,
        skill: jq.questions.skill,
        difficulty: jq.questions.difficulty,
        timeLimit: jq.time_limit_seconds ?? jq.questions.time_limit ?? 300,
        language: jq.questions.language ?? "javascript",
        starterCode: jq.questions.starter_code ?? null,
      }));
  }

  // Tier 2: Try direct questions with job_id
  if (questions.length === 0) {
    const { data: directQ } = await admin
      .from("questions")
      .select("*")
      .eq("job_id", jobId)
      .limit(10);

    if (directQ && directQ.length > 0) {
      questions = directQ.map((q: any) => ({
        id: q.id,
        dbId: q.id,
        text: q.text,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        timeLimit: q.time_limit ?? 300,
        language: q.language ?? "javascript",
        starterCode: q.starter_code ?? null,
      }));
    }
  }

  // Tier 3: Query question bank (all questions)
  if (questions.length === 0) {
    const { data: bankQ } = await admin
      .from("questions")
      .select("*")
      .limit(5);

    if (bankQ && bankQ.length > 0) {
      questions = bankQ.map((q: any) => ({
        id: q.id,
        dbId: q.id,
        text: q.text,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        timeLimit: q.time_limit ?? 300,
        language: q.language ?? "javascript",
        starterCode: q.starter_code ?? null,
      }));
    }
  }

  // Tier 4: Fallback questions if database table is completely empty
  if (questions.length === 0) {
    questions = [
      {
        id: "q-fallback-1",
        dbId: null,
        type: "descriptive",
        difficulty: "Easy",
        skill: "General",
        text: "Describe your approach to problem-solving in software engineering. How do you break down complex technical requirements?",
        timeLimit: 300,
      },
      {
        id: "q-fallback-2",
        dbId: null,
        type: "coding",
        difficulty: "Medium",
        skill: "Algorithms",
        text: "Write a function that takes an array of integers and returns the maximum subarray sum.",
        timeLimit: 600,
        language: "javascript",
        starterCode: "function maxSubArray(nums) {\n  // Your solution here\n}",
      },
    ];
  }

  // Update total_questions on interview
  await admin
    .from("interviews")
    .update({ total_questions: questions.length })
    .eq("id", interviewId);

  return NextResponse.json({
    questions,
    jobTitle,
    jobId,
    applicationId,
    candidateId,
  });
}

