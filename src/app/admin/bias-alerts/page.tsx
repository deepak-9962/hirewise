"use client";

const biasAlerts = [
  {
    id: 1,
    type: "Grammar Over-Penalization",
    risk: "Medium",
    candidate: "Eva Martinez",
    interview: "DevOps Engineer",
    detail: "Communication score penalized disproportionately for grammatical patterns consistent with non-native English speakers. Content accuracy was high.",
    time: "2h ago",
    factors: ["Grammar weight: 40% of communication score", "Content accuracy: 89%", "Pattern: Non-native syntax"],
  },
  {
    id: 2,
    type: "Confidence Misclassification",
    risk: "Low",
    candidate: "Frank Lee",
    interview: "Full Stack Developer",
    detail: "Confidence score appears correlated with response length rather than content quality. Shorter but accurate answers received lower confidence ratings.",
    time: "1d ago",
    factors: ["Avg response length: 45 words", "Content accuracy: 85%", "Confidence score: 62%"],
  },
  {
    id: 3,
    type: "Language Complexity Bias",
    risk: "Low",
    candidate: "Mike Chen",
    interview: "Backend Engineer",
    detail: "Technical vocabulary usage positively biased scores. Simpler explanations of correct concepts received lower technical scores.",
    time: "3d ago",
    factors: ["Vocabulary complexity: Low", "Technical accuracy: 91%", "Technical score: 74%"],
  },
];

export default function AdminBiasAlertsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bias Detection Alerts</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">AI scoring bias monitoring and transparency reports</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { label: "High Risk", count: 0, color: "bg-green-100 text-green-700", icon: "check_circle" },
          { label: "Medium Risk", count: 1, color: "bg-amber-100 text-amber-700", icon: "warning" },
          { label: "Low Risk", count: 2, color: "bg-blue-100 text-blue-700", icon: "info" },
        ].map((summary) => (
          <div key={summary.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4">
            <div className={`size-12 rounded-xl ${summary.color} flex items-center justify-center`}>
              <span className="material-symbols-outlined">{summary.icon}</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{summary.count}</p>
              <p className="text-sm text-slate-500">{summary.label} Alerts</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alert Cards */}
      <div className="space-y-4">
        {biasAlerts.map((alert) => (
          <div key={alert.id} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`size-10 rounded-lg flex items-center justify-center ${
                  alert.risk === "High" ? "bg-red-100 text-red-600" :
                  alert.risk === "Medium" ? "bg-amber-100 text-amber-600" :
                  "bg-blue-100 text-blue-600"
                }`}>
                  <span className="material-symbols-outlined">
                    {alert.risk === "High" ? "error" : alert.risk === "Medium" ? "warning" : "info"}
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{alert.type}</h3>
                  <p className="text-xs text-slate-500">{alert.candidate} · {alert.interview} · {alert.time}</p>
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                alert.risk === "High" ? "bg-red-100 text-red-700" :
                alert.risk === "Medium" ? "bg-amber-100 text-amber-700" :
                "bg-blue-100 text-blue-700"
              }`}>{alert.risk} Risk</span>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{alert.detail}</p>
              <div className="bg-slate-50 dark:bg-slate-800/30 rounded-lg p-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contributing Factors</p>
                <ul className="space-y-1.5">
                  {alert.factors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm text-slate-400">arrow_right</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
              <button className="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">Dismiss</button>
              <button className="text-sm font-semibold text-primary hover:underline">Review Evaluation</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
