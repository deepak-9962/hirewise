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
} from "recharts";
import { useAnalyticsData } from "@/hooks/useAnalytics";

import { Skeleton } from "@/components/ui/Skeleton";

// ── Skeleton placeholder while loading ──
function ChartSkeleton() {
  return (
    <div className="h-[300px] flex flex-col justify-center gap-4 p-4 animate-pulse">
      <Skeleton height="200px" width="100%" rounded="rounded-xl" />
      <Skeleton height="20px" width="60%" />
    </div>
  );
}

// ── Empty state when a chart has no data ──
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-[300px]">
      <div className="flex flex-col items-center gap-2 text-slate-400">
        <span className="material-symbols-outlined text-4xl">bar_chart_off</span>
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
}

export default function RecruiterAnalyticsPage() {
  const { radarData, barData, lineData, completionData, summaryStats, loading, error } =
    useAnalyticsData();

  // Summary stat cards — driven by live data or zero-defaults
  const stats = [
    {
      label: "Avg Score",
      value: summaryStats ? summaryStats.avg_score.toFixed(1) : "—",
      delta: summaryStats ? "" : "No data",
      icon: "trending_up",
      up: true,
    },
    {
      label: "Completion Rate",
      value: summaryStats ? `${summaryStats.completion_rate}%` : "—",
      delta: summaryStats ? "" : "No data",
      icon: "check_circle",
      up: true,
    },
    {
      label: "Avg Time/Question",
      value: summaryStats ? `${summaryStats.avg_time_per_question.toFixed(1)}m` : "—",
      delta: summaryStats ? "" : "No data",
      icon: "timer",
      up: true,
    },
    {
      label: "Bias Alerts",
      value: summaryStats ? String(summaryStats.bias_alerts) : "—",
      delta: summaryStats
        ? summaryStats.bias_alerts === 0
          ? "No Risk"
          : summaryStats.bias_alerts <= 3
          ? "Low Risk"
          : "Review Needed"
        : "No data",
      icon: "warning",
      up: summaryStats ? summaryStats.bias_alerts === 0 : false,
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Deep insights into your hiring funnel performance</p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
          <span className="font-medium">Analytics error:</span> {error}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">{stat.icon}</span>
            </div>
            {loading ? (
              <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            ) : (
              <>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                {stat.delta && (
                  <p className={`text-xs mt-1 ${stat.up ? "text-green-600" : "text-amber-600"}`}>{stat.delta}</p>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar: Avg Score by Skill */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Average Score by Skill</h3>
          {loading ? (
            <ChartSkeleton />
          ) : radarData.length === 0 ? (
            <EmptyChart message="No skill score data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid strokeDasharray="3 3" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                <Radar name="Score" dataKey="score" stroke="#135bec" fill="#135bec" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Performance by Difficulty */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance by Difficulty</h3>
          {loading ? (
            <ChartSkeleton />
          ) : barData.length === 0 ? (
            <EmptyChart message="No difficulty data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="difficulty" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                />
                <Bar dataKey="avg" fill="#135bec" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line: Score Trend */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Weekly Score Trend</h3>
          {loading ? (
            <ChartSkeleton />
          ) : lineData.length === 0 ? (
            <EmptyChart message="No weekly score data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Line type="monotone" dataKey="score" stroke="#135bec" strokeWidth={2} dot={{ fill: "#135bec", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Bar: Completion Rate */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Interview Completion</h3>
          {loading ? (
            <ChartSkeleton />
          ) : completionData.length === 0 ? (
            <EmptyChart message="No completion data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={completionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
                <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="abandoned" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
