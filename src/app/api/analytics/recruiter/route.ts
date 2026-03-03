import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// GET /api/analytics/recruiter — all analytics data for the recruiter dashboard
export async function GET() {
  const admin = getSupabaseAdmin();

  const [appsRes, interviewsRes, reportsRes, jobsRes, alertsRes] = await Promise.all([
    admin.from("applications").select("status, applied_at, job_id"),
    admin.from("interviews").select("status, score, created_at, job_id"),
    admin.from("reports").select("overall_score, technical_score, communication_score, reasoning_score, generated_at"),
    admin.from("jobs").select("id, title, status"),
    admin.from("bias_alerts").select("id, dismissed"),
  ]);

  const apps = appsRes.data ?? [];
  const interviews = interviewsRes.data ?? [];
  const reports = reportsRes.data ?? [];
  const jobs = jobsRes.data ?? [];
  const alerts = alertsRes.data ?? [];

  // ── Summary stats ──
  const totalApps = apps.length;
  const testCompleted = apps.filter((a) => a.status === "test_completed").length;
  const testEnabled = apps.filter((a) =>
    ["test_enabled", "test_completed"].includes(a.status)
  ).length;
  const completionRate =
    testEnabled > 0 ? Math.round((testCompleted / testEnabled) * 100) : 0;

  const scores = reports
    .map((r) => r.overall_score)
    .filter((s): s is number => typeof s === "number" && s > 0);
  const avgScore =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

  const activeBiasAlerts = alerts.filter((a) => !a.dismissed).length;

  // ── Application funnel (by status) ──
  const statusOrder = [
    "applied",
    "under_review",
    "test_enabled",
    "test_completed",
    "hired",
    "rejected",
  ];
  const statusLabels: Record<string, string> = {
    applied: "Applied",
    under_review: "Under Review",
    test_enabled: "Test Enabled",
    test_completed: "Test Done",
    hired: "Hired",
    rejected: "Rejected",
  };
  const funnelData = statusOrder.map((s) => ({
    status: statusLabels[s],
    count: apps.filter((a) => a.status === s).length,
  }));

  // ── Weekly application trend (last 8 weeks) ──
  const now = new Date();
  const weeklyMap: Record<string, { applications: number; completed: number }> = {};
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const label = `W${8 - i}`;
    weeklyMap[label] = { applications: 0, completed: 0 };
  }
  apps.forEach((a) => {
    const d = new Date(a.applied_at);
    const weeksAgo = Math.floor(
      (now.getTime() - d.getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    if (weeksAgo >= 0 && weeksAgo < 8) {
      const label = `W${8 - weeksAgo}`;
      if (weeklyMap[label]) {
        weeklyMap[label].applications += 1;
        if (a.status === "test_completed" || a.status === "hired") {
          weeklyMap[label].completed += 1;
        }
      }
    }
  });
  const weeklyTrend = Object.entries(weeklyMap).map(([week, v]) => ({
    week,
    ...v,
  }));

  // ── Score distribution (from reports entries) ──
  const scoreBuckets = [
    { range: "0-50", count: 0 },
    { range: "51-65", count: 0 },
    { range: "66-75", count: 0 },
    { range: "76-85", count: 0 },
    { range: "86-100", count: 0 },
  ];
  scores.forEach((s) => {
    if (s <= 50) scoreBuckets[0].count++;
    else if (s <= 65) scoreBuckets[1].count++;
    else if (s <= 75) scoreBuckets[2].count++;
    else if (s <= 85) scoreBuckets[3].count++;
    else scoreBuckets[4].count++;
  });

  // ── Skill scores (technical, communication, reasoning) ──
  const avgOf = (arr: (number | null | undefined)[]) => {
    const nums = arr.filter((n): n is number => typeof n === "number" && n > 0);
    return nums.length > 0
      ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length)
      : 0;
  };
  const skillRadar = [
    { subject: "Technical", score: avgOf(reports.map((r) => r.technical_score)) },
    { subject: "Communication", score: avgOf(reports.map((r) => r.communication_score)) },
    { subject: "Reasoning", score: avgOf(reports.map((r) => r.reasoning_score)) },
    { subject: "Overall", score: avgScore },
  ];

  // ── Top jobs by applications ──
  const jobAppCount: Record<string, number> = {};
  apps.forEach((a) => {
    jobAppCount[a.job_id] = (jobAppCount[a.job_id] ?? 0) + 1;
  });
  const topJobs = jobs
    .map((j) => ({ title: j.title.length > 22 ? j.title.slice(0, 22) + "…" : j.title, count: jobAppCount[j.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return NextResponse.json({
    summary: {
      avgScore,
      completionRate,
      totalApplications: totalApps,
      activeBiasAlerts,
      totalReports: reports.length,
    },
    funnelData,
    weeklyTrend,
    scoreBuckets,
    skillRadar,
    topJobs,
  });
}
