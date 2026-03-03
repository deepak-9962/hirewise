import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/monitoring — live + recently completed interviews
export async function GET() {
  const admin = getSupabaseAdmin();

  // ── Live: in-progress interviews ──────────────────────────
  const { data: live, error: liveErr } = await admin
    .from("interviews")
    .select("id, job_id, candidate_id, status, current_question, total_questions, elapsed_seconds, is_paused, started_at, type, jobs(id, title, department)")
    .eq("status", "in-progress")
    .order("started_at", { ascending: false });

  if (liveErr) {
    return NextResponse.json({ error: liveErr.message }, { status: 500 });
  }

  // ── Recently completed: last 48h ──────────────────────────
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: completed } = await admin
    .from("interviews")
    .select("id, candidate_id, job_id, score, completed_at, total_questions, current_question, jobs(id, title)")
    .eq("status", "completed")
    .gte("completed_at", cutoff)
    .order("completed_at", { ascending: false })
    .limit(30);

  // ── Pull all unique candidate IDs & fetch profiles ───────
  const allRows = [...(live ?? []), ...(completed ?? [])];
  const candidateIds = [...new Set(allRows.map((r) => r.candidate_id).filter(Boolean))];

  let profileMap: Record<string, { id: string; name: string; email: string; avatar_url: string }> = {};
  if (candidateIds.length > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, name, email, avatar_url")
      .in("id", candidateIds);
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }

  // ── Fetch reports for completed interviews (to build "View Report" link) ──
  const completedIds = (completed ?? []).map((c) => c.id);
  let reportMap: Record<string, string> = {};
  if (completedIds.length > 0) {
    const { data: reports } = await admin
      .from("reports")
      .select("id, interview_id")
      .in("interview_id", completedIds);
    reportMap = Object.fromEntries((reports ?? []).map((r) => [r.interview_id, r.id]));
  }

  // ── Today stats ───────────────────────────────────────────
  const todayCutoff = new Date();
  todayCutoff.setHours(0, 0, 0, 0);
  const { data: todayCompleted } = await admin
    .from("interviews")
    .select("score")
    .eq("status", "completed")
    .gte("completed_at", todayCutoff.toISOString());

  const todayCount = todayCompleted?.length ?? 0;
  const avgScore =
    todayCount > 0
      ? Math.round(
          (todayCompleted ?? []).reduce((s, r) => s + (r.score ?? 0), 0) / todayCount
        )
      : 0;

  return NextResponse.json({
    live: (live ?? []).map((i) => ({ ...i, profile: profileMap[i.candidate_id] ?? null })),
    completed: (completed ?? []).map((i) => ({
      ...i,
      profile: profileMap[i.candidate_id] ?? null,
      reportId: reportMap[i.id] ?? null,
    })),
    stats: {
      liveCount: (live ?? []).length,
      pausedCount: (live ?? []).filter((i) => i.is_paused).length,
      completedToday: todayCount,
      avgScoreToday: avgScore,
    },
  });
}
