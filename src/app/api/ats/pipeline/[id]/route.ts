import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// PATCH /api/ats/pipeline/[id] — Move application to new stage
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { status } = body;

  const validStatuses = [
    "applied", "under_review", "shortlisted", "test_enabled",
    "test_completed", "interview_scheduled", "offered", "hired",
    "rejected", "withdrawn",
  ];

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid pipeline stage" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  // Get current application
  const { data: app, error: fetchError } = await admin
    .from("applications")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !app) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Update status
  const { data, error } = await admin
    .from("applications")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If moving to test_enabled, auto-create interview if not exists
  if (status === "test_enabled") {
    const { data: existing } = await admin
      .from("interviews")
      .select("id")
      .eq("application_id", id)
      .single();

    if (!existing) {
      await admin.from("interviews").insert({
        candidate_id: app.candidate_id,
        job_id: app.job_id,
        application_id: id,
        status: "scheduled",
        type: "Technical",
        scheduled_at: new Date().toISOString(),
      });
    }
  }

  return NextResponse.json(data);
}
