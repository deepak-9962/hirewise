"use client";

import { useState, useEffect } from "react";
import {
  PIPELINE_STAGES,
  STAGE_CONFIG,
  TERMINAL_STAGES,
  type PipelineStage,
  type PipelineApplication,
  type PipelineNote,
  type ResumeScoreData,
} from "@/types/ats";

interface CandidatePanelProps {
  app: PipelineApplication;
  onClose: () => void;
  onMoveStage: (appId: string, stage: PipelineStage) => Promise<void>;
  currentUserId?: string;
  actionLoading: string | null;
}

export default function CandidatePanel({
  app,
  onClose,
  onMoveStage,
  currentUserId,
  actionLoading,
}: CandidatePanelProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "timeline">("overview");
  const [notes, setNotes] = useState<PipelineNote[]>(app.notes ?? []);
  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [moveTarget, setMoveTarget] = useState<PipelineStage>(app.status);
  const [resumeScore, setResumeScore] = useState<ResumeScoreData | null>(app.resume_score ?? null);
  const [scoring, setScoring] = useState(false);

  const config = STAGE_CONFIG[app.status] ?? STAGE_CONFIG.applied;
  const isTerminal = TERMINAL_STAGES.includes(app.status);

  // Fetch fresh notes
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/ats/notes?application_id=${app.id}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) setNotes(data);
        }
      } catch { /* silent */ }
    };
    fetchNotes();
  }, [app.id]);

  const handleAddNote = async () => {
    if (!newNote.trim() || !currentUserId) return;
    setAddingNote(true);
    try {
      const res = await fetch("/api/ats/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          application_id: app.id,
          author_id: currentUserId,
          content: newNote.trim(),
        }),
      });
      if (res.ok) {
        const note = await res.json();
        setNotes((prev) => [note, ...prev]);
        setNewNote("");
      }
    } catch { /* silent */ }
    setAddingNote(false);
  };

  const handleMoveStage = async () => {
    if (moveTarget === app.status) return;
    await onMoveStage(app.id, moveTarget);
  };

  const handleScoreResume = async () => {
    setScoring(true);
    try {
      const res = await fetch("/api/ai/resume-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: app.id }),
      });
      const data = await res.json();
      if (res.ok) {
        const score = data.scores?.[0];
        if (score) setResumeScore(score);
      } else {
        alert("Scoring failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Scoring failed: " + (err.message || "Network error"));
    }
    setScoring(false);
  };

  // Quick action buttons for common next stages
  const getNextActions = (): { stage: PipelineStage; label: string; icon: string; color: string }[] => {
    switch (app.status) {
      case "applied":
        return [
          { stage: "under_review", label: "Start Review", icon: "visibility", color: "bg-amber-600 hover:bg-amber-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      case "under_review":
        return [
          { stage: "shortlisted", label: "Shortlist", icon: "star", color: "bg-cyan-600 hover:bg-cyan-700" },
          { stage: "test_enabled", label: "Enable Test", icon: "quiz", color: "bg-indigo-600 hover:bg-indigo-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      case "shortlisted":
        return [
          { stage: "test_enabled", label: "Enable Test", icon: "quiz", color: "bg-indigo-600 hover:bg-indigo-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      case "test_completed":
        return [
          { stage: "interview_scheduled", label: "Schedule Interview", icon: "event", color: "bg-orange-600 hover:bg-orange-700" },
          { stage: "offered", label: "Make Offer", icon: "local_offer", color: "bg-teal-600 hover:bg-teal-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      case "interview_scheduled":
        return [
          { stage: "offered", label: "Make Offer", icon: "local_offer", color: "bg-teal-600 hover:bg-teal-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      case "offered":
        return [
          { stage: "hired", label: "Mark Hired", icon: "handshake", color: "bg-emerald-600 hover:bg-emerald-700" },
          { stage: "rejected", label: "Reject", icon: "cancel", color: "bg-red-600 hover:bg-red-700" },
        ];
      default:
        return [];
    }
  };

  const nextActions = getNextActions();

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-slate-900 z-50 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-2xl">person</span>
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {app.profiles?.name ?? "Unknown Candidate"}
                </h2>
                <p className="text-sm text-slate-400 truncate">{app.profiles?.email ?? "—"}</p>
                {app.profiles?.phone && (
                  <p className="text-xs text-slate-400">{app.profiles.phone}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Current Stage + Job */}
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${config.bgColor} ${config.color}`}>
              <span className="material-symbols-outlined text-xs mr-1 align-middle">{config.icon}</span>
              {config.label}
            </span>
            <span className="text-xs text-slate-400">for</span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {app.jobs?.title ?? "Unknown Job"}
            </span>
            <span className="text-xs text-slate-400">
              ({app.jobs?.department ?? ""})
            </span>
          </div>

          {/* Quick Actions */}
          {nextActions.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {nextActions.map((action) => (
                <button
                  key={action.stage}
                  onClick={() => onMoveStage(app.id, action.stage)}
                  disabled={actionLoading === app.id}
                  className={`text-xs font-bold text-white px-3 py-1.5 rounded-lg ${action.color} transition-all disabled:opacity-50 flex items-center gap-1`}
                >
                  <span className="material-symbols-outlined text-xs">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 shrink-0">
          {(["overview", "notes", "timeline"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px capitalize transition-all ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {tab}
              {tab === "notes" && notes.length > 0 && (
                <span className="ml-1 text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">{notes.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* ── Overview Tab ── */}
          {activeTab === "overview" && (
            <div className="space-y-5">
              {/* Candidate Info */}
              <section>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Candidate Info</h3>
                <div className="space-y-2.5">
                  {[
                    { icon: "location_on", label: "Location", value: app.profiles?.location },
                    { icon: "work_history", label: "Experience", value: app.profiles?.experience },
                    { icon: "calendar_today", label: "Applied", value: new Date(app.applied_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) },
                  ].filter(i => i.value).map((item) => (
                    <div key={item.label} className="flex items-center gap-3 text-sm">
                      <span className="material-symbols-outlined text-slate-400 text-lg">{item.icon}</span>
                      <span className="text-slate-500 w-24 shrink-0">{item.label}</span>
                      <span className="text-slate-900 dark:text-white">{item.value}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Skills */}
              {app.profiles?.skills && app.profiles.skills.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {app.profiles.skills.map((s) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </section>
              )}

              {/* Cover Note */}
              {app.cover_note && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cover Note</h3>
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300 italic">
                    &quot;{app.cover_note}&quot;
                  </div>
                </section>
              )}

              {/* Test Score */}
              {app.interviews && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Test Results</h3>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-300">Status</span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        app.interviews.status === "completed" ? "bg-green-100 text-green-700" :
                        app.interviews.status === "in-progress" ? "bg-amber-100 text-amber-700" :
                        "bg-slate-100 text-slate-500"
                      }`}>
                        {app.interviews.status}
                      </span>
                    </div>
                    {app.interviews.score != null && (
                      <div>
                        <div className="flex items-center justify-between  mb-1">
                          <span className="text-sm text-slate-600 dark:text-slate-300">Score</span>
                          <span className={`text-lg font-bold ${
                            app.interviews.score >= 80 ? "text-emerald-600" :
                            app.interviews.score >= 60 ? "text-amber-600" : "text-red-500"
                          }`}>
                            {app.interviews.score}%
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full animate-progress ${
                              app.interviews.score >= 80 ? "bg-emerald-500" :
                              app.interviews.score >= 60 ? "bg-amber-500" : "bg-red-500"
                            }`}
                            style={{ width: `${app.interviews.score}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {app.interviews.completed_at && (
                      <p className="text-xs text-slate-400 mt-2">
                        Completed {new Date(app.interviews.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* AI Summary */}
              {app.reports?.ai_summary && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">AI Summary</h3>
                  <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-3 text-sm text-slate-700 dark:text-slate-300">
                    {app.reports.ai_summary}
                  </div>
                </section>
              )}

              {/* Resume ATS Score */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resume ATS Score</h3>
                  <button
                    onClick={handleScoreResume}
                    disabled={scoring}
                    className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1 disabled:opacity-50"
                  >
                    {scoring ? (
                      <><span className="size-3 border-2 border-violet-400/30 border-t-violet-600 rounded-full animate-spin" /> Scoring...</>
                    ) : resumeScore ? (
                      <><span className="material-symbols-outlined text-xs">refresh</span> Re-score</>
                    ) : (
                      <><span className="material-symbols-outlined text-xs">auto_awesome</span> Score Resume</>
                    )}
                  </button>
                </div>

                {resumeScore ? (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
                    {/* Overall score gauge */}
                    <div className="flex items-center gap-4">
                      <div className={`size-16 rounded-full border-4 flex items-center justify-center shrink-0 ${
                        resumeScore.overall_score >= 80 ? "border-emerald-500 text-emerald-600" :
                        resumeScore.overall_score >= 60 ? "border-amber-500 text-amber-600" :
                        "border-red-500 text-red-500"
                      }`}>
                        <span className="text-lg font-bold">{resumeScore.overall_score}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Overall Match</p>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                          resumeScore.recommendation === "strong_match" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30" :
                          resumeScore.recommendation === "good_match" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30" :
                          resumeScore.recommendation === "partial_match" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30" :
                          "bg-red-100 text-red-700 dark:bg-red-900/30"
                        }`}>
                          {resumeScore.recommendation.replace("_", " ")}
                        </span>
                      </div>
                    </div>

                    {/* Score breakdowns */}
                    <div className="space-y-2.5">
                      {[
                        { label: "Skill Match", score: resumeScore.skill_match_score, icon: "code" },
                        { label: "Experience", score: resumeScore.experience_score, icon: "work_history" },
                        { label: "Education", score: resumeScore.education_score, icon: "school" },
                      ].map((item) => (
                        <div key={item.label}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">{item.icon}</span>
                              {item.label}
                            </span>
                            <span className={`font-bold ${
                              item.score >= 80 ? "text-emerald-600" :
                              item.score >= 60 ? "text-amber-600" : "text-red-500"
                            }`}>{item.score}%</span>
                          </div>
                          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.score >= 80 ? "bg-emerald-500" :
                                item.score >= 60 ? "bg-amber-500" : "bg-red-500"
                              }`}
                              style={{ width: `${item.score}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Keyword matches */}
                    {resumeScore.keyword_matches && resumeScore.keyword_matches.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeScore.keyword_matches.map((kw) => (
                            <span key={kw} className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 font-medium px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing skills */}
                    {resumeScore.missing_skills && resumeScore.missing_skills.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 mb-2">Missing Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {resumeScore.missing_skills.map((sk) => (
                            <span key={sk} className="text-[10px] bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-medium px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* AI Summary */}
                    {resumeScore.ai_summary && (
                      <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-800 rounded-lg p-3 text-xs text-slate-700 dark:text-slate-300">
                        {resumeScore.ai_summary}
                      </div>
                    )}

                    {/* Scored at */}
                    {resumeScore.scored_at && (
                      <p className="text-[10px] text-slate-400">
                        Scored {new Date(resumeScore.scored_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
                    <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">auto_awesome</span>
                    <p className="text-sm text-slate-400">
                      Click &ldquo;Score Resume&rdquo; to analyze this candidate&apos;s resume against the job requirements using AI.
                    </p>
                  </div>
                )}
              </section>

              {/* Resume Link */}
              {(app.resume_url || app.profiles?.resume_url) && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Resume</h3>
                  <button
                    onClick={async () => {
                      const path = app.resume_url || app.profiles?.resume_url;
                      try {
                        const res = await fetch(`/api/candidate/resume-url?path=${encodeURIComponent(path!)}`);
                        const data = await res.json();
                        if (data.url) {
                          window.open(data.url, "_blank");
                        } else {
                          alert("Failed to load resume: " + (data.error || "Unknown error"));
                        }
                      } catch {
                        alert("Failed to load resume");
                      }
                    }}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <span className="material-symbols-outlined text-base">description</span>
                    View Resume
                    <span className="material-symbols-outlined text-base">open_in_new</span>
                  </button>
                </section>
              )}

              {/* Move to Stage */}
              {!isTerminal && (
                <section>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Move to Stage</h3>
                  <div className="flex items-center gap-2">
                    <select
                      value={moveTarget}
                      onChange={(e) => setMoveTarget(e.target.value as PipelineStage)}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      {[...PIPELINE_STAGES, "rejected" as PipelineStage, "withdrawn" as PipelineStage].map((s) => (
                        <option key={s} value={s}>
                          {STAGE_CONFIG[s].label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleMoveStage}
                      disabled={moveTarget === app.status || actionLoading === app.id}
                      className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
                    >
                      Move
                    </button>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── Notes Tab ── */}
          {activeTab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="space-y-2">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this candidate..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={!newNote.trim() || addingNote}
                  className="bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {addingNote ? (
                    <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Adding...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">add</span> Add Note</>
                  )}
                </button>
              </div>

              {/* Notes list */}
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-3xl text-slate-300 block mb-2">chat_bubble</span>
                  <p className="text-sm text-slate-400">No notes yet. Add the first note above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-100 dark:border-slate-700">
                      <p className="text-sm text-slate-700 dark:text-slate-300">{note.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span className="material-symbols-outlined text-xs">person</span>
                        <span className="font-medium">{note.author_name ?? "Unknown"}</span>
                        <span>·</span>
                        <span>{new Date(note.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Timeline Tab ── */}
          {activeTab === "timeline" && (
            <div className="space-y-0">
              {/* Visual pipeline progress */}
              <div className="mb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Pipeline Progress</h3>
                <div className="flex items-center gap-1">
                  {PIPELINE_STAGES.map((stage, idx) => {
                    const stageIdx = PIPELINE_STAGES.indexOf(app.status);
                    const isActive = idx === stageIdx;
                    const isPast = idx < stageIdx;
                    const sc = STAGE_CONFIG[stage];

                    return (
                      <div key={stage} className="flex items-center gap-1 flex-1">
                        <div
                          className={`h-2 flex-1 rounded-full transition-all ${
                            isPast ? "bg-emerald-400" :
                            isActive ? "bg-primary" :
                            "bg-slate-200 dark:bg-slate-700"
                          }`}
                          title={sc.label}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] text-slate-400">Applied</span>
                  <span className="text-[10px] text-slate-400">Hired</span>
                </div>
              </div>

              {/* Timeline events */}
              <div className="relative pl-6">
                <div className="absolute left-2.5 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />

                {/* Applied */}
                <TimelineItem
                  icon="inbox"
                  color="text-blue-600"
                  title="Application Submitted"
                  time={new Date(app.applied_at).toLocaleString()}
                  description={app.cover_note ? `Cover note: "${app.cover_note}"` : undefined}
                />

                {/* Current status events */}
                {app.status !== "applied" && (
                  <TimelineItem
                    icon={config.icon}
                    color={config.color.split(" ")[0]}
                    title={`Moved to ${config.label}`}
                    time="—"
                    isActive
                  />
                )}

                {/* Test events */}
                {app.interviews?.status === "completed" && (
                  <TimelineItem
                    icon="task_alt"
                    color="text-purple-600"
                    title="Test Completed"
                    time={app.interviews.completed_at ? new Date(app.interviews.completed_at).toLocaleString() : "—"}
                    description={app.interviews.score != null ? `Score: ${app.interviews.score}%` : undefined}
                  />
                )}

                {/* Report */}
                {app.reports && (
                  <TimelineItem
                    icon="description"
                    color="text-teal-600"
                    title="AI Report Generated"
                    time="—"
                    description={`Overall Score: ${app.reports.overall_score ?? "—"}%`}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── Timeline Item ──
function TimelineItem({
  icon,
  color,
  title,
  time,
  description,
  isActive,
}: {
  icon: string;
  color: string;
  title: string;
  time: string;
  description?: string;
  isActive?: boolean;
}) {
  return (
    <div className="relative mb-4 pl-4">
      <div className={`absolute -left-[5px] top-1 size-5 rounded-full border-2 flex items-center justify-center ${
        isActive ? "bg-primary border-primary" : "bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600"
      }`}>
        <span className={`material-symbols-outlined text-[10px] ${isActive ? "text-white" : color}`}>{icon}</span>
      </div>
      <div>
        <p className={`text-sm font-medium ${isActive ? "text-primary" : "text-slate-700 dark:text-slate-300"}`}>{title}</p>
        <p className="text-xs text-slate-400 mt-0.5">{time}</p>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
      </div>
    </div>
  );
}
