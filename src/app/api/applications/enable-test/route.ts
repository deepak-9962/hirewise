import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/applications/enable-test
// Recruiter enables test for a candidate → create interview record + set status
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { application_id, candidate_id, job_id } = body;

    if (!application_id || !candidate_id || !job_id) {
      return NextResponse.json({ error: "application_id, candidate_id, job_id required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Ensure candidate profile exists to avoid FK error
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("id", candidate_id)
      .maybeSingle();

    if (!profile) {
      await admin.from("profiles").upsert({
        id: candidate_id,
        name: "Candidate",
        email: "",
        role: "candidate",
        status: "active",
      });
    }

    // 2. Check if interview already exists for this application or candidate+job (use limit(1) to avoid 500 if multiple exist)
    let existing: any = null;
    const { data: existingApps } = await admin
      .from("interviews")
      .select("id, application_id")
      .eq("application_id", application_id)
      .limit(1);

    if (existingApps && existingApps.length > 0) {
      existing = existingApps[0];
    } else {
      const { data: existingCandJobs } = await admin
        .from("interviews")
        .select("id, application_id")
        .eq("candidate_id", candidate_id)
        .eq("job_id", job_id)
        .limit(1);

      if (existingCandJobs && existingCandJobs.length > 0) {
        existing = existingCandJobs[0];
      }
    }

    // 3. Count questions available for this job
    const { count: questionsCount } = await admin
      .from("job_questions")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job_id);

    const totalQ = (questionsCount && questionsCount > 0) ? questionsCount : 5;
    let interviewId = existing?.id;

    if (existing) {
      // Update existing interview
      await admin
        .from("interviews")
        .update({
          application_id: application_id,
          total_questions: totalQ,
          status: "scheduled",
        })
        .eq("id", existing.id);
    } else {
      // Create new interview record
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

    // 4. Update application status to test_enabled
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

