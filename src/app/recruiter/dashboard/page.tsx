"use client";

import Link from "next/link";

const stats = [
  { label: "Active Jobs", value: "12", icon: "work", color: "text-primary", bg: "bg-primary/10", trend: "+3 this month" },
  { label: "Total Candidates", value: "284", icon: "group", color: "text-green-600", bg: "bg-green-50", trend: "+47 this week" },
  { label: "Interviews Today", value: "8", icon: "videocam", color: "text-amber-600", bg: "bg-amber-50", trend: "3 in progress" },
  { label: "Avg Score", value: "76.4", icon: "trending_up", color: "text-purple-600", bg: "bg-purple-50", trend: "+2.1 vs last month" },
];

const recentCandidates = [
  { id: 1, name: "Alice Johnson", job: "Senior Frontend Engineer", score: 92, status: "completed", date: "2h ago" },
  { id: 2, name: "Bob Smith", job: "Full Stack Developer", score: null, status: "in-progress", date: "Live now" },
  { id: 3, name: "Carol Williams", job: "Backend Engineer", score: 87, status: "completed", date: "5h ago" },
  { id: 4, name: "David Brown", job: "Senior Frontend Engineer", score: null, status: "scheduled", date: "Tomorrow 10AM" },
  { id: 5, name: "Eva Martinez", job: "DevOps Engineer", score: 68, status: "completed", date: "1d ago" },
];

const activeJobs = [
  { id: 1, title: "Senior Frontend Engineer", applicants: 45, interviews: 12, avgScore: 82, status: "active" },
  { id: 2, title: "Full Stack Developer", applicants: 38, interviews: 8, avgScore: 76, status: "active" },
  { id: 3, title: "Backend Engineer", applicants: 52, interviews: 15, avgScore: 79, status: "active" },
  { id: 4, title: "DevOps Engineer", applicants: 21, interviews: 5, avgScore: 71, status: "active" },
];

export default function RecruiterDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Recruiter Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of your hiring pipeline</p>
        </div>
        <Link href="/recruiter/jobs" className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">add</span> Create Job
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.label}</span>
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.trend}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Candidates */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent Candidates</h2>
            <Link href="/recruiter/monitoring" className="text-sm text-primary font-medium hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {recentCandidates.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">person</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{c.name}</p>
                    <p className="text-xs text-slate-500">{c.job} · {c.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {c.status === "completed" && c.score !== null && (
                    <span className={`text-sm font-bold ${c.score >= 85 ? "text-green-600" : c.score >= 70 ? "text-amber-600" : "text-red-500"}`}>
                      {c.score}/100
                    </span>
                  )}
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    c.status === "completed" ? "bg-green-100 text-green-700" :
                    c.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {c.status === "in-progress" ? "Live" : c.status === "scheduled" ? "Scheduled" : "Done"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Jobs */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Active Jobs</h2>
            <Link href="/recruiter/jobs" className="text-sm text-primary font-medium hover:underline">Manage</Link>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {activeJobs.map((job) => (
              <div key={job.id} className="p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white mb-2">{job.title}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{job.applicants}</p>
                    <p className="text-[10px] text-slate-500">Applied</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{job.interviews}</p>
                    <p className="text-[10px] text-slate-500">Interviews</p>
                  </div>
                  <div className="text-center bg-slate-50 dark:bg-slate-700/50 rounded-lg py-1.5">
                    <p className="text-sm font-bold text-primary">{job.avgScore}</p>
                    <p className="text-[10px] text-slate-500">Avg Score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
