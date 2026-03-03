"use client";

import Link from "next/link";
import { useDashboardStats, useAllInterviews, useJobs } from "@/hooks/useSupabase";

export default function RecruiterDashboard() {
  const { stats: dashStats, loading: statsLoading } = useDashboardStats("recruiter");
  const { data: interviews, loading: interviewsLoading } = useAllInterviews();
  const { data: jobsData, loading: jobsLoading } = useJobs("active");

  const stats = [
    { label: "Active Jobs", value: String(dashStats.activeJobs ?? 0), icon: "work", color: "text-primary", bg: "bg-primary/10", trend: "" },
    { label: "Total Candidates", value: String(dashStats.totalCandidates ?? 0), icon: "group", color: "text-green-600", bg: "bg-green-50", trend: "" },
    { label: "Total Interviews", value: String(dashStats.totalInterviews ?? 0), icon: "videocam", color: "text-amber-600", bg: "bg-amber-50", trend: "" },
    { label: "Completed", value: String(dashStats.completed ?? 0), icon: "trending_up", color: "text-purple-600", bg: "bg-purple-50", trend: "" },
  ];

  const recentCandidates = ((interviews ?? []) as any[]).slice(0, 5);
  const activeJobs = (jobsData ?? []) as any[];

  if (statsLoading || interviewsLoading || jobsLoading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruiter Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your hiring pipeline</p>
        </div>
        <Link href="/recruiter/jobs" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Create Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent Candidates</h2>
            <Link href="/recruiter/monitoring" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentCandidates.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No interviews yet</div>
            )}
            {recentCandidates.map((c: any) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.profiles?.name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-500">{c.jobs?.title ?? "—"} · {new Date(c.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === "completed" && c.score !== null && (
                    <span className={`text-sm font-bold ${c.score >= 85 ? "text-green-600" : c.score >= 70 ? "text-amber-600" : "text-red-500"}`}>
                      {c.score}/100
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    c.status === "completed" ? "bg-green-100 text-green-700" :
                    c.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {c.status === "in-progress" ? "Live" : c.status === "scheduled" ? "Scheduled" : "Done"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Active Jobs</h2>
            <Link href="/recruiter/jobs" className="text-sm text-primary font-medium hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeJobs.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No active jobs</div>
            )}
            {activeJobs.map((job: any) => (
              <div key={job.id} className="p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{job.title}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{job.applicants_count ?? 0}</p>
                    <p className="text-[10px] text-slate-500">Applied</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{job.interviews_count ?? 0}</p>
                    <p className="text-[10px] text-slate-500">Interviews</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-primary">{job.avg_score ?? "—"}</p>
                    <p className="text-[10px] text-slate-500">Avg Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
