import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/applications/enable-test
// Recruiter enables test for a candidate → create interview record + set status
export async function POST(req: NextRequest) {
  try {
    const { application_id, candidate_id, job_id } = await req.json();

    if (!application_id || !candidate_id || !job_id) {
      return NextResponse.json({ error: "application_id, candidate_id, job_id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Check if interview already exists for this application or candidate+job
    let { data: existing } = await admin
      .from("interviews")
      .select("id, application_id")
      .eq("application_id", application_id)
      .maybeSingle();

    if (!existing) {
      const { data: existingByCandJob } = await admin
        .from("interviews")
        .select("id, application_id")
        .eq("candidate_id", candidate_id)
        .eq("job_id", job_id)
        .maybeSingle();
      existing = existingByCandJob;
    }

    // Count questions available for this job
    const { count: questionsCount } = await admin
      .from("job_questions")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job_id);

    const totalQ = questionsCount || 0;
    let interviewId = existing?.id;

    if (existing) {
      // Update existing interview to ensure application_id and total_questions are set
      await admin
        .from("interviews")
        .update({
          application_id: application_id,
          total_questions: totalQ > 0 ? totalQ : undefined,
        })
        .eq("id", existing.id);
    } else {
      // Get job for info
      const { data: job } = await admin.from("jobs").select("title").eq("id", job_id).maybeSingle();

      // Create interview record
      const { data: interview, error } = await admin
        .from("interviews")
        .insert({
          candidate_id,
          job_id,
          application_id,
          status: "scheduled",
          type: "Technical",
          scheduled_at: new Date().toISOString(),
          total_questions: totalQ,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to create interview on enable-test:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      interviewId = interview.id;
    }

    // Update application status to test_enabled
    const { error: appErr } = await admin
      .from("applications")
      .update({ status: "test_enabled" })
      .eq("id", application_id);

    if (appErr) {
      console.error("Failed to update application status:", appErr);
      return NextResponse.json({ error: appErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, interview_id: interviewId });
  } catch (err: any) {
    console.error("POST /api/applications/enable-test error:", err);
    return NextResponse.json({ error: err.message || "Failed to enable test" }, { status: 500 });
  }
}
