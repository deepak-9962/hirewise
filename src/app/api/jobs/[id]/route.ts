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

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch all interview IDs associated with this job
    const { data: interviews } = await supabaseAdmin
      .from("interviews")
      .select("id")
      .eq("job_id", id);

    const interviewIds = (interviews ?? []).map((i: any) => i.id).filter(Boolean);

    if (interviewIds.length > 0) {
      // Clean up interview-dependent records
      await Promise.all([
        supabaseAdmin.from("interview_responses").delete().in("interview_id", interviewIds),
        supabaseAdmin.from("reports").delete().in("interview_id", interviewIds),
        supabaseAdmin.from("ai_evaluations").delete().in("interview_id", interviewIds),
        supabaseAdmin.from("bias_alerts").delete().in("interview_id", interviewIds),
      ]).catch((e) => console.warn("Interview sub-records delete cleanup:", e));

      // Delete interviews
      await supabaseAdmin.from("interviews").delete().eq("job_id", id);
    }

    // 2. Clean up job_questions, applications, and questions for this job
    await Promise.all([
      supabaseAdmin.from("job_questions").delete().eq("job_id", id),
      supabaseAdmin.from("applications").delete().eq("job_id", id),
      supabaseAdmin.from("questions").delete().eq("job_id", id),
    ]).catch((e) => console.warn("Job sub-records delete cleanup:", e));

    // 3. Delete the job row itself
    const { error } = await supabaseAdmin.from("jobs").delete().eq("id", id);

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
