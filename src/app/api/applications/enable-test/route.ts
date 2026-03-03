import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/applications/enable-test
// Recruiter enables test for a candidate → create interview record + set status
export async function POST(req: NextRequest) {
  const { application_id, candidate_id, job_id } = await req.json();

  if (!application_id || !candidate_id || !job_id) {
    return NextResponse.json({ error: "application_id, candidate_id, job_id required" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Check if interview already exists for this application
  const { data: existing } = await admin
    .from("interviews")
    .select("id")
    .eq("application_id", application_id)
    .single();

  if (existing) {
    // Update application status
    await admin.from("applications").update({ status: "test_enabled" }).eq("id", application_id);
    return NextResponse.json({ interview_id: existing.id });
  }

  // Get job for type info
  const { data: job } = await admin.from("jobs").select("title").eq("id", job_id).single();

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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update application status
  await admin.from("applications").update({ status: "test_enabled" }).eq("id", application_id);

  return NextResponse.json({ interview_id: interview.id, job_title: job?.title });
}
