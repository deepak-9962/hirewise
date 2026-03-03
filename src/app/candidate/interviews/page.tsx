"use client";

import Link from "next/link";

const interviews = [
  { id: 1, job: "Senior Frontend Engineer", company: "TechCorp", date: "Mar 5, 2026", time: "10:00 AM", status: "scheduled", type: "Technical" },
  { id: 2, job: "Full Stack Developer", company: "Nexus Labs", date: "Mar 8, 2026", time: "2:00 PM", status: "scheduled", type: "Full Stack" },
  { id: 3, job: "React Developer", company: "Velocity Inc.", date: "Feb 28, 2026", time: "11:00 AM", status: "completed", score: 87, type: "Technical" },
  { id: 4, job: "Software Engineer", company: "Vertex AI", date: "Feb 20, 2026", time: "3:00 PM", status: "completed", score: 92, type: "Behavioral" },
  { id: 5, job: "Frontend Architect", company: "SecureTech", date: "Feb 12, 2026", time: "9:30 AM", status: "completed", score: 78, type: "System Design" },
];

export default function CandidateInterviewsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Interviews</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage your upcoming and past interviews</p>
      </div>

      {/* Upcoming */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">event</span> Upcoming
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {interviews.filter((i) => i.status === "scheduled").map((interview) => (
            <div key={interview.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 hover:border-primary transition-all">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{interview.job}</h3>
                  <p className="text-sm text-slate-500">{interview.company}</p>
                </div>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-full">{interview.type}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">calendar_today</span> {interview.date}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span> {interview.time}
                </span>
              </div>
              <Link href={`/interview/${interview.id}`} className="w-full bg-primary text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">videocam</span> Join Interview
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-slate-400">history</span> Past Interviews
        </h2>
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Type</th>
                <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
                <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
              {interviews.filter((i) => i.status === "completed").map((interview) => (
                <tr key={interview.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{interview.job}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{interview.company}</td>
                  <td className="px-5 py-4 text-sm text-slate-500">{interview.date}</td>
                  <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{interview.type}</span></td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-bold ${(interview.score ?? 0) >= 85 ? "text-green-600" : (interview.score ?? 0) >= 70 ? "text-amber-600" : "text-red-500"}`}>
                      {interview.score}/100
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/candidate/reports/${interview.id}`} className="text-sm text-primary font-medium hover:underline">View Report</Link>
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
