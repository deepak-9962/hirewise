"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useApplicationStats, useAllApplications, useJobs } from "@/hooks/useSupabase";

const appStatusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  test_enabled: "bg-green-100 text-green-700",
  test_completed: "bg-purple-100 text-purple-700",
  rejected: "bg-red-100 text-red-600",
  hired: "bg-emerald-100 text-emerald-700",
};

const appStatusLabels: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  test_enabled: "Test Enabled",
  test_completed: "Test Done",
  rejected: "Rejected",
  hired: "Hired",
};

export default function RecruiterDashboard() {
  const { stats, loading: statsLoading, refetch: refetchStats } = useApplicationStats();
  const { data: applicationsData, loading: appsLoading, refetch: refetchApps } = useAllApplications(10);
  const { data: jobsData, loading: jobsLoading } = useJobs("active");

  const applications = (applicationsData ?? []) as any[];
  const activeJobs = (jobsData ?? []) as any[];

  // Also refetch when window regains focus (navigating back from another tab/page)
  useEffect(() => {
    const onFocus = () => { refetchStats(); refetchApps(); };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refetchStats, refetchApps]);

  const statCards = [
    { label: "Active Jobs", value: String(stats.activeJobs ?? 0), icon: "work", color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Applications", value: String(stats.totalApplications ?? 0), icon: "inbox", color: "text-green-600", bg: "bg-green-50" },
    { label: "Tests Enabled", value: String(stats.testsEnabled ?? 0), icon: "quiz", color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Tests Completed", value: String(stats.testsCompleted ?? 0), icon: "trending_up", color: "text-purple-600", bg: "bg-purple-50" },
  ];

  if (statsLoading || appsLoading || jobsLoading) {
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
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Applications */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent Applications</h2>
            <Link href="/recruiter/jobs" className="text-sm text-primary font-medium hover:underline">View Jobs</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {applications.length === 0 && (
              <div className="p-8 text-center text-sm text-slate-400">No applications yet</div>
            )}
            {applications.map((app: any) => (
              <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.profiles?.name ?? "Unknown"}</p>
                    <p className="text-xs text-slate-500">
                      {app.jobs?.title ?? "—"}
                      {app.jobs?.department ? ` · ${app.jobs.department}` : ""}
                      {" · "}{new Date(app.applied_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${appStatusColors[app.status] ?? "bg-slate-100 text-slate-500"}`}>
                    {appStatusLabels[app.status] ?? app.status}
                  </span>
                  {app.jobs?.id && (
                    <Link href={`/recruiter/jobs/${app.jobs.id}?tab=applications`} className="text-xs text-primary hover:underline font-medium">Review</Link>
                  )}
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
            {activeJobs.map((job: any) => {
              const jobApps = applications.filter((a: any) => a.jobs?.id === job.id || a.job_id === job.id);
              const testsDone = jobApps.filter((a: any) => a.status === "test_completed").length;
              return (
                <div key={job.id} className="p-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2 truncate">{job.title}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{jobApps.length}</p>
                      <p className="text-[10px] text-slate-500">Applied</p>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{testsDone}</p>
                      <p className="text-[10px] text-slate-500">Tests Done</p>
                    </div>
                    <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                      <Link href={`/recruiter/jobs/${job.id}`} className="text-sm font-bold text-primary">View</Link>
                      <p className="text-[10px] text-slate-500">Manage</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
