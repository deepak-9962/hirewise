"use client";

import { useState } from "react";
import Link from "next/link";
import { useJobs, createJob } from "@/hooks/useSupabase";
import { useAuth } from "@/context/AuthContext";

export default function RecruiterJobsPage() {
  const { user } = useAuth();
  const { data: jobsData, loading, refetch } = useJobs();
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", department: "", type: "Full-time", target_skills: "", description: "" });

  const jobs = (jobsData ?? []) as any[];

  const handleCreate = async () => {
    if (!form.title.trim() || !user) return;
    setCreating(true);
    await createJob({
      title: form.title,
      department: form.department,
      type: form.type,
      description: form.description,
      target_skills: form.target_skills.split(",").map((s) => s.trim()).filter(Boolean),
      recruiter_id: user.id,
    });
    setForm({ title: "", department: "", type: "Full-time", target_skills: "", description: "" });
    setCreating(false);
    setShowCreate(false);
    refetch();
  };

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
              <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Senior Frontend Engineer" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Department</label>
              <input type="text" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="e.g. Engineering" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Target Skills</label>
              <input type="text" value={form.target_skills} onChange={(e) => setForm({ ...form, target_skills: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" placeholder="React, TypeScript, Node.js" />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Job Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 h-32 resize-none" placeholder="Paste your job description here. AI will generate tailored assessments..."></textarea>
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-all">Cancel</button>
            <button onClick={handleCreate} disabled={creating} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">{creating ? "Creating..." : "Create & Generate Assessments"}</button>
          </div>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">work_off</span>
          <p className="text-sm text-slate-500">No jobs yet. Create your first job posting.</p>
        </div>
      ) : (
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
              {jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{job.title}</p>
                    <p className="text-xs text-slate-400">Created {new Date(job.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-500">{job.department}</td>
                  <td className="px-5 py-4"><span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{job.type}</span></td>
                  <td className="px-5 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{job.applicants_count ?? 0}</td>
                  <td className="px-5 py-4 text-center text-sm font-medium text-slate-900 dark:text-white">{job.interviews_count ?? 0}</td>
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
      )}
    </div>
  );
}
