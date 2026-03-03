"use client";

import { useState } from "react";

const allUsers = [
  { id: 1, name: "John Doe", email: "john@email.com", role: "candidate", status: "active", joined: "Mar 1, 2026", interviews: 7 },
  { id: 2, name: "Sarah Miller", email: "sarah@company.com", role: "recruiter", status: "active", joined: "Feb 28, 2026", interviews: 0 },
  { id: 3, name: "Alex Rivera", email: "alex@email.com", role: "candidate", status: "active", joined: "Feb 27, 2026", interviews: 3 },
  { id: 4, name: "Emma Wilson", email: "emma@corp.com", role: "recruiter", status: "suspended", joined: "Feb 25, 2026", interviews: 0 },
  { id: 5, name: "Mike Chen", email: "mike@email.com", role: "candidate", status: "active", joined: "Feb 24, 2026", interviews: 5 },
  { id: 6, name: "Lisa Park", email: "lisa@startup.com", role: "recruiter", status: "active", joined: "Feb 22, 2026", interviews: 0 },
  { id: 7, name: "David Kim", email: "david@email.com", role: "candidate", status: "inactive", joined: "Feb 20, 2026", interviews: 1 },
  { id: 8, name: "Admin User", email: "admin@hirewise.io", role: "admin", status: "active", joined: "Jan 1, 2026", interviews: 0 },
];

export default function AdminUsersPage() {
  const [roleFilter, setRoleFilter] = useState("all");
  const filtered = roleFilter === "all" ? allUsers : allUsers.filter((u) => u.role === roleFilter);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View and manage all platform users</p>
        </div>
        <div className="text-sm text-slate-500 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          Total: <span className="font-bold text-slate-900 dark:text-white">{allUsers.length}</span> users
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "candidate", "recruiter", "admin"].map((r) => (
          <button
            key={r}
            onClick={() => setRoleFilter(r)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              roleFilter === r ? "bg-primary text-white" : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {r.charAt(0).toUpperCase() + r.slice(1)} ({r === "all" ? allUsers.length : allUsers.filter((u) => u.role === r).length})
          </button>
        ))}
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">User</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Role</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Interviews</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Joined</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{u.name}</p>
                      <p className="text-xs text-slate-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${
                    u.role === "admin" ? "bg-red-100 text-red-700" :
                    u.role === "recruiter" ? "bg-blue-100 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>{u.role}</span>
                </td>
                <td className="px-5 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{u.interviews}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    u.status === "active" ? "bg-green-100 text-green-700" :
                    u.status === "suspended" ? "bg-red-100 text-red-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>{u.status}</span>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{u.joined}</td>
                <td className="px-5 py-4 text-right">
                  <div className="flex items-center gap-2 justify-end">
                    <button className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-primary transition-colors">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button className="size-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-red-500 transition-colors">
                      <span className="material-symbols-outlined text-sm">block</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
