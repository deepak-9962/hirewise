"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, use } from "react";
import Link from "next/link";
import { useReport, useInterviewResponses, updateReport, useJobQuestions } from "@/hooks/useSupabase";
import { SkeletonCard } from "@/components/ui/Skeleton";

export default function RecruiterReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.id as string;

  const { data: report, loading: reportLoading, refetch } = useReport(reportId);
  const interviewId = report?.interview_id;
  const { data: responses, loading: responsesLoading } = useInterviewResponses(interviewId);

  const jobId = report?.interviews?.job_id;
  const { data: jobQuestions, loading: jobQuestionsLoading } = useJobQuestions(jobId);

  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [editingFeedback, setEditingFeedback] = useState(false);

  const handleSaveFeedback = async () => {
    if (!reportId) return;
    setSavingFeedback(true);
    await updateReport(reportId, { feedback: feedbackText });
    setSavingFeedback(false);
    setEditingFeedback(false);
    refetch();
  };

  const loading = reportLoading || responsesLoading || jobQuestionsLoading;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-slate-200 dark:bg-slate-700 w-1/4 rounded-lg" />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">description</span>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Report Not Found</h3>
        <p className="text-sm text-slate-500 mb-6">The requested interview report does not exist or has been deleted.</p>
        <Link href="/recruiter/reports" className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all">
          Back to Reports List
        </Link>
      </div>
    );
  }

  const overall = Math.round(report.overall_score || 0);
  const technical = Math.round(report.technical_score || 0);
  const communication = Math.round(report.communication_score || 0);
  const reasoning = Math.round(report.reasoning_score || 0);
  const candidateName = report.profiles?.name ?? "Unknown Candidate";
  const candidateEmail = report.profiles?.email ?? "";
  const jobTitle = report.interviews?.jobs?.title ?? "Technical Interview";
  const department = report.interviews?.jobs?.department ?? "";
  const date = report.generated_at
    ? new Date(report.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";

  return (
    <div className="animate-fade-in max-w-5xl mx-auto">
      {/* Back link */}
      <div className="mb-6">
        <Link href="/recruiter/reports" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary font-medium transition-colors">
          <span className="material-symbols-outlined text-base">arrow_back</span> Back to Reports
        </Link>
      </div>

      {/* Header Profile card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
            <span className="material-symbols-outlined text-4xl">person</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{candidateName}</h1>
            <p className="text-sm text-slate-500 mb-1">{candidateEmail}</p>
            <p className="text-xs text-slate-400">Position: <span className="font-semibold text-slate-650 dark:text-slate-350">{jobTitle} {department ? `(${department})` : ""}</span> · Evaluated on {date}</p>
          </div>
        </div>

        {/* Overall score */}
        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-700 p-4 rounded-xl shrink-0 self-start md:self-center">
          <div className={`size-14 rounded-xl flex items-center justify-center text-2xl font-black text-white shrink-0 ${overall >= 85 ? "bg-green-500" : overall >= 70 ? "bg-amber-500" : "bg-red-500"}`}>
            {overall}
          </div>
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Overall Score</p>
            <p className={`text-sm font-bold ${overall >= 85 ? "text-green-600" : overall >= 70 ? "text-amber-600" : "text-red-500"}`}>
              {overall >= 85 ? "Strong Fit" : overall >= 70 ? "Good Fit" : "Needs Improvement"}
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Stats breakdown + AI summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Side: Score Categories */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col gap-4">
          <h3 className="font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
            Category Breakdown
          </h3>
          {[
            { label: "Technical Skills", score: technical, icon: "code" },
            { label: "Communication", score: communication, icon: "forum" },
            { label: "Reasoning & Logic", score: reasoning, icon: "psychology" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm text-slate-400">{item.icon}</span>
                  {item.label}
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{item.score}/100</span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${item.score >= 85 ? "bg-green-500" : item.score >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                  style={{ width: `${item.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Right Side: AI summary + Strengths/Weaknesses */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary */}
          {report.ai_summary && (
            <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-primary text-xl">smart_toy</span> AI Interview Assessment
              </h3>
              <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed">{report.ai_summary}</p>
            </div>
          )}

          {/* Strengths & Weaknesses */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">thumb_up</span> Candidate Strengths
              </h4>
              <ul className="space-y-3">
                {(report.strengths || []).map((s: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-650 dark:text-slate-300">
                    <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                    <span>{s}</span>
                  </li>
                ))}
                {(!report.strengths || report.strengths.length === 0) && (
                  <li className="text-sm text-slate-400">No strengths logged.</li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">lightbulb</span> Areas for Improvement
              </h4>
              <ul className="space-y-3">
                {(report.weaknesses || []).map((w: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-650 dark:text-slate-300">
                    <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                    <span>{w}</span>
                  </li>
                ))}
                {(!report.weaknesses || report.weaknesses.length === 0) && (
                  <li className="text-sm text-slate-400">No improvement points logged.</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recruiter Review/Feedback Card */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-slate-400">rate_review</span> Recruiter Notes & Decision
          </h3>
          {!editingFeedback && report.feedback && (
            <button
              onClick={() => { setFeedbackText(report.feedback); setEditingFeedback(true); }}
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-xs">edit</span> Edit Notes
            </button>
          )}
        </div>

        {editingFeedback || !report.feedback ? (
          <div>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Provide hiring recommendation, interviewer notes, or status comments..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none mb-3"
            />
            <div className="flex justify-end gap-2">
              {report.feedback && (
                <button
                  onClick={() => setEditingFeedback(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-650 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-750 transition-all"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSaveFeedback}
                disabled={savingFeedback || !feedbackText.trim()}
                className="bg-primary text-white px-5 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {savingFeedback ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
            <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed italic">"{report.feedback}"</p>
          </div>
        )}
      </div>

      {/* Q&A interview responses */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
          <span className="material-symbols-outlined text-slate-400">question_answer</span> Interview Q&A Responses
        </h3>

        {(!responses || responses.length === 0) ? (
          <p className="text-sm text-slate-450 text-center py-6">No interview response details found.</p>
        ) : (
          <div className="space-y-6">
            {responses.map((res: any, idx: number) => {
              const mockQuestionsFallback = [
                "Explain the difference between useEffect and useLayoutEffect in React. When would you choose one over the other? Provide specific use cases.",
                "Write a function that takes an array of integers and returns the length of the longest increasing subsequence.",
                "Describe how you would design a real-time notification system for a web application that needs to handle millions of concurrent users. Cover the architecture, technology choices, and trade-offs.",
                "Implement a Least Recently Used (LRU) Cache with O(1) time complexity for both get and put operations.",
                "Describe a situation where you had to make a critical technical decision under pressure with incomplete information. What was the outcome and what would you do differently?"
              ];

              const qFromJob = jobQuestions?.[idx]?.questions;
              const qText = res.questions?.text ?? qFromJob?.text ?? mockQuestionsFallback[idx] ?? "Question text not available";
              const qType = res.questions?.type ?? qFromJob?.type ?? (idx % 2 === 0 ? "descriptive" : "coding");
              const score = res.score ?? 0;
              const evaluation = res.ai_feedback || res.evaluation;
              const codeOutput = res.code_output;
              const lang = res.language_used;

              return (
                <div key={res.id} className="border-b border-slate-100 dark:border-slate-700/50 pb-6 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <span className="font-black text-slate-300 text-xl tracking-tight leading-none shrink-0">#{idx + 1}</span>
                      <div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase mb-1.5 ${
                          qType === "coding" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                        }`}>
                          {qType}
                        </span>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">{qText}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`inline-flex items-center justify-center font-bold px-2 py-1 rounded text-xs ${
                        score >= 85 ? "bg-green-50 text-green-750 dark:bg-green-900/20" : score >= 70 ? "bg-amber-50 text-amber-750 dark:bg-amber-900/20" : "bg-red-50 text-red-755 dark:bg-red-900/20"
                      }`}>
                        Score: {score}
                      </span>
                    </div>
                  </div>

                  {/* Candidate Answer */}
                  <div className="bg-slate-50 dark:bg-slate-800/30 rounded-xl p-4 border border-slate-100 dark:border-slate-750/50 mb-3">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Candidate Response</p>
                    {qType === "coding" ? (
                      <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 overflow-x-auto whitespace-pre p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-150 dark:border-slate-800">
                        <code>{res.answer_text}</code>
                      </pre>
                    ) : (
                      <p className="text-sm text-slate-700 dark:text-slate-350 leading-relaxed whitespace-pre-line">{res.answer_text}</p>
                    )}

                    {codeOutput && (
                      <div className="mt-3">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Execution Output ({lang})</p>
                        <pre className="font-mono text-xs text-slate-650 dark:text-slate-400 p-2.5 bg-slate-105 dark:bg-slate-900/80 rounded border border-slate-200 dark:border-slate-800/50">
                          {codeOutput}
                        </pre>
                      </div>
                    )}
                  </div>

                  {/* Evaluation feedback */}
                  {evaluation && (
                    <div className="flex gap-2 p-3 bg-primary/5 dark:bg-primary/10 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-primary text-base mt-0.5">smart_toy</span>
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block mb-0.5">AI Feedback</span>
                        <p className="leading-relaxed">
                          {typeof evaluation === "string" ? evaluation : (evaluation as any).feedback ?? JSON.stringify(evaluation)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
