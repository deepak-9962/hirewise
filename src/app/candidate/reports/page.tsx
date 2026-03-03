"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useCandidateReports } from "@/hooks/useSupabase";

interface ReportRow {
  id: string;
  overall_score: number;
  technical_score: number;
  communication_score: number;
  reasoning_score: number;
  strengths: string[];
  weaknesses: string[];
  ai_summary: string;
  generated_at: string;
  interviews?: {
    id: string;
    status: string;
    completed_at: string;
    jobs?: { title: string; department: string } | null;
  } | null;
}

export default function CandidateReportsPage() {
  const { user } = useAuth();
  const { data, loading } = useCandidateReports(user?.id);
  const reports = (data as ReportRow[] | null) || [];

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed AI-generated reports from your completed interviews</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <span className="animate-spin material-symbols-outlined text-primary text-4xl">progress_activity</span>
          <p className="text-slate-500 mt-3">Loading your reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <span className="material-symbols-outlined text-slate-300 text-5xl mb-4">description</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No Reports Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Complete an interview to receive an AI-generated evaluation report with detailed scores and feedback.
          </p>
          <Link href="/candidate/interviews" className="mt-4 inline-block bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-all">
            View Interviews
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reports.map((report) => {
            const jobTitle = report.interviews?.jobs?.title || "Technical Interview";
            const department = report.interviews?.jobs?.department || "";
            const date = report.generated_at
              ? new Date(report.generated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "";
            const overall = Math.round(report.overall_score || 0);
            const technical = Math.round(report.technical_score || 0);
            const communication = Math.round(report.communication_score || 0);
            const reasoning = Math.round(report.reasoning_score || 0);

            return (
              <div key={report.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{jobTitle}</h3>
                    <p className="text-sm text-slate-500">{department}{department && date ? " · " : ""}{date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`size-14 rounded-xl flex items-center justify-center text-xl font-black text-white ${overall >= 85 ? "bg-green-500" : overall >= 70 ? "bg-amber-500" : "bg-red-500"}`}>
                      {overall}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Overall Score</p>
                      <p className={`text-sm font-bold ${overall >= 85 ? "text-green-600" : overall >= 70 ? "text-amber-600" : "text-red-500"}`}>
                        {overall >= 85 ? "Strong Fit" : overall >= 70 ? "Good Fit" : "Needs Improvement"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {/* Score breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      { label: "Technical", score: technical, icon: "code" },
                      { label: "Communication", score: communication, icon: "forum" },
                      { label: "Reasoning", score: reasoning, icon: "psychology" },
                    ].map((item) => (
                      <div key={item.label} className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-sm text-slate-400">{item.icon}</span>
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold text-slate-900 dark:text-white">{item.score}</span>
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${item.score >= 85 ? "bg-green-500" : item.score >= 70 ? "bg-amber-500" : "bg-red-500"}`}
                              style={{ width: `${item.score}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* AI Summary */}
                  {report.ai_summary && (
                    <div className="bg-primary/5 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-primary text-sm">smart_toy</span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">AI Assessment</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{report.ai_summary}</p>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">thumb_up</span> Strengths
                      </h4>
                      <ul className="space-y-2">
                        {(report.strengths || []).map((s, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                            {s}
                          </li>
                        ))}
                        {(!report.strengths || report.strengths.length === 0) && (
                          <li className="text-sm text-slate-400">No strengths data</li>
                        )}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">lightbulb</span> Areas for Improvement
                      </h4>
                      <ul className="space-y-2">
                        {(report.weaknesses || []).map((w, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                            <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                            {w}
                          </li>
                        ))}
                        {(!report.weaknesses || report.weaknesses.length === 0) && (
                          <li className="text-sm text-slate-400">No improvement data</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
