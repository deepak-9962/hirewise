import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/reports/all — all report entries with candidate name and job title
export async function GET() {
  const admin = getSupabaseAdmin();

  const { data: reports, error } = await admin
    .from("reports")
    .select("*, interviews(id, job_id, jobs(title))")
    .order("generated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!reports || reports.length === 0) return NextResponse.json([]);

  // Manually join profiles (candidate_id FK may point to auth.users)
  const candidateIds = [...new Set(reports.map((r) => r.candidate_id).filter(Boolean))];
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, email")
    .in("id", candidateIds);
  const profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));

  const merged = reports.map((r) => ({
    ...r,
    profiles: profileMap[r.candidate_id] ?? null,
  }));

  return NextResponse.json(merged);
}
