import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/applications/stats — recruiter dashboard counts
export async function GET() {
  const admin = getSupabaseAdmin();

  const [appsRes, activeJobsRes] = await Promise.all([
    admin.from("applications").select("status"),
    admin.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  if (appsRes.error) return NextResponse.json({ error: appsRes.error.message }, { status: 500 });

  const apps = appsRes.data ?? [];
  return NextResponse.json({
    totalApplications: apps.length,
    testsEnabled: apps.filter((a) =>
      ["test_enabled", "test_completed"].includes(a.status)
    ).length,
    testsCompleted: apps.filter((a) => a.status === "test_completed").length,
    hired: apps.filter((a) => a.status === "hired").length,
    activeJobs: activeJobsRes.count ?? 0,
  });
}
