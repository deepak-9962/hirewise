"use client";

const liveCandidates = [
  { id: 1, name: "Bob Smith", job: "Full Stack Developer", question: 3, total: 5, elapsed: "12:34", status: "answering", difficulty: "Medium" },
  { id: 2, name: "Lisa Chen", job: "Senior Frontend Engineer", question: 1, total: 5, elapsed: "03:22", status: "answering", difficulty: "Easy" },
  { id: 3, name: "Mike Johnson", job: "Backend Engineer", question: 4, total: 5, elapsed: "18:50", status: "coding", difficulty: "Hard" },
];

const recentlyCompleted = [
  { id: 4, name: "Alice Johnson", job: "Senior Frontend Engineer", score: 92, completedAt: "2h ago" },
  { id: 5, name: "Carol Williams", job: "Backend Engineer", score: 87, completedAt: "5h ago" },
  { id: 6, name: "Eva Martinez", job: "DevOps Engineer", score: 68, completedAt: "1d ago" },
];

export default function MonitoringPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Interview Monitoring</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time view of ongoing interviews</p>
      </div>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 mb-6">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        <span className="text-sm font-bold text-red-600">{liveCandidates.length} Live Interviews</span>
      </div>

      {/* Live Candidates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {liveCandidates.map((c) => (
          <div key={c.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-sm">person</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.job}</p>
                </div>
              </div>
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Progress</span>
                <span className="font-semibold text-slate-900 dark:text-white">{c.question}/{c.total}</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(c.question / c.total) * 100}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Elapsed: {c.elapsed}</span>
                <span className={`font-bold px-2 py-0.5 rounded-full ${
                  c.difficulty === "Easy" ? "bg-green-100 text-green-700" :
                  c.difficulty === "Medium" ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>{c.difficulty}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={`font-medium capitalize ${c.status === "coding" ? "text-purple-600" : "text-blue-600"}`}>
                  {c.status === "coding" ? "Writing Code" : "Typing Answer"}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <button className="flex-1 bg-amber-100 text-amber-700 text-xs font-bold py-2 rounded-lg hover:bg-amber-200 transition-all flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">pause</span> Pause
              </button>
              <button className="flex-1 bg-red-100 text-red-700 text-xs font-bold py-2 rounded-lg hover:bg-red-200 transition-all flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">stop</span> Force Submit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recently Completed */}
      <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Recently Completed</h2>
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Position</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Completed</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recentlyCompleted.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{c.name}</td>
                <td className="px-5 py-4 text-sm text-slate-500">{c.job}</td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${c.score >= 85 ? "text-green-600" : c.score >= 70 ? "text-amber-600" : "text-red-500"}`}>
                    {c.score}/100
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{c.completedAt}</td>
                <td className="px-5 py-4 text-right flex justify-end gap-2">
                  <button className="text-sm text-primary font-medium hover:underline">Report</button>
                  <button className="text-sm text-slate-500 font-medium hover:underline">Feedback</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
