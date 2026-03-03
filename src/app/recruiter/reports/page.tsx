"use client";

import { useState } from "react";
import Link from "next/link";
import { useAllReports, updateReport } from "@/hooks/useSupabase";

export default function RecruiterReportsPage() {
  const { data, loading, refetch } = useAllReports();
  const [feedbackModal, setFeedbackModal] = useState<{ id: string; name: string } | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [search, setSearch] = useState("");

  const reports = ((data ?? []) as any[]).filter((r: any) => {
    if (!search) return true;
    const name = r.profiles?.name?.toLowerCase() ?? "";
    const job = r.interviews?.jobs?.title?.toLowerCase() ?? "";
    return name.includes(search.toLowerCase()) || job.includes(search.toLowerCase());
  });

  const handleSaveFeedback = async () => {
    if (!feedbackModal) return;
    setSavingFeedback(true);
    await updateReport(feedbackModal.id, { feedback: feedbackText });
    setSavingFeedback(false);
    setFeedbackModal(null);
    setFeedbackText("");
    refetch();
  };

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Review AI-generated interview reports and provide feedback</p>
        </div>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidate or position..."
            className="pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-16 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 block mb-3">description</span>
          <p className="text-slate-500">{search ? "No reports match your search." : "No interview reports yet. Reports are generated after candidates complete their tests."}</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Overall</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Technical</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Communication</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Reasoning</th>
                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Feedback</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {reports.map((r: any) => {
                const overall = r.overall_score ?? r.score ?? 0;
                const technical = r.technical_score ?? "—";
                const communication = r.communication_score ?? "—";
                const reasoning = r.reasoning_score ?? "—";
                const hasFeedback = !!r.feedback;
                const candidateName = r.profiles?.name ?? "Unknown";
                const jobTitle = r.interviews?.jobs?.title ?? "—";
                const date = new Date(r.generated_at ?? r.created_at).toLocaleDateString();

                return (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-primary text-sm">person</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{candidateName}</p>
                          <p className="text-xs text-slate-400">{date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-500 max-w-[180px] truncate">{jobTitle}</td>
                    <td className="px-5 py-4 text-center">
                      <span className={`text-sm font-bold ${overall >= 85 ? "text-green-600" : overall >= 70 ? "text-amber-600" : "text-red-500"}`}>
                        {overall}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{technical}</td>
                    <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{communication}</td>
                    <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{reasoning}</td>
                    <td className="px-5 py-4 text-center">
                      {hasFeedback ? (
                        <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Submitted</span>
                      ) : (
                        <button
                          onClick={() => { setFeedbackModal({ id: r.id, name: candidateName }); setFeedbackText(""); }}
                          className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-all"
                        >
                          Add
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/recruiter/reports/${r.id}`} className="text-sm text-primary font-medium hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Add Feedback</h2>
            <p className="text-sm text-slate-500 mb-4">For <span className="font-semibold">{feedbackModal.name}</span></p>
            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              placeholder="Write your feedback for this candidate..."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setFeedbackModal(null)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
              <button
                onClick={handleSaveFeedback}
                disabled={savingFeedback || !feedbackText.trim()}
                className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                {savingFeedback ? "Saving..." : "Save Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
