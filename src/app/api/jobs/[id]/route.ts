import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from("jobs").select("*").eq("id", id).maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing job id" }, { status: 400 });

  const updates = await req.json();
  const supabaseAdmin = getSupabaseAdmin();
  const { error } = await supabaseAdmin.from("jobs").update(updates).eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Missing job id" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // 1. Fetch application IDs for this job
    const { data: apps } = await admin
      .from("applications")
      .select("id")
      .eq("job_id", id);
    const appIds = (apps ?? []).map((a: any) => a.id).filter(Boolean);

    // 2. Fetch interview IDs for this job
    const { data: interviews } = await admin
      .from("interviews")
      .select("id")
      .eq("job_id", id);
    const interviewIds = (interviews ?? []).map((i: any) => i.id).filter(Boolean);

    // 3. Clean up interview sub-records
    if (interviewIds.length > 0) {
      await admin.from("interview_responses").delete().in("interview_id", interviewIds);
      await admin.from("reports").delete().in("interview_id", interviewIds);
      await admin.from("ai_evaluations").delete().in("interview_id", interviewIds);
      await admin.from("bias_alerts").delete().in("interview_id", interviewIds);
    }

    // 4. Clean up application sub-records
    if (appIds.length > 0) {
      await admin.from("pipeline_notes").delete().in("application_id", appIds);
      await admin.from("resume_scores").delete().in("application_id", appIds);
    }

    // 5. Clean up interviews, job_questions, applications
    await admin.from("interviews").delete().eq("job_id", id);
    await admin.from("job_questions").delete().eq("job_id", id);
    await admin.from("applications").delete().eq("job_id", id);

    // 6. Unlink questions associated with this job (set job_id = null instead of deleting shared questions)
    await admin.from("questions").update({ job_id: null }).eq("job_id", id);

    // 7. Delete the job row itself
    const { error } = await admin.from("jobs").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete job row:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE /api/jobs/[id] error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete job" }, { status: 500 });
  }
}
