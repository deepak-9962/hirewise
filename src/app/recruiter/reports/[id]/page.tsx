"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { updateReport } from "@/hooks/useSupabase";

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-white">{score > 0 ? score : "—"}</span>
      </div>
      <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function scoreBadgeClass(score: number) {
  if (score >= 75) return "bg-green-100 text-green-700";
  if (score >= 50) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-600";
}

function overallColor(score: number) {
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-amber-600";
  return "text-red-500";
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [hireModal, setHireModal] = useState(false);
  const [hiring, setHiring] = useState(false);
  const [hired, setHired] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${id}`);
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setFeedbackText(data.recruiter_feedback ?? "");
        setHired(data.application?.status === "hired");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleHire = async () => {
    setHiring(true);
    const res = await fetch(`/api/reports/${id}/hire`, { method: "POST" });
    setHiring(false);
    if (res.ok) {
      setHired(true);
      setHireModal(false);
    }
  };

  const handleSaveFeedback = async () => {
    setSavingFeedback(true);
    await updateReport(id, { recruiter_feedback: feedbackText });
    setSavingFeedback(false);
    setFeedbackSaved(true);
    setFeedbackMode(false);
    setTimeout(() => setFeedbackSaved(false), 3000);
  };

  if (loading) {
    return (
      <div className="animate-fade-in flex items-center justify-center py-24">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="animate-fade-in text-center py-24">
        <p className="text-slate-500">Report not found.</p>
        <Link href="/recruiter/reports" className="text-primary text-sm font-medium hover:underline mt-2 block">← Back to Reports</Link>
      </div>
    );
  }

  const profile = report.profile ?? {};
  const responses: any[] = report.responses ?? [];
  const strengths: string[] = report.strengths ?? [];
  const weaknesses: string[] = report.weaknesses ?? [];
  const job = report.interviews?.jobs ?? {};
  const overall = report.overall_score ?? 0;
  const technical = report.technical_score ?? 0;
  const communication = report.communication_score ?? 0;
  const reasoning = report.reasoning_score ?? 0;
  const date = new Date(report.generated_at ?? report.created_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const wrongAnswers = responses.filter((r) => typeof r.score === "number" && r.score < 50);
  const correctAnswers = responses.filter((r) => typeof r.score === "number" && r.score >= 75);
  const skills: string[] = profile.skills ?? [];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Link href="/recruiter/reports" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Back to Reports
        </Link>
        <div className="flex items-center gap-2">
          {feedbackSaved && (
            <span className="text-xs font-medium text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">Feedback saved</span>
          )}
          <button
            onClick={() => setFeedbackMode(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <span className="material-symbols-outlined text-base">rate_review</span>
            {report.recruiter_feedback ? "Edit Feedback" : "Add Feedback"}
          </button>
          {!hired ? (
            <button
              onClick={() => setHireModal(true)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all shadow-md shadow-emerald-600/20"
            >
              <span className="material-symbols-outlined text-base">check_circle</span>
              Send Offer
            </button>
          ) : (
            <span className="flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm font-bold px-5 py-2 rounded-lg border border-emerald-200">
              <span className="material-symbols-outlined text-base">check_circle</span>
              Offer Sent
            </span>
          )}
        </div>
      </div>

      {/* ── Header card ── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Avatar */}
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt={profile.name} className="size-full object-cover" />
            ) : (
              <span className="material-symbols-outlined text-primary text-3xl">person</span>
            )}
          </div>
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">{profile.name ?? "Unknown Candidate"}</h1>
              {hired && (
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">Hired</span>
              )}
            </div>
            {profile.headline && (
              <p className="text-sm text-slate-500 mb-2">{profile.headline}</p>
            )}
            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {profile.email && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">mail</span>{profile.email}
                </span>
              )}
              {profile.phone && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">phone</span>{profile.phone}
                </span>
              )}
              {profile.location && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">location_on</span>{profile.location}
                </span>
              )}
              {profile.experience && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">work</span>{profile.experience}
                </span>
              )}
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {skills.slice(0, 10).map((s: string) => (
                  <span key={s} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{s}</span>
                ))}
              </div>
            )}
          </div>
          {/* Job + date */}
          <div className="text-right shrink-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.title ?? "—"}</p>
            {job.department && <p className="text-xs text-slate-400">{job.department}</p>}
            <p className="text-xs text-slate-400 mt-1">{date}</p>
            {profile.resume_url && (
              <a href={profile.resume_url} target="_blank" rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium">
                <span className="material-symbols-outlined text-sm">description</span>View Resume
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── Scores + stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Overall Score", val: overall, color: overall >= 85 ? "text-green-600" : overall >= 70 ? "text-amber-600" : "text-red-500" },
          { label: "Technical", val: technical, color: "text-blue-600" },
          { label: "Communication", val: communication, color: "text-violet-600" },
          { label: "Reasoning", val: reasoning, color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className={`text-3xl font-bold ${s.color}`}>{s.val > 0 ? s.val : "—"}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* ── Score bars ── */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">monitoring</span>Score Breakdown
          </h2>
          <div className="space-y-4">
            <ScoreBar label="Overall" score={overall} color="bg-primary" />
            <ScoreBar label="Technical" score={technical} color="bg-blue-500" />
            <ScoreBar label="Communication" score={communication} color="bg-violet-500" />
            <ScoreBar label="Reasoning" score={reasoning} color="bg-amber-500" />
          </div>
          <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-green-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Correct ({correctAnswers.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-red-500 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Needs improvement ({wrongAnswers.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-slate-300 shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Total Q ({responses.length})</span>
            </div>
          </div>
        </div>

        {/* ── AI Summary ── */}
        <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">smart_toy</span>AI Summary
          </h2>
          {report.ai_summary ? (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{report.ai_summary}</p>
          ) : (
            <p className="text-sm text-slate-400">No AI summary available.</p>
          )}
          {report.recruiter_feedback && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Recruiter Feedback</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 italic">{report.recruiter_feedback}</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Strengths & Weaknesses ── */}
      {(strengths.length > 0 || weaknesses.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {strengths.length > 0 && (
            <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl border border-green-200 dark:border-green-800/50 p-5">
              <h3 className="font-bold text-green-800 dark:text-green-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">thumb_up</span>Strengths
              </h3>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-green-800 dark:text-green-300">
                    <span className="material-symbols-outlined text-green-500 text-base mt-0.5 shrink-0">check_circle</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {weaknesses.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800/50 p-5">
              <h3 className="font-bold text-red-800 dark:text-red-400 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">thumb_down</span>Areas to Improve
              </h3>
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-red-800 dark:text-red-300">
                    <span className="material-symbols-outlined text-red-500 text-base mt-0.5 shrink-0">cancel</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Q&A Breakdown ── */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">quiz</span>
          <h2 className="font-bold text-slate-900 dark:text-white">Question-by-Question Breakdown</h2>
          {wrongAnswers.length > 0 && (
            <span className="ml-auto text-xs font-bold bg-red-100 text-red-600 px-2.5 py-1 rounded-full">
              {wrongAnswers.length} question{wrongAnswers.length > 1 ? "s" : ""} need improvement
            </span>
          )}
        </div>
        {responses.length === 0 ? (
          <div className="p-10 text-center text-sm text-slate-400">No response data recorded for this interview.</div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {responses.map((resp: any, idx: number) => {
              const q = resp.questions ?? {};
              const score = typeof resp.score === "number" ? resp.score : null;
              const isWeak = score !== null && score < 50;
              const isMid = score !== null && score >= 50 && score < 75;
              const isGood = score !== null && score >= 75;

              const diffColors: Record<string, string> = {
                easy: "bg-green-100 text-green-700",
                medium: "bg-amber-100 text-amber-700",
                hard: "bg-red-100 text-red-600",
              };
              const diffKey = (q.difficulty ?? "").toLowerCase();

              return (
                <div
                  key={resp.id ?? idx}
                  className={`p-5 transition-colors ${isWeak ? "bg-red-50/50 dark:bg-red-900/10" : "hover:bg-slate-50 dark:hover:bg-slate-800/30"}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-400">Q{idx + 1}</span>
                      {q.difficulty && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${diffColors[diffKey] ?? "bg-slate-100 text-slate-500"}`}>
                          {q.difficulty}
                        </span>
                      )}
                      {q.type && (
                        <span className="text-xs text-slate-400 capitalize">{q.type?.replace("_", " ")}</span>
                      )}
                      {isWeak && (
                        <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">warning</span>Needs Improvement
                        </span>
                      )}
                    </div>
                    {score !== null && (
                      <span className={`text-sm font-bold px-3 py-1 rounded-full shrink-0 ${isGood ? "bg-green-100 text-green-700" : isMid ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"}`}>
                        {score}/100
                      </span>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-semibold text-slate-800 dark:text-white mb-3 leading-relaxed">
                    {q.text ?? "Question text not available"}
                  </p>

                  {/* Candidate Answer */}
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Candidate Answer</p>
                    {resp.answer_text ? (
                      <div className={`text-sm rounded-lg p-3 border ${isWeak ? "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300" : "bg-slate-50 border-slate-200 text-slate-700 dark:bg-slate-700/40 dark:border-slate-600 dark:text-slate-300"}`}>
                        <pre className="whitespace-pre-wrap font-sans break-words">{resp.answer_text}</pre>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No answer provided</p>
                    )}
                  </div>

                  {/* AI Feedback */}
                  {resp.ai_feedback && (
                    <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-blue-500 text-base shrink-0 mt-0.5">smart_toy</span>
                      <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">{resp.ai_feedback}</p>
                    </div>
                  )}

                  {/* Expected answer for wrong ones */}
                  {isWeak && (q.correct_answer || q.expected_answer) && (
                    <div className="mt-2 flex items-start gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-3 py-2">
                      <span className="material-symbols-outlined text-green-500 text-base shrink-0 mt-0.5">check_circle</span>
                      <div>
                        <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-0.5">Expected Answer</p>
                        <p className="text-xs text-green-800 dark:text-green-300">{q.correct_answer ?? q.expected_answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Hire Modal ── */}
      {hireModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <div className="size-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 mx-auto">
              <span className="material-symbols-outlined text-emerald-600 text-3xl">handshake</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white text-center mb-2">Send Offer to Candidate</h2>
            <p className="text-sm text-slate-500 text-center mb-4">
              This will mark <span className="font-semibold text-slate-800 dark:text-white">{profile.name ?? "this candidate"}</span> as <span className="font-semibold text-emerald-600">Hired</span> and they will see the offer on their dashboard.
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800/40 p-4 mb-5 text-sm">
              <p className="font-semibold text-emerald-800 dark:text-emerald-400 mb-1">Offer Details</p>
              <p className="text-emerald-700 dark:text-emerald-300">Candidate: {profile.name ?? "—"}</p>
              <p className="text-emerald-700 dark:text-emerald-300">Position: {job.title ?? "—"}</p>
              {job.department && <p className="text-emerald-700 dark:text-emerald-300">Department: {job.department}</p>}
              <p className="text-emerald-700 dark:text-emerald-300">Overall Score: {overall}/100</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setHireModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleHire}
                disabled={hiring}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold px-4 py-2.5 rounded-lg transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {hiring ? (
                  <>
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">send</span>
                    Confirm & Send Offer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback Modal ── */}
      {feedbackMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Recruiter Feedback</h2>
            <p className="text-sm text-slate-500 mb-4">
              For <span className="font-semibold text-slate-800 dark:text-white">{profile.name ?? "candidate"}</span>
            </p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={5}
              placeholder="Write your notes and feedback for this candidate..."
              className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setFeedbackMode(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFeedback}
                disabled={savingFeedback || !feedbackText.trim()}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {savingFeedback ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
