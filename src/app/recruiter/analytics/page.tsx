"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import { useRecruiterAnalytics } from "@/hooks/useSupabase";

export default function RecruiterAnalyticsPage() {
  const { data, loading } = useRecruiterAnalytics();

  const summary = data?.summary ?? {};
  const funnelData: any[] = data?.funnelData ?? [];
  const weeklyTrend: any[] = data?.weeklyTrend ?? [];
  const scoreBuckets: any[] = data?.scoreBuckets ?? [];
  const skillRadar: any[] = data?.skillRadar ?? [];
  const topJobs: any[] = data?.topJobs ?? [];

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Avg Score",
      value: summary.avgScore ? `${summary.avgScore}` : "—",
      sub: summary.totalReports ? `from ${summary.totalReports} reports` : "No reports yet",
      icon: "trending_up",
      up: true,
    },
    {
      label: "Completion Rate",
      value: summary.completionRate !== undefined ? `${summary.completionRate}%` : "—",
      sub: "tests enabled → completed",
      icon: "check_circle",
      up: (summary.completionRate ?? 0) >= 70,
    },
    {
      label: "Total Applications",
      value: String(summary.totalApplications ?? 0),
      sub: "across all jobs",
      icon: "inbox",
      up: true,
    },
    {
      label: "Bias Alerts",
      value: String(summary.activeBiasAlerts ?? 0),
      sub: summary.activeBiasAlerts === 0 ? "All clear" : "Need review",
      icon: "warning",
      up: summary.activeBiasAlerts === 0,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time insights into your hiring funnel</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.up ? "text-green-600" : "text-amber-600"}`}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Application Funnel */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Application Pipeline Funnel</h3>
          {funnelData.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No application data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} width={100} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#135bec" radius={[0, 4, 4, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Skill Radar */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Average Scores by Category</h3>
          {skillRadar.every((d) => d.score === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No report scores yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillRadar}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Radar name="Score" dataKey="score" stroke="#135bec" fill="#135bec" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Weekly Application Trend */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Weekly Application Trend</h3>
          {weeklyTrend.every((d) => d.applications === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No applications yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="applications" stroke="#135bec" strokeWidth={2} dot={{ fill: "#135bec", r: 4 }} name="Applied" />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} dot={{ fill: "#22c55e", r: 4 }} name="Completed" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score Distribution */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Score Distribution</h3>
          {scoreBuckets.every((d) => d.count === 0) ? (
            <div className="flex items-center justify-center h-[300px] text-sm text-slate-400">No scores recorded yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={scoreBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Candidates" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Jobs by Applications */}
      {topJobs.length > 0 && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Top Jobs by Applications</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topJobs}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="title" tick={{ fontSize: 11, fill: "#94a3b8" }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
