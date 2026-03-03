"use client";

const aiUsageStats = [
  { label: "Total API Calls", value: "12,438", period: "Today" },
  { label: "Evaluation Calls", value: "3,892", period: "Today" },
  { label: "Avg Response Time", value: "1.8s", period: "LLM latency" },
  { label: "JSON Retries", value: "47", period: "Invalid format" },
  { label: "Tokens Used", value: "2.1M", period: "Today" },
  { label: "Cost Estimate", value: "$34.20", period: "Today" },
];

const modelUsage = [
  { model: "GPT-4o", calls: 2450, avgLatency: "1.6s", successRate: "98.8%", tokens: "1.4M" },
  { model: "GPT-4o-mini", calls: 1442, avgLatency: "0.8s", successRate: "99.2%", tokens: "0.7M" },
];

const recentEvaluations = [
  { id: 1, candidate: "Alice Johnson", type: "Technical", score: 92, confidence: 95, latency: "1.4s", retries: 0 },
  { id: 2, candidate: "Bob Smith", type: "Behavioral", score: 78, confidence: 87, latency: "2.1s", retries: 1 },
  { id: 3, candidate: "Carol Williams", type: "Technical", score: 87, confidence: 91, latency: "1.7s", retries: 0 },
  { id: 4, candidate: "Eva Martinez", type: "Coding", score: 68, confidence: 82, latency: "1.2s", retries: 0 },
  { id: 5, candidate: "Frank Lee", type: "Behavioral", score: 81, confidence: 88, latency: "2.4s", retries: 2 },
];

export default function AdminAIUsagePage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Usage Monitor</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Track LLM API usage, costs, and evaluation quality</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {aiUsageStats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            <p className="text-[10px] text-slate-400">{stat.period}</p>
          </div>
        ))}
      </div>

      {/* Model Usage */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">Model Usage</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Model</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Calls</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Avg Latency</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Success Rate</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {modelUsage.map((m) => (
              <tr key={m.model} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white">{m.model}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{m.calls.toLocaleString()}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{m.avgLatency}</td>
                <td className="px-5 py-4 text-center text-sm font-bold text-green-600">{m.successRate}</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{m.tokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent Evaluations */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">Recent AI Evaluations</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Candidate</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Score</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Confidence</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Latency</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Retries</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {recentEvaluations.map((e) => (
              <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4 text-sm font-medium text-slate-900 dark:text-white">{e.candidate}</td>
                <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{e.type}</span></td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-sm font-bold ${e.score >= 85 ? "text-green-600" : e.score >= 70 ? "text-amber-600" : "text-red-500"}`}>{e.score}</span>
                </td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{e.confidence}%</td>
                <td className="px-5 py-4 text-center text-sm text-slate-600 dark:text-slate-400">{e.latency}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs font-bold ${e.retries > 0 ? "text-amber-600" : "text-green-600"}`}>{e.retries}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
