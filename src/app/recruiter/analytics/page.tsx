"use client";

import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

const radarData = [
  { subject: "React", score: 85 },
  { subject: "TypeScript", score: 78 },
  { subject: "Node.js", score: 72 },
  { subject: "System Design", score: 68 },
  { subject: "Algorithms", score: 81 },
  { subject: "SQL", score: 74 },
];

const barData = [
  { difficulty: "Easy", avg: 84, count: 42 },
  { difficulty: "Medium", avg: 72, count: 65 },
  { difficulty: "Hard", avg: 61, count: 28 },
];

const lineData = [
  { week: "W1", score: 71, candidates: 12 },
  { week: "W2", score: 74, candidates: 18 },
  { week: "W3", score: 76, candidates: 22 },
  { week: "W4", score: 79, candidates: 25 },
  { week: "W5", score: 77, candidates: 20 },
  { week: "W6", score: 82, candidates: 30 },
];

const completionData = [
  { week: "W1", completed: 10, abandoned: 2 },
  { week: "W2", completed: 16, abandoned: 2 },
  { week: "W3", completed: 20, abandoned: 2 },
  { week: "W4", completed: 23, abandoned: 2 },
  { week: "W5", completed: 18, abandoned: 2 },
  { week: "W6", completed: 27, abandoned: 3 },
];

export default function RecruiterAnalyticsPage() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Deep insights into your hiring funnel performance</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Avg Score", value: "76.4", delta: "+2.1", icon: "trending_up", up: true },
          { label: "Completion Rate", value: "91%", delta: "+3%", icon: "check_circle", up: true },
          { label: "Avg Time/Question", value: "4.2m", delta: "-0.3m", icon: "timer", up: true },
          { label: "Bias Alerts", value: "2", delta: "Low Risk", icon: "warning", up: false },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-500">{stat.label}</span>
              <span className="material-symbols-outlined text-slate-400 text-xl">{stat.icon}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.up ? "text-green-600" : "text-amber-600"}`}>{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Radar: Avg Score by Skill */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Average Score by Skill</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
              <Radar name="Score" dataKey="score" stroke="#135bec" fill="#135bec" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar: Performance by Difficulty */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance by Difficulty</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="difficulty" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Bar dataKey="avg" fill="#135bec" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line: Score Trend */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Weekly Score Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Line type="monotone" dataKey="score" stroke="#135bec" strokeWidth={2} dot={{ fill: "#135bec", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Line: Completion Rate */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Interview Completion</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={completionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }} />
              <Bar dataKey="completed" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="abandoned" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
