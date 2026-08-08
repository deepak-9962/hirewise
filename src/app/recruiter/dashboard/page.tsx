"use client";

import Link from "next/link";
import { useDashboardStats, useApplications, useJobs } from "@/hooks/useSupabase";
import { SkeletonDashboard } from "@/components/ui/Skeleton";

const appStatusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  under_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  shortlisted: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  test_enabled: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  test_completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  interview_scheduled: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  offered: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  rejected: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  hired: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  withdrawn: "bg-slate-100 text-slate-500",
};

const appStatusLabels: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  test_enabled: "Test Ready",
  test_completed: "Test Completed",
  interview_scheduled: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

export default function RecruiterDashboard() {
  const { stats: dashStats, loading: statsLoading } = useDashboardStats("recruiter");
  const { data: applicationsData, loading: appsLoading } = useApplications();
  const { data: jobsData, loading: jobsLoading } = useJobs("active");

  const applications = (applicationsData ?? []) as any[];
  const activeJobs = (jobsData ?? []) as any[];

  const stats = [
    { label: "Active Jobs", value: String(dashStats.activeJobs ?? activeJobs.length), icon: "work", color: "text-primary", bg: "bg-primary/10" },
    { label: "Total Applications", value: String(dashStats.totalApplications ?? applications.length), icon: "inbox", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
    { label: "Total Candidates", value: String(dashStats.totalCandidates ?? applications.length), icon: "group", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
    { label: "Tests Completed", value: String(dashStats.completed ?? 0), icon: "trending_up", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
  ];

  const recentApplications = applications.slice(0, 6);

  if (statsLoading || appsLoading || jobsLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruiter Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your hiring pipeline and applications</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/recruiter/ats" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-bold px-4 py-2.5 rounded-lg hover:bg-slate-200 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">view_kanban</span> ATS Pipeline
          </Link>
          <Link href="/recruiter/jobs" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">add</span> Create Job
          </Link>
        </div>
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Applications Received */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">Recent Applications</h2>
              <p className="text-xs text-slate-400 mt-0.5">Candidates who recently applied to your roles</p>
            </div>
            <Link href="/recruiter/ats" className="text-sm text-primary font-medium hover:underline flex items-center gap-1">
              View Pipeline <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentApplications.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <span className="material-symbols-outlined text-3xl block mb-2 text-slate-300">inbox</span>
                No applications received yet.
              </div>
            ) : (
              recentApplications.map((app: any) => (
                <div key={app.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">
                      {(app.profiles?.name || app.profiles?.email || "C").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.profiles?.name || app.profiles?.email || "Candidate"}</p>
                      <p className="text-xs text-slate-500">{app.jobs?.title ?? "Role"} · Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${appStatusColors[app.status] || "bg-blue-100 text-blue-700"}`}>
                      {appStatusLabels[app.status] || app.status}
                    </span>
                    <Link
                      href={`/recruiter/jobs/${app.job_id}`}
                      className="text-xs font-semibold text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Active Jobs</h2>
            <Link href="/recruiter/jobs" className="text-sm text-primary font-medium hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeJobs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">No active jobs</div>
            ) : (
              activeJobs.map((job: any) => (
                <div key={job.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.title}</p>
                    <Link href={`/recruiter/jobs/${job.id}`} className="text-xs text-primary font-medium hover:underline">View</Link>
                  </div>
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
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
