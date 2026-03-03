"use client";

import { useState } from "react";
import Link from "next/link";

const jobs = [
  { id: 1, title: "Senior Frontend Engineer", department: "Engineering", type: "Full-time", applicants: 45, interviews: 12, status: "active", created: "Feb 15, 2026" },
  { id: 2, title: "Full Stack Developer", department: "Engineering", type: "Full-time", applicants: 38, interviews: 8, status: "active", created: "Feb 20, 2026" },
  { id: 3, title: "Backend Engineer", department: "Engineering", type: "Full-time", applicants: 52, interviews: 15, status: "active", created: "Feb 10, 2026" },
  { id: 4, title: "DevOps Engineer", department: "Infrastructure", type: "Full-time", applicants: 21, interviews: 5, status: "active", created: "Feb 25, 2026" },
  { id: 5, title: "Product Designer", department: "Design", type: "Full-time", applicants: 30, interviews: 7, status: "paused", created: "Jan 30, 2026" },
  { id: 6, title: "Data Scientist", department: "Data", type: "Contract", applicants: 18, interviews: 3, status: "closed", created: "Jan 15, 2026" },
];

export default function RecruiterJobsPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="animate-fade-in">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Roles</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Manage your job postings and view applicant pipelines</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="bg-primary text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-all shadow-md shadow-primary/20 flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span> {showCreate ? "Cancel" : "Create Job"}
        </button>
      </div>

      {/* Create Job Form */}
      {showCreate && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-6 animate-fade-in">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Create New Job</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job Title</label>
              <input type="text" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <input type="text" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <select className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Skills</label>
              <input type="text" className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="React, TypeScript, Node.js" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job Description</label>
            <textarea className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none" placeholder="Paste your job description here. AI will generate tailored assessments..."></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
            <button className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all">Create & Generate Assessments</button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Job Title</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Department</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Type</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Applicants</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Interviews</th>
              <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Status</th>
              <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-5 py-4">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.title}</p>
                  <p className="text-xs text-slate-400">Created {job.created}</p>
                </td>
                <td className="px-5 py-4 text-sm text-slate-500">{job.department}</td>
                <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{job.type}</span></td>
                <td className="px-5 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{job.applicants}</td>
                <td className="px-5 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{job.interviews}</td>
                <td className="px-5 py-4 text-center">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    job.status === "active" ? "bg-green-100 text-green-700" :
                    job.status === "paused" ? "bg-amber-100 text-amber-700" :
                    "bg-slate-100 text-slate-500"
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/recruiter/jobs/${job.id}`} className="text-sm text-primary font-medium hover:underline">Manage</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
