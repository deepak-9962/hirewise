import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const {
      interviewId,
      candidateId,
      jobId,
      applicationId,
      jobTitle,
      questions,
      answers,
      evaluations,
      finalReport,
    } = body;

    if (!candidateId) {
      return NextResponse.json({ error: "Missing candidateId" }, { status: 400 });
    }

    // 1. Upsert interview record
    const overallScore = finalReport?.overallScore ?? 0;

    let actualInterviewId = interviewId;

    // Check if the interview ID already exists in the DB
    if (interviewId && interviewId !== "demo") {
      const { data: existing } = await supabaseAdmin
        .from("interviews")
        .select("id, application_id")
        .eq("id", interviewId)
        .single();

      if (existing) {
        // Update existing interview
        await supabaseAdmin
          .from("interviews")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            score: overallScore,
            total_questions: questions?.length ?? 0,
          })
          .eq("id", interviewId);

        // Update the linked application status to test_completed
        const appId = existing.application_id || applicationId;
        if (appId) {
          await supabaseAdmin
            .from("applications")
            .update({ status: "test_completed" })
            .eq("id", appId);
        }
      } else {
        actualInterviewId = null; // Will create new
      }
    } else {
      actualInterviewId = null;
    }

    // Create new interview record if needed
    if (!actualInterviewId) {
      const { data: newInterview, error: interviewError } = await supabaseAdmin
        .from("interviews")
        .insert({
          candidate_id: candidateId,
          job_id: jobId || null,
          application_id: applicationId || null,
          status: "completed",
          type: "Technical",
          started_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          completed_at: new Date().toISOString(),
          scheduled_at: new Date().toISOString(),
          score: overallScore,
          total_questions: questions?.length ?? 0,
        })
        .select()
        .single();

      if (interviewError) {
        console.error("Interview insert error:", interviewError);
        return NextResponse.json({ error: "Failed to save interview", detail: interviewError.message }, { status: 500 });
      }
      actualInterviewId = newInterview.id;

      // Update the linked application status to test_completed
      if (applicationId) {
        await supabaseAdmin
          .from("applications")
          .update({ status: "test_completed" })
          .eq("id", applicationId);
      }
    }

    // 2. Save each response
    if (questions && answers) {
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const answerText = answers[q.id] || "";
        const evaluation = evaluations?.[q.id];

        await supabaseAdmin.from("interview_responses").insert({
          interview_id: actualInterviewId,
          question_id: q.dbId || null,
          answer_text: answerText,
          is_submitted: true,
          score: evaluation?.score ?? null,
          ai_feedback: evaluation?.feedback ?? "",
          language_used: q.type === "coding" ? (q.language || "javascript") : null,
        });
      }
    }

    // 3. Save the report
    if (finalReport) {
      const { error: reportError } = await supabaseAdmin.from("reports").insert({
        interview_id: actualInterviewId,
        candidate_id: candidateId,
        overall_score: finalReport.overallScore ?? 0,
        technical_score: finalReport.technicalScore ?? 0,
        communication_score: finalReport.communicationScore ?? 0,
        reasoning_score: finalReport.reasoningScore ?? 0,
        strengths: finalReport.strengths ?? [],
        weaknesses: finalReport.weaknesses ?? [],
        ai_summary: finalReport.summary ?? "",
        generated_at: new Date().toISOString(),
      });

      if (reportError) {
        console.error("Report insert error:", reportError);
      }
    }

    // 4. Log an AI evaluation record
    await supabaseAdmin.from("ai_evaluations").insert({
      interview_id: actualInterviewId,
      candidate_id: candidateId,
      eval_type: "full_interview",
      model_used: "gemini-2.0-flash",
      score: overallScore,
      confidence: 85,
      latency_ms: 3000,
      tokens_used: 2000,
    });

    return NextResponse.json({
      success: true,
      interviewId: actualInterviewId,
      message: "Interview results saved to database",
    });
  } catch (error) {
    console.error("Save interview error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
