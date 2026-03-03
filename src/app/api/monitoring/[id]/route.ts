import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// PATCH /api/monitoring/[id]
// body: { action: "pause" | "resume" | "force_submit" }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { action } = await req.json();
  const admin = getSupabaseAdmin();

  if (action === "pause") {
    const { error } = await admin
      .from("interviews")
      .update({ is_paused: true })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, is_paused: true });
  }

  if (action === "resume") {
    const { error } = await admin
      .from("interviews")
      .update({ is_paused: false })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, is_paused: false });
  }

  if (action === "force_submit") {
    const { error } = await admin
      .from("interviews")
      .update({ status: "completed", completed_at: new Date().toISOString(), is_paused: false })
      .eq("id", id)
      .eq("status", "in-progress");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, status: "completed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
