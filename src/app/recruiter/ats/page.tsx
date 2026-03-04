"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useJobs } from "@/hooks/useSupabase";
import {
  PIPELINE_STAGES,
  STAGE_CONFIG,
  TERMINAL_STAGES,
  type PipelineStage,
  type PipelineApplication,
  type ATSViewMode,
  type ATSFilters,
} from "@/types/ats";
import CandidatePanel from "./CandidatePanel";

function getScoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800";
  if (score >= 60) return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
  return "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
}

function getRecommendationBadge(rec: string) {
  const map: Record<string, { label: string; color: string }> = {
    strong_match: { label: "Strong", color: "text-emerald-700 bg-emerald-100 dark:bg-emerald-900/30" },
    good_match: { label: "Good", color: "text-blue-700 bg-blue-100 dark:bg-blue-900/30" },
    partial_match: { label: "Partial", color: "text-amber-700 bg-amber-100 dark:bg-amber-900/30" },
    weak_match: { label: "Weak", color: "text-red-700 bg-red-100 dark:bg-red-900/30" },
  };
  return map[rec] ?? { label: rec, color: "text-slate-600 bg-slate-100" };
}

export default function ATSPipelinePage() {
  const { user } = useAuth();
  const { data: jobsData } = useJobs();
  const jobs = (jobsData ?? []) as any[];

  const [applications, setApplications] = useState<PipelineApplication[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ATSViewMode>("kanban");
  const [selectedApp, setSelectedApp] = useState<PipelineApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStage, setBulkStage] = useState<PipelineStage>("under_review");
  const [draggedApp, setDraggedApp] = useState<string | null>(null);
  const [scoringIds, setScoringIds] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<ATSFilters>({
    jobId: "all",
    search: "",
    stages: [],
    sortBy: "applied_at",
    sortOrder: "desc",
  });

  // Fetch pipeline data
  const fetchPipeline = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.jobId !== "all") params.set("job_id", filters.jobId);
      if (filters.search) params.set("search", filters.search);

      const res = await fetch(`/api/ats/pipeline?${params.toString()}`);
      const data = await res.json();
      setApplications(data.applications ?? []);
      setStats(data.stats ?? null);
    } catch {
      setApplications([]);
    }
    setLoading(false);
  }, [filters.jobId, filters.search]);

  useEffect(() => {
    fetchPipeline();
  }, [fetchPipeline]);

  // Filter & sort
  const filteredApps = useMemo(() => {
    let result = [...applications];

    // Filter by stages
    if (filters.stages.length > 0) {
      result = result.filter((a) => filters.stages.includes(a.status));
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (filters.sortBy) {
        case "applied_at":
          cmp = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
          break;
        case "name":
          cmp = (a.profiles?.name ?? "").localeCompare(b.profiles?.name ?? "");
          break;
        case "score":
          cmp = (a.interviews?.score ?? 0) - (b.interviews?.score ?? 0);
          break;
        case "ats_score":
          cmp = (a.resume_score?.overall_score ?? -1) - (b.resume_score?.overall_score ?? -1);
          break;
        case "status":
          cmp = PIPELINE_STAGES.indexOf(a.status) - PIPELINE_STAGES.indexOf(b.status);
          break;
      }
      return filters.sortOrder === "desc" ? -cmp : cmp;
    });

    return result;
  }, [applications, filters.stages, filters.sortBy, filters.sortOrder]);

  // Group by stage for Kanban
  const stageGroups = useMemo(() => {
    const groups: Record<PipelineStage, PipelineApplication[]> = {} as any;
    for (const stage of PIPELINE_STAGES) {
      groups[stage] = [];
    }
    // Also include rejected/withdrawn
    groups.rejected = [];
    groups.withdrawn = [];

    for (const app of filteredApps) {
      if (groups[app.status]) {
        groups[app.status].push(app);
      } else {
        groups.applied.push(app); // fallback
      }
    }
    return groups;
  }, [filteredApps]);

  // Move application to new stage
  const moveToStage = async (appId: string, newStage: PipelineStage) => {
    setActionLoading(appId);
    try {
      const res = await fetch(`/api/ats/pipeline/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStage }),
      });
      if (res.ok) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStage } : a))
        );
        if (selectedApp?.id === appId) {
          setSelectedApp((prev) => prev ? { ...prev, status: newStage } : null);
        }
      }
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  // Bulk move
  const handleBulkMove = async () => {
    if (selectedIds.size === 0) return;
    setActionLoading("bulk");
    try {
      await fetch("/api/ats/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_ids: [...selectedIds], status: bulkStage }),
      });
      await fetchPipeline();
      setSelectedIds(new Set());
    } catch { /* ignore */ }
    setActionLoading(null);
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Drag handlers for Kanban
  const handleDragStart = (appId: string) => {
    setDraggedApp(appId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (stage: PipelineStage) => {
    if (draggedApp) {
      moveToStage(draggedApp, stage);
      setDraggedApp(null);
    }
  };

  // Score a single resume
  const scoreOneResume = async (appId: string) => {
    setScoringIds((prev) => new Set(prev).add(appId));
    try {
      const res = await fetch("/api/ai/resume-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: appId }),
      });
      if (res.ok) {
        const data = await res.json();
        const score = data.scores?.[0];
        if (score) {
          setApplications((prev) =>
            prev.map((a) => (a.id === appId ? { ...a, resume_score: score } : a))
          );
          if (selectedApp?.id === appId) {
            setSelectedApp((prev) => prev ? { ...prev, resume_score: score } : null);
          }
        }
      }
    } catch { /* ignore */ }
    setScoringIds((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
  };

  // Score all selected resumes
  const scoreSelectedResumes = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    for (const id of ids) {
      setScoringIds((prev) => new Set(prev).add(id));
    }
    try {
      const res = await fetch("/api/ai/resume-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_ids: ids }),
      });
      if (res.ok) {
        await fetchPipeline();
      }
    } catch { /* ignore */ }
    setScoringIds(new Set());
  };

  // Active (non-terminal) stages for Kanban
  const kanbanStages = PIPELINE_STAGES;
  const rejectedApps = stageGroups.rejected ?? [];
  const withdrawnApps = stageGroups.withdrawn ?? [];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">view_kanban</span>
            ATS Pipeline
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Track and manage all candidates across your hiring pipeline
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
            {(["kanban", "list"] as ATSViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === mode
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                <span className="material-symbols-outlined text-base">
                  {mode === "kanban" ? "view_kanban" : "view_list"}
                </span>
                {mode === "kanban" ? "Board" : "List"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {[
            { label: "Total", value: stats.total, icon: "people", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "In Review", value: (stats.byStage?.under_review ?? 0) + (stats.byStage?.shortlisted ?? 0), icon: "visibility", color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-900/20" },
            { label: "Testing", value: (stats.byStage?.test_enabled ?? 0) + (stats.byStage?.test_completed ?? 0), icon: "quiz", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/20" },
            { label: "Hired", value: stats.byStage?.hired ?? 0, icon: "handshake", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
            { label: "Conversion", value: `${stats.conversionRate ?? 0}%`, icon: "trending_up", color: "text-primary", bg: "bg-blue-50 dark:bg-blue-900/20" },
          ].map((s) => (
            <div key={s.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex items-center gap-3">
              <div className={`size-9 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${s.color} text-lg`}>{s.icon}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        {/* Job filter */}
        <select
          value={filters.jobId}
          onChange={(e) => setFilters((f) => ({ ...f, jobId: e.target.value }))}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Jobs</option>
          {jobs.map((j: any) => (
            <option key={j.id} value={j.id}>{j.title}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            placeholder="Search candidates, jobs..."
            value={filters.search}
            onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        {/* Sort */}
        <select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split("-") as [any, any];
            setFilters((f) => ({ ...f, sortBy, sortOrder }));
          }}
          className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="applied_at-desc">Newest first</option>
          <option value="applied_at-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="score-desc">Highest score</option>
          <option value="score-asc">Lowest score</option>
          <option value="ats_score-desc">ATS Score ↓</option>
          <option value="ats_score-asc">ATS Score ↑</option>
        </select>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
            <span className="text-xs font-bold text-primary">{selectedIds.size} selected</span>
            <select
              value={bulkStage}
              onChange={(e) => setBulkStage(e.target.value as PipelineStage)}
              className="text-xs border border-slate-200 dark:border-slate-700 rounded px-2 py-1 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {PIPELINE_STAGES.map((s) => (
                <option key={s} value={s}>{STAGE_CONFIG[s].label}</option>
              ))}
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={handleBulkMove}
              disabled={actionLoading === "bulk"}
              className="text-xs font-bold bg-primary text-white px-3 py-1 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {actionLoading === "bulk" ? "..." : "Move"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
            <button
              onClick={scoreSelectedResumes}
              disabled={scoringIds.size > 0}
              className="text-xs font-bold bg-violet-600 text-white px-3 py-1 rounded-lg hover:bg-violet-700 disabled:opacity-50 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">auto_awesome</span>
              {scoringIds.size > 0 ? "Scoring..." : "Score All"}
            </button>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : applications.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">inbox</span>
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-400">No applications yet</h3>
          <p className="text-sm text-slate-400 mt-1">Applications will appear here when candidates apply to your jobs.</p>
        </div>
      ) : viewMode === "kanban" ? (
        /* ── Kanban Board ── */
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {kanbanStages.map((stage) => {
              const config = STAGE_CONFIG[stage];
              const apps = stageGroups[stage] ?? [];
              const isDropTarget = draggedApp !== null;

              return (
                <div
                  key={stage}
                  className={`w-72 shrink-0 rounded-xl border ${config.bgColor} transition-all ${
                    isDropTarget ? "ring-2 ring-primary/30" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(stage)}
                >
                  {/* Column header */}
                  <div className="p-3 border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`material-symbols-outlined text-lg ${config.color}`}>{config.icon}</span>
                        <h3 className={`text-sm font-bold ${config.color}`}>{config.label}</h3>
                      </div>
                      <span className="text-xs font-bold bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                        {apps.length}
                      </span>
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 max-h-[600px] overflow-y-auto">
                    {apps.length === 0 ? (
                      <div className="p-4 text-center">
                        <p className="text-xs text-slate-400">No candidates</p>
                      </div>
                    ) : (
                      apps.map((app) => (
                        <KanbanCard
                          key={app.id}
                          app={app}
                          isSelected={selectedIds.has(app.id)}
                          isLoading={actionLoading === app.id}
                          isScoring={scoringIds.has(app.id)}
                          onSelect={() => toggleSelection(app.id)}
                          onClick={() => setSelectedApp(app)}
                          onDragStart={() => handleDragStart(app.id)}
                          onScoreResume={() => scoreOneResume(app.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Rejected column (collapsed) */}
            {(rejectedApps.length > 0 || withdrawnApps.length > 0) && (
              <div className="w-60 shrink-0 rounded-xl border bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                <div className="p-3 border-b border-red-200/50 dark:border-red-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-red-500">cancel</span>
                      <h3 className="text-sm font-bold text-red-600 dark:text-red-400">Rejected / Withdrawn</h3>
                    </div>
                    <span className="text-xs font-bold bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
                      {rejectedApps.length + withdrawnApps.length}
                    </span>
                  </div>
                </div>
                <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto"
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop("rejected")}
                >
                  {[...rejectedApps, ...withdrawnApps].map((app) => (
                    <KanbanCard
                      key={app.id}
                      app={app}
                      isSelected={selectedIds.has(app.id)}
                      isLoading={actionLoading === app.id}
                      isScoring={scoringIds.has(app.id)}
                      onSelect={() => toggleSelection(app.id)}
                      onClick={() => setSelectedApp(app)}
                      onDragStart={() => handleDragStart(app.id)}
                      onScoreResume={() => scoreOneResume(app.id)}
                      compact
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ── List View ── */
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_1fr_120px_80px_80px_140px] gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <div>
              <input
                type="checkbox"
                checked={selectedIds.size === filteredApps.length && filteredApps.length > 0}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedIds(new Set(filteredApps.map((a) => a.id)));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
                className="rounded"
              />
            </div>
            <div>Candidate</div>
            <div>Job</div>
            <div>Stage</div>
            <div>Score</div>
            <div>ATS</div>
            <div>Applied</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {filteredApps.map((app) => {
              const config = STAGE_CONFIG[app.status] ?? STAGE_CONFIG.applied;
              return (
                <div
                  key={app.id}
                  className="grid grid-cols-[40px_1fr_1fr_120px_80px_80px_140px] gap-3 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  onClick={() => setSelectedApp(app)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(app.id)}
                      onChange={() => toggleSelection(app.id)}
                      className="rounded"
                    />
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {app.profiles?.name ?? "Unknown"}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{app.profiles?.email ?? "—"}</p>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 dark:text-slate-300 truncate">{app.jobs?.title ?? "—"}</p>
                    <p className="text-xs text-slate-400 truncate">{app.jobs?.department ?? ""}</p>
                  </div>
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full inline-block ${config.bgColor.split(" ").slice(0, 1).join(" ")} ${config.color}`}>
                      {config.label}
                    </span>
                  </div>
                  <div>
                    {app.interviews?.score != null ? (
                      <span className={`text-sm font-bold ${
                        app.interviews.score >= 80 ? "text-emerald-600" :
                        app.interviews.score >= 60 ? "text-amber-600" : "text-red-500"
                      }`}>
                        {app.interviews.score}%
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </div>
                  <div>
                    {app.resume_score ? (
                      <span className={`text-sm font-bold ${
                        app.resume_score.overall_score >= 80 ? "text-emerald-600" :
                        app.resume_score.overall_score >= 60 ? "text-amber-600" : "text-red-500"
                      }`}>
                        {app.resume_score.overall_score}%
                      </span>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); scoreOneResume(app.id); }}
                        disabled={scoringIds.has(app.id)}
                        className="text-[10px] text-violet-600 hover:text-violet-800 font-medium"
                      >
                        {scoringIds.has(app.id) ? "..." : "Score"}
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                    <span className="material-symbols-outlined text-slate-300 group-hover:text-primary text-base transition-colors">
                      chevron_right
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Candidate Detail Panel */}
      {selectedApp && (
        <CandidatePanel
          app={selectedApp}
          onClose={() => setSelectedApp(null)}
          onMoveStage={moveToStage}
          currentUserId={user?.id}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
}

// ── Kanban Card Component ──
function KanbanCard({
  app,
  isSelected,
  isLoading,
  isScoring,
  onSelect,
  onClick,
  onDragStart,
  onScoreResume,
  compact,
}: {
  app: PipelineApplication;
  isSelected: boolean;
  isLoading: boolean;
  isScoring: boolean;
  onSelect: () => void;
  onClick: () => void;
  onDragStart: () => void;
  onScoreResume: () => void;
  compact?: boolean;
}) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group/card ${
        isSelected ? "ring-2 ring-primary" : ""
      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
    >
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onClick={(e) => e.stopPropagation()}
          className="rounded mt-0.5 shrink-0"
        />
        <div className="flex-1 min-w-0" onClick={onClick}>
          <div className="flex items-center justify-between gap-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {app.profiles?.name ?? "Unknown"}
            </p>
            {/* ATS Score badge */}
            {app.resume_score ? (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${getScoreColor(app.resume_score.overall_score)}`}>
                {app.resume_score.overall_score}
              </span>
            ) : (
              <button
                onClick={(e) => { e.stopPropagation(); onScoreResume(); }}
                disabled={isScoring}
                className="opacity-0 group-hover/card:opacity-100 transition-opacity text-[10px] text-violet-600 hover:text-violet-800 font-medium px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-900/20 shrink-0"
              >
                {isScoring ? (
                  <span className="material-symbols-outlined text-xs animate-spin">progress_activity</span>
                ) : (
                  <span className="flex items-center gap-0.5"><span className="material-symbols-outlined text-xs">auto_awesome</span>ATS</span>
                )}
              </button>
            )}
          </div>
          {!compact && (
            <>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                {app.jobs?.title ?? "—"}
              </p>
              {app.profiles?.skills && app.profiles.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {app.profiles.skills.slice(0, 3).map((s) => (
                    <span key={s} className="text-[10px] bg-primary/10 text-primary font-medium px-1.5 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                  {app.profiles.skills.length > 3 && (
                    <span className="text-[10px] text-slate-400">+{app.profiles.skills.length - 3}</span>
                  )}
                </div>
              )}
              {app.interviews?.score != null && (
                <div className="mt-2 flex items-center gap-1.5">
                  <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        app.interviews.score >= 80 ? "bg-emerald-500" :
                        app.interviews.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${app.interviews.score}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-slate-500">{app.interviews.score}%</span>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-400">
                  {new Date(app.applied_at).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  {app.resume_score && (
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${getRecommendationBadge(app.resume_score.recommendation).color}`}>
                      {getRecommendationBadge(app.resume_score.recommendation).label}
                    </span>
                  )}
                  {(app.notes?.length ?? 0) > 0 && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-xs">chat_bubble</span>
                      {app.notes!.length}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
