"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCandidateInterviews } from "@/hooks/useSupabase";

interface InterviewRow {
  id: string;
  status: string;
  type: string;
  score: number | null;
  scheduled_at: string | null;
  completed_at: string | null;
  jobs?: { title: string; department: string } | null;
}

export default function CandidateInterviewsPage() {
  const { user } = useAuth();
  const { data, loading } = useCandidateInterviews(user?.id);
  const allInterviews = (data as InterviewRow[] | null) || [];
  const upcoming = allInterviews.filter((i) => i.status === "scheduled" || i.status === "in-progress");
  const completed = allInterviews.filter((i) => i.status === "completed");

  const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";
  const fmtTime = (d: string | null) => d ? new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "";

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Interviews</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage your upcoming and past interviews</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
          <p className="text-slate-500 mt-3">Loading interviews...</p>
        </div>
      ) : (
        <>
          {/* Upcoming */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">event</span> Upcoming
            </h2>
            {upcoming.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {upcoming.map((interview) => (
                  <div key={interview.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-primary transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{interview.jobs?.title || "Interview"}</h3>
                        <p className="text-sm text-slate-500">{interview.jobs?.department || ""}</p>
                      </div>
                      <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{interview.type || "Technical"}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">calendar_today</span> {fmtDate(interview.scheduled_at)}
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">schedule</span> {fmtTime(interview.scheduled_at)}
                      </span>
                    </div>
                    <Link href={`/interview/${interview.id}`} className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined text-sm">videocam</span> Join Interview
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-10 text-center">
                <span className="material-symbols-outlined text-slate-300 text-4xl mb-2">event_busy</span>
                <p className="text-slate-500">No upcoming interviews</p>
              </div>
            )}
          </div>

          {/* History */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-slate-400">history</span> Past Interviews
            </h2>
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Department</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Type</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                  {completed.length > 0 ? completed.map((interview) => (
                    <tr key={interview.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{interview.jobs?.title || "Interview"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{interview.jobs?.department || "—"}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{fmtDate(interview.completed_at)}</td>
                      <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{interview.type || "Technical"}</span></td>
                      <td className="px-5 py-4">
                        <span className={`text-sm font-bold ${(interview.score ?? 0) >= 85 ? "text-green-600" : (interview.score ?? 0) >= 70 ? "text-amber-600" : "text-red-500"}`}>
                          {interview.score != null ? `${Math.round(interview.score)}/100` : "—"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link href="/candidate/reports" className="text-sm text-primary font-medium hover:underline">View Report</Link>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No completed interviews yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
