"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useJobById, useCandidateApplications, createApplication } from "@/hooks/useSupabase";
import { useAuth } from "@/context/AuthContext";

export default function CandidateJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const { data: job, loading: jobLoading } = useJobById(id);
  const { data: applicationsData, loading: appsLoading, refetch } = useCandidateApplications(user?.id);

  const [coverNote, setCoverNote] = useState("");
  const [applying, setApplying] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applications = (applicationsData ?? []) as any[];
  const existingApp = applications.find((a: any) => a.job_id === id);
  const j = job as any;

  const statusLabels: Record<string, { label: string; color: string }> = {
    applied: { label: "Application Submitted", color: "bg-blue-100 text-blue-700" },
    under_review: { label: "Under Review", color: "bg-amber-100 text-amber-700" },
    test_enabled: { label: "Test Ready — Click to Start!", color: "bg-green-100 text-green-700" },
    test_completed: { label: "Test Completed", color: "bg-purple-100 text-purple-700" },
    rejected: { label: "Not Selected", color: "bg-red-100 text-red-700" },
    hired: { label: "Hired!", color: "bg-green-100 text-green-700" },
  };

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    setError(null);
    const { error: err } = await createApplication(id, user.id, coverNote);
    if (err) {
      setError(err);
    } else {
      setShowForm(false);
      setCoverNote("");
      refetch();
    }
    setApplying(false);
  };

  if (jobLoading || appsLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!j) {
    return (
      <div className="text-center py-20 text-slate-500">
        Job not found. <Link href="/candidate/jobs" className="text-primary hover:underline">Browse Jobs</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <Link href="/candidate/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span> Back to Jobs
      </Link>

      {/* Header */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{j.title}</h1>
            <p className="text-slate-500 mt-1">{j.department} · {j.type}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
              {j.openings ?? 1} opening{(j.openings ?? 1) !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-slate-400">Posted {new Date(j.created_at).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Skills */}
        {(j.target_skills ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {(j.target_skills as string[]).map((skill: string) => (
              <span key={skill} className="text-xs bg-primary/10 text-primary font-medium px-2.5 py-1 rounded-full">{skill}</span>
            ))}
          </div>
        )}
      </div>

      {/* Description */}
      {j.description && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6 mb-4">
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">Job Description</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{j.description}</p>
        </div>
      )}

      {/* Test info */}
      {j.test_instructions && (
        <div className="bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800 p-5 mb-4">
          <h2 className="font-bold text-amber-800 dark:text-amber-400 mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">quiz</span> Test Instructions
          </h2>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{j.test_instructions}</p>
          {j.test_duration_minutes && (
            <p className="text-xs text-amber-600 mt-2 font-medium">⏱ Duration: {j.test_duration_minutes} minutes</p>
          )}
        </div>
      )}

      {/* Application CTA */}
      <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {existingApp ? (
          <div className="text-center">
            <span className={`inline-block text-sm font-bold px-4 py-2 rounded-full mb-3 ${statusLabels[existingApp.status]?.color ?? "bg-slate-100 text-slate-600"}`}>
              {statusLabels[existingApp.status]?.label ?? existingApp.status}
            </span>
            <p className="text-xs text-slate-400">Applied {new Date(existingApp.applied_at).toLocaleDateString()}</p>

            {/* Show "Take Test" if test is enabled and interview exists */}
            {existingApp.status === "test_enabled" && (
              <div className="mt-4">
                <Link
                  href="/candidate/interviews"
                  className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">videocam</span> Go to My Interviews
                </Link>
              </div>
            )}
          </div>
        ) : showForm ? (
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white mb-4">Apply for {j.title}</h2>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Cover Note <span className="font-normal text-slate-400">(optional)</span>
              </label>
              <textarea
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
                placeholder="Briefly describe why you're a great fit..."
                rows={4}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
            </div>
            {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowForm(false)} className="px-4 py-2.5 text-sm font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={applying}
                className="flex-1 bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {applying ? (
                  <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Submitting...</>
                ) : (
                  <><span className="material-symbols-outlined text-sm">send</span> Submit Application</>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="font-bold text-slate-900 dark:text-white mb-1">Interested in this role?</h2>
            <p className="text-sm text-slate-500 mb-4">Apply now. Once the recruiter reviews your application, you'll take an AI-powered technical interview.</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-primary text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-primary/20"
            >
              Apply Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
