"use client";

const systemStats = [
  { label: "Total Users", value: "1,247", icon: "group", bg: "bg-primary/10", color: "text-primary", delta: "+58 this week" },
  { label: "Active Interviews", value: "23", icon: "videocam", bg: "bg-green-50", color: "text-green-600", delta: "8 live now" },
  { label: "AI API Calls", value: "12.4K", icon: "smart_toy", bg: "bg-purple-50", color: "text-purple-600", delta: "Today" },
  { label: "Sandbox Usage", value: "89%", icon: "memory", bg: "bg-amber-50", color: "text-amber-600", delta: "3 containers active" },
];

const recentUsers = [
  { id: 1, name: "John Doe", email: "john@email.com", role: "candidate", status: "active", joined: "Mar 1, 2026" },
  { id: 2, name: "Sarah Miller", email: "sarah@company.com", role: "recruiter", status: "active", joined: "Feb 28, 2026" },
  { id: 3, name: "Alex Rivera", email: "alex@email.com", role: "candidate", status: "active", joined: "Feb 27, 2026" },
  { id: 4, name: "Emma Wilson", email: "emma@corp.com", role: "recruiter", status: "suspended", joined: "Feb 25, 2026" },
  { id: 5, name: "Mike Chen", email: "mike@email.com", role: "candidate", status: "active", joined: "Feb 24, 2026" },
];

const biasAlerts = [
  { id: 1, type: "Grammar Penalty", risk: "Medium", candidate: "Eva Martinez", detail: "Potential over-penalization for non-native grammar patterns", time: "2h ago" },
  { id: 2, type: "Confidence Bias", risk: "Low", candidate: "Frank Lee", detail: "Confidence score may be affected by response length rather than content quality", time: "1d ago" },
];

export default function AdminDashboard() {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">System overview and management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {systemStats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">{stat.label}</span>
              <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                <span className={`material-symbols-outlined ${stat.color}`}>{stat.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.delta}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Recent Users</h2>
            <a href="/admin/users" className="text-sm text-primary font-medium hover:underline">Manage all</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Role</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                {recentUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-5 py-3">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full capitalize ${
                        u.role === "admin" ? "bg-red-100 text-red-700" :
                        u.role === "recruiter" ? "bg-blue-100 text-blue-700" :
                        "bg-slate-100 text-slate-600"
                      }`}>{u.role}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${u.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-slate-500">{u.joined}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bias Alerts */}
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white">Bias Alerts</h2>
            <a href="/admin/bias-alerts" className="text-sm text-primary font-medium hover:underline">View all</a>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-700">
            {biasAlerts.map((alert) => (
              <div key={alert.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{alert.type}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.risk === "High" ? "bg-red-100 text-red-700" :
                    alert.risk === "Medium" ? "bg-amber-100 text-amber-700" :
                    "bg-green-100 text-green-700"
                  }`}>{alert.risk}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{alert.detail}</p>
                <p className="text-[10px] text-slate-400">Candidate: {alert.candidate} · {alert.time}</p>
              </div>
            ))}
            {biasAlerts.length === 0 && (
              <div className="p-8 text-center text-slate-400">
                <span className="material-symbols-outlined text-3xl mb-2">check_circle</span>
                <p className="text-sm">No active bias alerts</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
