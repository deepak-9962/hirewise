"use client";

import Link from "next/link";

const reports = [
  {
    id: 3,
    job: "React Developer",
    company: "Velocity Inc.",
    date: "Feb 28, 2026",
    overall: 87,
    technical: 90,
    communication: 82,
    reasoning: 88,
    strengths: ["Strong React knowledge", "Clean code structure", "Good problem decomposition"],
    weaknesses: ["Could improve error handling", "Time management on complex problems"],
  },
  {
    id: 4,
    job: "Software Engineer",
    company: "Vertex AI",
    date: "Feb 20, 2026",
    overall: 92,
    technical: 95,
    communication: 88,
    reasoning: 93,
    strengths: ["Excellent algorithmic thinking", "Clear communication", "Strong system design"],
    weaknesses: ["Minor syntax issues", "Could elaborate more on trade-offs"],
  },
  {
    id: 5,
    job: "Frontend Architect",
    company: "SecureTech",
    date: "Feb 12, 2026",
    overall: 78,
    technical: 80,
    communication: 75,
    reasoning: 79,
    strengths: ["Good architectural intuition", "Solid CSS knowledge"],
    weaknesses: ["Needs deeper TypeScript expertise", "Performance optimization gaps"],
  },
];

export default function CandidateReportsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Detailed AI-generated reports from your completed interviews</p>
      </div>

      <div className="space-y-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{report.job}</h3>
                <p className="text-sm text-slate-500">{report.company} · {report.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className={`size-14 rounded-xl flex items-center justify-center text-xl font-black text-white ${report.overall >= 85 ? "bg-green-500" : report.overall >= 70 ? "bg-amber-500" : "bg-red-500"}`}>
                  {report.overall}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">Overall Score</p>
                  <p className={`text-sm font-bold ${report.overall >= 85 ? "text-green-600" : report.overall >= 70 ? "text-amber-600" : "text-red-500"}`}>
                    {report.overall >= 85 ? "Strong Fit" : report.overall >= 70 ? "Good Fit" : "Needs Improvement"}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {/* Score breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Technical", score: report.technical, icon: "code" },
                  { label: "Communication", score: report.communication, icon: "forum" },
                  { label: "Reasoning", score: report.reasoning, icon: "psychology" },
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

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-bold text-green-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">thumb_up</span> Strengths
                  </h4>
                  <ul className="space-y-2">
                    {report.strengths.map((s) => (
                      <li key={s} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-green-500 text-sm mt-0.5">check_circle</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">lightbulb</span> Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {report.weaknesses.map((w) => (
                      <li key={w} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <span className="material-symbols-outlined text-amber-500 text-sm mt-0.5">info</span>
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <Link href={`/candidate/reports/${report.id}`} className="text-sm text-primary font-semibold hover:underline flex items-center gap-1">
                View Full Report <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
