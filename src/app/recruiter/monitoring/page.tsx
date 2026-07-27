"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRealtimeMonitoring, updateInterview } from "@/hooks/useSupabase";

interface LiveCandidate {
  id: string | number;
  name: string;
  job: string;
  question: number;
  total: number;
  elapsed: string;
  status: "answering" | "coding" | "paused" | "in_progress" | string;
  difficulty: "Easy" | "Medium" | "Hard" | string;
  violationsCount?: number;
}

interface CompletedCandidate {
  id: string | number;
  name: string;
  job: string;
  score: number;
  completedAt: string;
}

const mockLiveCandidates: LiveCandidate[] = [
  { id: "mock-1", name: "Bob Smith", job: "Full Stack Developer", question: 3, total: 5, elapsed: "12:34", status: "answering", difficulty: "Medium", violationsCount: 0 },
  { id: "mock-2", name: "Lisa Chen", job: "Senior Frontend Engineer", question: 1, total: 5, elapsed: "03:22", status: "answering", difficulty: "Easy", violationsCount: 1 },
  { id: "mock-3", name: "Mike Johnson", job: "Backend Engineer", question: 4, total: 5, elapsed: "18:50", status: "coding", difficulty: "Hard", violationsCount: 0 },
];

const mockRecentlyCompleted: CompletedCandidate[] = [
  { id: "mock-4", name: "Alice Johnson", job: "Senior Frontend Engineer", score: 92, completedAt: "2h ago" },
  { id: "mock-5", name: "Carol Williams", job: "Backend Engineer", score: 87, completedAt: "5h ago" },
  { id: "mock-6", name: "Eva Martinez", job: "DevOps Engineer", score: 68, completedAt: "1d ago" },
];

export default function MonitoringPage() {
  const { liveInterviews, completedInterviews, loading, isConnected, lastEvent } = useRealtimeMonitoring();
  const [localLive, setLocalLive] = useState<LiveCandidate[]>([]);
  const [localCompleted, setLocalCompleted] = useState<CompletedCandidate[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync real-time data from Supabase
  useEffect(() => {
    if (liveInterviews.length > 0) {
      const mappedLive: LiveCandidate[] = liveInterviews.map((item: any, index: number) => {
        const candidateName = item.profiles?.name || item.candidate_name || `Candidate #${String(item.candidate_id || index + 1).substring(0, 6)}`;
        const jobTitle = item.jobs?.title || item.job_title || "Software Engineer";
        const proctoring = item.proctoring_data || {};
        const violationsCount = proctoring.violations?.length || 0;
        
        return {
          id: item.id,
          name: candidateName,
          job: jobTitle,
          question: item.current_question || 2,
          total: item.total_questions || 5,
          elapsed: item.started_at ? formatElapsed(item.started_at) : "10:15",
          status: item.status || "in_progress",
          difficulty: item.difficulty || "Medium",
          violationsCount,
        };
      });
      setLocalLive(mappedLive);
    } else {
      setLocalLive(mockLiveCandidates);
    }

    if (completedInterviews.length > 0) {
      const mappedCompleted: CompletedCandidate[] = completedInterviews.map((item: any) => {
        const candidateName = item.profiles?.name || item.candidate_name || "Candidate";
        const jobTitle = item.jobs?.title || item.job_title || "Full Stack Engineer";
        const score = item.score ?? 85;
        const dateStr = item.completed_at ? formatRelativeTime(item.completed_at) : "Recently";
        
        return {
          id: item.id,
          name: candidateName,
          job: jobTitle,
          score,
          completedAt: dateStr,
        };
      });
      setLocalCompleted(mappedCompleted);
    } else {
      setLocalCompleted(mockRecentlyCompleted);
    }
  }, [liveInterviews, completedInterviews]);

  // Show Realtime Toast when events are emitted
  useEffect(() => {
    if (lastEvent) {
      setToastMessage(lastEvent);
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent]);

  // Action: Toggle Pause / Resume
  const handleTogglePause = async (candidate: LiveCandidate) => {
    const newStatus = candidate.status === "paused" ? "in_progress" : "paused";
    
    // Update local state instantly for crisp UX
    setLocalLive((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, status: newStatus } : c))
    );

    // Persist to Supabase if it's a real DB record
    if (typeof candidate.id === "string" && !candidate.id.startsWith("mock-")) {
      await updateInterview(candidate.id, { status: newStatus });
    }
  };

  // Action: Force Submit
  const handleForceSubmit = async (candidate: LiveCandidate) => {
    // Remove from live and add to completed locally
    setLocalLive((prev) => prev.filter((c) => c.id !== candidate.id));
    setLocalCompleted((prev) => [
      {
        id: candidate.id,
        name: candidate.name,
        job: candidate.job,
        score: Math.floor(Math.random() * 20) + 75, // placeholder evaluation score
        completedAt: "Just now",
      },
      ...prev,
    ]);

    // Persist to Supabase DB if it's a real DB record
    if (typeof candidate.id === "string" && !candidate.id.startsWith("mock-")) {
      await updateInterview(candidate.id, {
        status: "completed",
        completed_at: new Date().toISOString(),
      });
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Realtime Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-slide-down">
          <span className="relative flex size-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
          </span>
          <span>⚡ Realtime Event: <strong>{toastMessage}</strong></span>
        </div>
      )}

      {/* Header & Connection Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time view of ongoing interviews powered by Supabase Realtime</p>
        </div>

        {/* Supabase Realtime Status Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium self-start sm:self-auto">
          <span className="relative flex size-2.5">
            {isConnected ? (
              <>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full size-2.5 bg-emerald-500"></span>
              </>
            ) : (
              <span className="relative inline-flex rounded-full size-2.5 bg-amber-500 animate-pulse"></span>
            )}
          </span>
          <span className="text-slate-700 dark:text-slate-300">
            {isConnected ? "Supabase Realtime Subscribed" : "Connecting Realtime..."}
          </span>
        </div>
      </div>

      {/* Live Count Bar */}
      <div className="flex items-center gap-2">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-sm font-bold text-red-600">
          {localLive.length} Live Interview{localLive.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Live Candidates Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        </div>
      ) : localLive.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">videocam_off</span>
          <p className="text-slate-500 dark:text-slate-400 text-sm">No active interviews currently running.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {localLive.map((c) => {
            const isPaused = c.status === "paused";
            return (
              <div
                key={c.id}
                className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary transition-all shadow-sm hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.job}</p>
                    </div>
                  </div>
                  <span className="relative flex h-2.5 w-2.5">
                    {isPaused ? (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    ) : (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </>
                    )}
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Progress</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {c.question}/{c.total}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(c.question / c.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Elapsed: {c.elapsed}</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-full ${
                        c.difficulty === "Easy"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : c.difficulty === "Medium"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {c.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span
                      className={`font-medium capitalize ${
                        isPaused
                          ? "text-amber-600 font-bold"
                          : c.status === "coding"
                          ? "text-purple-600"
                          : "text-blue-600"
                      }`}
                    >
                      {isPaused
                        ? "⏸ Paused by Recruiter"
                        : c.status === "coding"
                        ? "Writing Code"
                        : "Typing Answer"}
                    </span>
                    {c.violationsCount !== undefined && c.violationsCount > 0 && (
                      <span className="text-[11px] font-bold text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">warning</span>
                        {c.violationsCount} Warning{c.violationsCount === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Recruiter Live Controls */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => handleTogglePause(c)}
                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1 ${
                      isPaused
                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isPaused ? "play_arrow" : "pause"}
                    </span>
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={() => handleForceSubmit(c)}
                    className="flex-1 bg-red-100 text-red-700 text-xs font-bold py-2 rounded-lg hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 transition-all flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-sm">stop</span> Force Submit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recently Completed Section */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recently Completed</h2>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Completed</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {localCompleted.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{c.name}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{c.job}</td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-bold ${c.score >= 85 ? "text-green-600" : c.score >= 70 ? "text-amber-600" : "text-red-500"}`}>
                      {c.score}/100
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{c.completedAt}</td>
                  <td className="px-5 py-4 text-right flex justify-end gap-2">
                    <Link href="/recruiter/reports" className="text-sm text-primary font-medium hover:underline">
                      Report
                    </Link>
                    <Link href="/recruiter/reports" className="text-sm text-slate-500 font-medium hover:underline">
                      Feedback
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Formatting Helpers ──
function formatElapsed(startedAt: string): string {
  const diffMs = Date.now() - new Date(startedAt).getTime();
  const mins = Math.floor(diffMs / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
