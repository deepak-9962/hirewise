"use client";

import Link from "next/link";

const reports = [
  { id: 1, name: "Alice Johnson", job: "Senior Frontend Engineer", overall: 92, technical: 95, communication: 88, reasoning: 93, date: "2h ago", feedback: true },
  { id: 2, name: "Carol Williams", job: "Backend Engineer", overall: 87, technical: 90, communication: 82, reasoning: 88, date: "5h ago", feedback: true },
  { id: 3, name: "Eva Martinez", job: "DevOps Engineer", overall: 68, technical: 72, communication: 64, reasoning: 67, date: "1d ago", feedback: false },
  { id: 4, name: "Frank Lee", job: "Full Stack Developer", overall: 81, technical: 85, communication: 78, reasoning: 80, date: "2d ago", feedback: true },
  { id: 5, name: "Grace Kim", job: "Senior Frontend Engineer", overall: 94, technical: 97, communication: 90, reasoning: 95, date: "3d ago", feedback: false },
];

export default function RecruiterReportsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Candidate Reports</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Review AI-generated interview reports and provide feedback</p>
      </div>

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
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.date}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{r.job}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-sm font-bold ${r.overall >= 85 ? "text-green-600" : r.overall >= 70 ? "text-amber-600" : "text-red-500"}`}>
                    {r.overall}
                  </span>
                </td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{r.technical}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{r.communication}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{r.reasoning}</td>
                <td className="px-5 py-4 text-center">
                  {r.feedback ? (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">Submitted</span>
                  ) : (
                    <button className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full hover:bg-primary/20 transition-all">Add</button>
                  )}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/recruiter/reports/${r.id}`} className="text-sm text-primary font-medium hover:underline">View</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
