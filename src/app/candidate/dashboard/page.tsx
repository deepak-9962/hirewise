"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCandidateInterviews, useCandidateReports, useOpenJobs, applyToJob } from "@/hooks/useSupabase";

export default function CandidateDashboard() {
  const { user, profile } = useAuth();
  const { data: interviews, loading: interviewsLoading, refetch: refetchInterviews } = useCandidateInterviews(user?.id);
  const { data: reports, loading: reportsLoading } = useCandidateReports(user?.id);
  const { data: openJobsData, loading: jobsLoading, refetch: refetchJobs } = useOpenJobs();
  const [applyingTo, setApplyingTo] = useState<string | null>(null);
  const [applyMessage, setApplyMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const allInterviews = (interviews as Record<string, unknown>[] | null) || [];
  const upcoming = allInterviews.filter((i) => i.status === "scheduled");
  const completed = allInterviews.filter((i) => i.status === "completed");
  const allReports = (reports as Record<string, unknown>[] | null) || [];
  const avgScore = completed.length > 0
    ? Math.round(completed.reduce((sum, i) => sum + (Number(i.score) || 0), 0) / completed.length * 10) / 10
    : 0;
  const skills = profile?.skills || [];

  const isLoading = interviewsLoading || reportsLoading;
  const displayName = profile?.name || user?.email?.split("@")[0] || "there";

  // Open jobs posted by recruiters (exclude jobs already applied to)
  const appliedJobIds = new Set(allInterviews.map((i) => String(i.job_id)));
  const openJobs = ((openJobsData as Record<string, unknown>[] | null) || []).filter(
    (job) => !appliedJobIds.has(String(job.id))
  );

  const handleApply = async (jobId: string) => {
    if (!user) return;
    setApplyingTo(jobId);
    setApplyMessage(null);
    const { error } = await applyToJob(jobId, user.id);
    if (error) {
      setApplyMessage({ type: "error", text: typeof error === "string" ? error : "Failed to apply. Please try again." });
    } else {
      setApplyMessage({ type: "success", text: "Applied successfully! Check your upcoming interviews." });
      refetchInterviews();
      refetchJobs();
    }
    setApplyingTo(null);
    setTimeout(() => setApplyMessage(null), 4000);
  };
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {displayName.split(" ")[0]}</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Here&#39;s an overview of your interview activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Interviews", value: String(allInterviews.length), icon: "videocam", color: "text-primary", bg: "bg-primary/10" },
          { label: "Average Score", value: String(avgScore), icon: "trending_up", color: "text-green-600", bg: "bg-green-50" },
          { label: "Upcoming", value: String(upcoming.length), icon: "event", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Reports Ready", value: String(allReports.length), icon: "description", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Open Positions — Browse & Apply */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Open Positions</h2>
              <span className="text-xs text-slate-400">{openJobs.length} available</span>
            </div>
            {applyMessage && (
              <div className={`mx-5 mt-4 px-4 py-2.5 rounded-lg text-sm font-medium ${applyMessage.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                {applyMessage.text}
              </div>
            )}
            <div className="max-h-[420px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700 scrollbar-thin">
              {jobsLoading ? (
                <div className="p-10 text-center text-slate-400">
                  <span className="animate-spin material-symbols-outlined text-3xl">progress_activity</span>
                  <p className="mt-2">Loading open positions...</p>
                </div>
              ) : openJobs.length > 0 ? openJobs.map((job) => (
                <div key={String(job.id)} className="p-5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="size-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-primary">work</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">{String(job.title)}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{String(job.department || "General")} · {String(job.type || "Full-time")}</p>
                        {(job.target_skills as string[])?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {(job.target_skills as string[]).slice(0, 4).map((skill) => (
                              <span key={skill} className="bg-primary/10 text-primary text-[11px] font-medium px-2 py-0.5 rounded-full">{skill}</span>
                            ))}
                            {(job.target_skills as string[]).length > 4 && (
                              <span className="text-[11px] text-slate-400">+{(job.target_skills as string[]).length - 4} more</span>
                            )}
                          </div>
                        )}
                        {job.description && (
                          <p className="text-xs text-slate-400 mt-2 line-clamp-2">{String(job.description)}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleApply(String(job.id))}
                      disabled={applyingTo === String(job.id)}
                      className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex-shrink-0 flex items-center gap-1.5"
                    >
                      {applyingTo === String(job.id) ? (
                        <>
                          <span className="animate-spin material-symbols-outlined text-sm">progress_activity</span>
                          Applying...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-sm">send</span>
                          Apply
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">work_off</span>
                  <p>No open positions right now</p>
                  <p className="text-xs mt-1">Check back later for new opportunities</p>
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Upcoming Interviews</h2>
              <Link href="/candidate/interviews" className="text-sm text-primary font-medium hover:underline">View all</Link>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {isLoading ? (
                <div className="p-10 text-center text-slate-400">
                  <span className="animate-spin material-symbols-outlined text-3xl">progress_activity</span>
                  <p className="mt-2">Loading...</p>
                </div>
              ) : upcoming.length > 0 ? upcoming.map((interview) => (
                <div key={String(interview.id)} className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">videocam</span>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{(interview.jobs as Record<string, string>)?.title || "Interview"}</p>
                      <p className="text-sm text-slate-500">{new Date(String(interview.scheduled_at)).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Link href={`/interview/${interview.id}`} className="bg-primary text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all">
                    Join
                  </Link>
                </div>
              )) : (
                <div className="p-10 text-center text-slate-400">
                  <span className="material-symbols-outlined text-4xl mb-2">event_busy</span>
                  <p>No upcoming interviews</p>
                  <p className="text-xs mt-1">Apply to a position above to get started</p>
                </div>
              )}
            </div>
          </div>

          {/* Interview History */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white">Interview History</h2>
              <Link href="/candidate/reports" className="text-sm text-primary font-medium hover:underline">View reports</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Company</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {completed.map((interview) => (
                    <tr key={String(interview.id)} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{(interview.jobs as Record<string, string>)?.title || "Interview"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{(interview.jobs as Record<string, string>)?.department || "-"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{interview.completed_at ? new Date(String(interview.completed_at)).toLocaleDateString() : "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${Number(interview.score) >= 85 ? "text-green-600" : Number(interview.score) >= 70 ? "text-amber-600" : "text-red-500"}`}>
                          {String(interview.score ?? "-")}/100
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href={`/candidate/reports`} className="text-sm text-primary font-medium hover:underline">View Report</Link>
                      </td>
                    </tr>
                  ))}
                  {completed.length === 0 && (
                    <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-400">No completed interviews yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="text-center mb-5">
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-primary text-3xl">person</span>
              </div>
              <h3 className="font-bold text-slate-900 dark:text-white">{profile?.name || user?.email?.split("@")[0] || "User"}</h3>
              <p className="text-sm text-slate-500">{profile?.email || user?.email}</p>
            </div>
            <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Skills</p>
              <div className="flex flex-wrap gap-2">
                {skills.length > 0 ? skills.map((skill) => (
                  <span key={skill} className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full">{skill}</span>
                )) : (
                  <p className="text-sm text-slate-400">No skills added yet</p>
                )}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Resume</p>
              <div className="border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-4 text-center">
                <span className="material-symbols-outlined text-slate-400 text-2xl">upload_file</span>
                <p className="text-sm text-slate-500 mt-1">resume_john_doe.pdf</p>
                <button className="text-xs text-primary font-medium mt-2 hover:underline">Upload new</button>
              </div>
            </div>
          </div>

          {/* Score Trend */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Score Trend</h3>
            <div className="space-y-3">
              {completed.length > 0 ? completed.slice(0, 5).map((interview) => (
                <div key={String(interview.id)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-slate-500 truncate mr-2">{(interview.jobs as Record<string, string>)?.title || "Interview"}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{String(interview.score ?? 0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full animate-progress ${Number(interview.score) >= 85 ? "bg-green-500" : Number(interview.score) >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                      style={{ width: `${interview.score ?? 0}%` }}
                    ></div>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-slate-400 text-center py-4">No scores yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
