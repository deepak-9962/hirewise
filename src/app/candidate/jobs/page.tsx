"use client";

import { useState } from "react";
import Link from "next/link";
import { useJobs } from "@/hooks/useSupabase";
import { useAuth } from "@/context/AuthContext";

export default function CandidateJobsPage() {
  const { user } = useAuth();
  const { data: jobsData, loading } = useJobs("active");
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterType, setFilterType] = useState("all");

  const jobs = (jobsData ?? []) as any[];

  const departments = ["all", ...Array.from(new Set(jobs.map((j) => j.department).filter(Boolean)))];
  const types = ["all", "Full-time", "Part-time", "Contract"];

  const filtered = jobs.filter((j) => {
    const matchSearch =
      !search ||
      j.title?.toLowerCase().includes(search.toLowerCase()) ||
      j.department?.toLowerCase().includes(search.toLowerCase()) ||
      (j.target_skills ?? []).some((s: string) => s.toLowerCase().includes(search.toLowerCase()));
    const matchDept = filterDept === "all" || j.department === filterDept;
    const matchType = filterType === "all" || j.type === filterType;
    return matchSearch && matchDept && matchType;
  });

  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Browse Jobs</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Explore open positions and apply for interviews</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, skill, or department..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {departments.map((d) => (
            <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          {types.map((t) => (
            <option key={t} value={t}>{t === "all" ? "All Types" : t}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 block mb-3">work_off</span>
          <p className="text-sm text-slate-500">No jobs found{search ? ` for "${search}"` : ""}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job: any) => (
            <Link
              key={job.id}
              href={`/candidate/jobs/${job.id}`}
              className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5 hover:border-primary hover:shadow-md transition-all group block"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{job.title}</h3>
                  <p className="text-sm text-slate-500 mt-0.5">{job.department || "—"}</p>
                </div>
                <div className="flex gap-2 shrink-0 ml-3">
                  <span className="text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-full">{job.type}</span>
                  {(job.openings ?? 1) > 1 && (
                    <span className="text-xs font-medium bg-blue-50 text-blue-600 px-2 py-1 rounded-full">{job.openings} openings</span>
                  )}
                </div>
              </div>

              {(job.target_skills ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(job.target_skills as string[]).slice(0, 5).map((skill) => (
                    <span key={skill} className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                  {(job.target_skills as string[]).length > 5 && (
                    <span className="text-xs text-slate-400">+{(job.target_skills as string[]).length - 5} more</span>
                  )}
                </div>
              )}

              {job.description && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{job.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Posted {new Date(job.created_at).toLocaleDateString()}</span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  View & Apply <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
