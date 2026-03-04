import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// POST /api/ats/bulk — Bulk update application statuses
export async function POST(req: NextRequest) {
  const { application_ids, status } = await req.json();

  const validStatuses = [
    "applied", "under_review", "shortlisted", "test_enabled",
    "test_completed", "interview_scheduled", "offered", "hired",
    "rejected", "withdrawn",
  ];

  if (!Array.isArray(application_ids) || application_ids.length === 0) {
    return NextResponse.json({ error: "application_ids array required" }, { status: 400 });
  }

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid pipeline stage" }, { status: 400 });
  }

  const admin = getSupabaseAdmin();

  const { data, error } = await admin
    .from("applications")
    .update({ status })
    .in("id", application_ids)
    .select();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If moving to test_enabled, create interviews for all
  if (status === "test_enabled" && data) {
    for (const app of data as any[]) {
      const { data: existing } = await admin
        .from("interviews")
        .select("id")
        .eq("application_id", app.id)
        .single();

      if (!existing) {
        await admin.from("interviews").insert({
          candidate_id: app.candidate_id,
          job_id: app.job_id,
          application_id: app.id,
          status: "scheduled",
          type: "Technical",
          scheduled_at: new Date().toISOString(),
        });
      }
    }
  }

  return NextResponse.json({ updated: data?.length ?? 0 });
}
