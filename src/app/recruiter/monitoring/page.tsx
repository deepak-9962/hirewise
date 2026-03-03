"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────────
interface LiveInterview {
  id: string;
  candidate_id: string;
  job_id: string;
  status: string;
  current_question: number;
  total_questions: number;
  elapsed_seconds: number;
  is_paused: boolean;
  started_at: string;
  type: string;
  jobs: { id: string; title: string; department?: string } | null;
  profile: { id: string; name: string; email: string; avatar_url?: string } | null;
}
interface CompletedInterview {
  id: string;
  candidate_id: string;
  score: number;
  completed_at: string;
  current_question: number;
  total_questions: number;
  jobs: { id: string; title: string } | null;
  profile: { id: string; name: string; email: string; avatar_url?: string } | null;
  reportId: string | null;
}
interface Stats {
  liveCount: number;
  pausedCount: number;
  completedToday: number;
  avgScoreToday: number;
}

// ── Helpers ────────────────────────────────────────────────────────
function formatElapsed(secs: number) {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}
function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
function scoreColor(score: number) {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-500";
}

// ── Main ───────────────────────────────────────────────────────────
export default function MonitoringPage() {
  const [live, setLive] = useState<LiveInterview[]>([]);
  const [completed, setCompleted] = useState<CompletedInterview[]>([]);
  const [stats, setStats] = useState<Stats>({ liveCount: 0, pausedCount: 0, completedToday: 0, avgScoreToday: 0 });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [confirmForceSubmit, setConfirmForceSubmit] = useState<LiveInterview | null>(null);

  // local elapsed tick map: interviewId → localElapsed (starts at elapsed_seconds, +1/s if not paused)
  const elapsedRef = useRef<Record<string, number>>({});
  const [, setTick] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/monitoring");
      if (!res.ok) return;
      const json = await res.json();
      setLive(json.live ?? []);
      setCompleted(json.completed ?? []);
      setStats(json.stats ?? { liveCount: 0, pausedCount: 0, completedToday: 0, avgScoreToday: 0 });
      setLastUpdated(new Date());
      const map = { ...elapsedRef.current };
      for (const i of (json.live ?? [])) {
        if ((map[i.id] ?? 0) < i.elapsed_seconds) {
          map[i.id] = i.elapsed_seconds;
        }
      }
      elapsedRef.current = map;
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 5 seconds
  useEffect(() => {
    fetchData();
    const pollId = setInterval(fetchData, 5000);
    return () => clearInterval(pollId);
  }, [fetchData]);

  // Tick elapsed every second for non-paused live interviews
  useEffect(() => {
    const tickId = setInterval(() => {
      const map = elapsedRef.current;
      for (const i of live) {
        if (!i.is_paused) {
          map[i.id] = (map[i.id] ?? i.elapsed_seconds) + 1;
        }
      }
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(tickId);
  }, [live]);

  // ── Actions ──────────────────────────────────────────────────────
  const doAction = async (id: string, action: "pause" | "resume" | "force_submit") => {
    setActioning(id);
    await fetch(`/api/monitoring/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setActioning(null);
    setConfirmForceSubmit(null);
    await fetchData();
  };

  return (
    <div className="animate-fade-in">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Monitoring</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time view of all active and completed interviews</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">Updated {timeAgo(lastUpdated.toISOString())}</span>
          )}
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>Refresh
          </button>
        </div>
      </div>

      {/* ── Stats row ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Live Now", value: stats.liveCount, icon: "sensors", color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Paused", value: stats.pausedCount, icon: "pause_circle", color: "text-amber-600", bg: "bg-amber-500/10" },
          { label: "Completed Today", value: stats.completedToday, icon: "check_circle", color: "text-green-600", bg: "bg-green-500/10" },
          { label: "Avg Score Today", value: stats.avgScoreToday > 0 ? `${stats.avgScoreToday}/100` : "—", icon: "bar_chart", color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-4">
            <div className={`size-10 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${s.color} text-xl`}>{s.icon}</span>
            </div>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Live Indicator ──────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {stats.liveCount > 0 ? (
            <>
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
              </span>
              <span className="text-sm font-bold text-red-600">{stats.liveCount} Live Interview{stats.liveCount !== 1 ? "s" : ""}</span>
            </>
          ) : (
            <span className="text-sm font-medium text-slate-400">No active interviews right now</span>
          )}
        </div>
        <span className="text-xs text-slate-400">Auto-refreshes every 5s</span>
      </div>

      {/* ── Live Cards ──────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 animate-pulse">
              <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-1/2 mb-4" />
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : live.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center mb-8">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-2">videocam_off</span>
          <p className="text-sm text-slate-400">No interviews in progress. Active sessions will appear here in real time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {live.map((c) => {
            const elapsed = elapsedRef.current[c.id] ?? c.elapsed_seconds;
            const pct = c.total_questions > 0 ? Math.round((c.current_question / c.total_questions) * 100) : 0;
            const isActioning = actioning === c.id;

            return (
              <div key={c.id} className={`bg-white dark:bg-slate-800/50 rounded-xl border transition-all ${c.is_paused ? "border-amber-300 dark:border-amber-700" : "border-slate-200 dark:border-slate-700 hover:border-primary"}`}>
                {/* Card Header */}
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                      {c.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.profile.avatar_url} alt={c.profile.name} className="size-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-primary text-sm">person</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{c.profile?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500 truncate">{c.jobs?.title ?? "—"}</p>
                    </div>
                  </div>
                  {c.is_paused ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full shrink-0">
                      <span className="material-symbols-outlined text-xs">pause</span> Paused
                    </span>
                  ) : (
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                  )}
                </div>

                {/* Progress */}
                <div className="px-4 pb-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Question Progress</span>
                    <span className="font-bold text-slate-900 dark:text-white">{c.current_question}/{c.total_questions}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${c.is_paused ? "bg-amber-400" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      <span className={`font-mono font-semibold ${c.is_paused ? "text-amber-600" : "text-slate-700 dark:text-slate-300"}`}>
                        {formatElapsed(elapsed)}
                      </span>
                    </span>
                    <span className="font-medium text-slate-500">{pct}% done</span>
                  </div>
                  {c.jobs?.department && (
                    <p className="text-xs text-slate-400">{c.jobs.department} · {c.type}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 px-4 pb-4">
                  {c.is_paused ? (
                    <button
                      onClick={() => doAction(c.id, "resume")}
                      disabled={isActioning}
                      className="flex-1 bg-green-100 text-green-700 text-xs font-bold py-2 rounded-lg hover:bg-green-200 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isActioning ? (
                        <span className="size-3 border-2 border-green-600/30 border-t-green-600 rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm">play_arrow</span>
                      )}
                      Resume
                    </button>
                  ) : (
                    <button
                      onClick={() => doAction(c.id, "pause")}
                      disabled={isActioning}
                      className="flex-1 bg-amber-100 text-amber-700 text-xs font-bold py-2 rounded-lg hover:bg-amber-200 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                    >
                      {isActioning ? (
                        <span className="size-3 border-2 border-amber-600/30 border-t-amber-600 rounded-full animate-spin" />
                      ) : (
                        <span className="material-symbols-outlined text-sm">pause</span>
                      )}
                      Pause
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmForceSubmit(c)}
                    disabled={isActioning}
                    className="flex-1 bg-red-100 text-red-700 text-xs font-bold py-2 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                    Force Submit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Recently Completed ────────────────────────────── */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recently Completed</h2>
        <span className="text-xs text-slate-400">Last 48 hours</span>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-8 flex justify-center">
          <div className="size-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : completed.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">history</span>
          <p className="text-sm text-slate-400">No completed interviews in the last 48 hours.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Questions</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Completed</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {completed.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {c.profile?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.profile.avatar_url} alt={c.profile.name} className="size-full object-cover" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-sm">person</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.profile?.name ?? "Unknown"}</p>
                        <p className="text-xs text-slate-400">{c.profile?.email ?? ""}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500 max-w-[160px] truncate">{c.jobs?.title ?? "—"}</td>
                  <td className="px-5 py-3.5 text-center">
                    {c.score != null ? (
                      <span className={`text-sm font-bold ${scoreColor(c.score)}`}>{Math.round(c.score)}/100</span>
                    ) : (
                      <span className="text-sm text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center text-sm text-slate-500">
                    {c.current_question}/{c.total_questions}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-400">
                    {c.completed_at ? timeAgo(c.completed_at) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {c.reportId ? (
                      <Link
                        href={`/recruiter/reports/${c.reportId}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg hover:bg-primary/20 transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">description</span>
                        View Report
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Report pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Force Submit Confirm Modal ─────────────────────── */}
      {confirmForceSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm w-full shadow-2xl">
            <div className="size-12 rounded-xl bg-red-100 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-red-600 text-2xl">assignment_turned_in</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-1">Force Submit Interview?</h2>
            <p className="text-sm text-slate-500 text-center mb-4">
              This will immediately end the interview for{" "}
              <span className="font-semibold text-slate-800 dark:text-white">
                {confirmForceSubmit.profile?.name ?? "this candidate"}
              </span>{" "}
              and mark it as completed. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmForceSubmit(null)}
                className="flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => doAction(confirmForceSubmit.id, "force_submit")}
                disabled={actioning === confirmForceSubmit.id}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {actioning === confirmForceSubmit.id ? (
                  <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Force Submit"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

