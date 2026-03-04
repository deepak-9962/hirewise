"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  useJobById,
  useJobQuestions,
  useQuestions,
  useApplications,
  updateJob,
  updateApplicationStatus,
  createInterview,
  addJobQuestion,
  removeJobQuestion,
} from "@/hooks/useSupabase";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  paused: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-500",
};

const appStatusColors: Record<string, string> = {
  applied: "bg-blue-100 text-blue-700",
  under_review: "bg-amber-100 text-amber-700",
  shortlisted: "bg-cyan-100 text-cyan-700",
  test_enabled: "bg-green-100 text-green-700",
  test_completed: "bg-purple-100 text-purple-700",
  interview_scheduled: "bg-orange-100 text-orange-700",
  offered: "bg-teal-100 text-teal-700",
  rejected: "bg-red-100 text-red-600",
  hired: "bg-emerald-100 text-emerald-700",
  withdrawn: "bg-slate-100 text-slate-500",
};

const appStatusLabels: Record<string, string> = {
  applied: "Applied",
  under_review: "Under Review",
  shortlisted: "Shortlisted",
  test_enabled: "Test Enabled",
  test_completed: "Test Done",
  interview_scheduled: "Interview",
  offered: "Offered",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

type Tab = "overview" | "questions" | "applications";

export default function ManageJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: job, loading: jobLoading, refetch: refetchJob } = useJobById(id);
  const { data: jobQuestionsData, loading: jqLoading, refetch: refetchJQ } = useJobQuestions(id);
  const { data: allQuestionsData, loading: aqLoading } = useQuestions();
  const { data: applicationsData, loading: appsLoading, refetch: refetchApps } = useApplications(id);

  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generateLoading, setGenerateLoading] = useState(false);
  const [generateCount, setGenerateCount] = useState(5);
  const [questionFilter, setQuestionFilter] = useState("all");

  const j = job as any;
  const jobQuestions = (jobQuestionsData ?? []) as any[];
  const linkedQuestionIds = new Set(jobQuestions.map((jq: any) => jq.question_id));
  const allQuestions = ((allQuestionsData ?? []) as any[]).filter((q: any) =>
    questionFilter === "all" ? true : q.type === questionFilter
  );
  const applications = (applicationsData ?? []) as any[];

  const startEdit = () => {
    setForm({
      title: j?.title ?? "",
      department: j?.department ?? "",
      type: j?.type ?? "Full-time",
      openings: String(j?.openings ?? 1),
      description: j?.description ?? "",
      target_skills: (j?.target_skills ?? []).join(", "),
      test_duration_minutes: String(j?.test_duration_minutes ?? 60),
      test_instructions: j?.test_instructions ?? "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    await updateJob(id, {
      title: form.title,
      department: form.department,
      type: form.type,
      openings: parseInt(form.openings) || 1,
      description: form.description,
      target_skills: form.target_skills.split(",").map((s: string) => s.trim()).filter(Boolean),
      test_duration_minutes: parseInt(form.test_duration_minutes) || 60,
      test_instructions: form.test_instructions,
    });
    setSaving(false);
    setEditing(false);
    refetchJob();
  };

  const handleStatusChange = async (status: string) => {
    await updateJob(id, { status });
    refetchJob();
  };

  const handleEnableTest = async (app: any) => {
    setActionLoading(app.id + "_enable");
    await createInterview(app.id, app.candidate_id, id);
    refetchApps();
    setActionLoading(null);
  };

  const handleReject = async (appId: string) => {
    setActionLoading(appId + "_reject");
    await updateApplicationStatus(appId, "rejected");
    refetchApps();
    setActionLoading(null);
  };

  const handleMarkHired = async (appId: string) => {
    setActionLoading(appId + "_hire");
    await updateApplicationStatus(appId, "hired");
    refetchApps();
    setActionLoading(null);
  };

  const handleAddQuestion = async (questionId: string) => {
    setActionLoading("add_" + questionId);
    await addJobQuestion(id, questionId, jobQuestions.length);
    refetchJQ();
    setActionLoading(null);
  };

  const handleRemoveQuestion = async (questionId: string) => {
    setActionLoading("rm_" + questionId);
    await removeJobQuestion(id, questionId);
    refetchJQ();
    setActionLoading(null);
  };

  const handleGenerateQuestions = async () => {
    if (!j) return;
    setGenerateLoading(true);
    try {
      const res = await fetch("/api/ai/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_id: id,
          job_title: j.title,
          skills: j.target_skills ?? [],
          count: generateCount,
        }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response from server");
      const data = JSON.parse(text);
      if (data.success) {
        refetchJQ();
      } else {
        alert("AI generation failed: " + (data.error ?? "Unknown error"));
      }
    } catch (err: any) {
      alert("Failed to generate questions: " + (err?.message ?? "Unknown error"));
    } finally {
      setGenerateLoading(false);
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="size-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!j) {
    return (
      <div className="text-center py-20 text-slate-500">
        Job not found. <Link href="/recruiter/jobs" className="text-primary hover:underline">Go back</Link>
      </div>
    );
  }

  const completedApps = applications.filter((a: any) => a.status === "test_completed").length;

  return (
    <div className="animate-fade-in max-w-6xl">
      {/* Back */}
      <Link href="/recruiter/jobs" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-6 transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span> Back to Jobs
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{j.title}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{j.department} · {j.type} · {j.openings ?? 1} opening{(j.openings ?? 1) !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {["active", "paused", "closed"].map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
                j.status === s
                  ? statusColors[s] + " border-transparent"
                  : "border-slate-200 dark:border-slate-700 text-slate-400 hover:border-slate-400"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <button
            onClick={startEdit}
            className="flex items-center gap-1.5 bg-primary text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            <span className="material-symbols-outlined text-base">edit</span> Edit
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Applications", value: applications.length, icon: "people", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tests Enabled", value: applications.filter((a: any) => ["test_enabled", "test_completed"].includes(a.status)).length, icon: "quiz", color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Tests Done", value: completedApps, icon: "check_circle", color: "text-green-600", bg: "bg-green-50" },
          { label: "Questions", value: jobQuestions.length, icon: "help_outline", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center gap-3">
            <div className={`size-10 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
              <span className={`material-symbols-outlined ${stat.color} text-xl`}>{stat.icon}</span>
            </div>
            <div>
              <p className="text-xs text-slate-500">{stat.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-6">
        {(["overview", "questions", "applications"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {t} {t === "applications" && applications.length > 0 && (
              <span className="ml-1 bg-primary/10 text-primary text-xs font-bold px-1.5 py-0.5 rounded-full">{applications.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 p-5">
          {editing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: "title", label: "Title", placeholder: "Job title" },
                { key: "department", label: "Department", placeholder: "e.g. Engineering" },
                { key: "openings", label: "Openings", placeholder: "1", type: "number" },
                { key: "test_duration_minutes", label: "Test Duration (min)", placeholder: "60", type: "number" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{field.label}</label>
                  <input
                    type={field.type ?? "text"}
                    value={form[field.key]}
                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option>Full-time</option><option>Part-time</option><option>Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Target Skills</label>
                <input value={form.target_skills} onChange={(e) => setForm({ ...form, target_skills: e.target.value })} placeholder="React, TypeScript, Node.js" className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Job Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Test Instructions</label>
                <textarea value={form.test_instructions} onChange={(e) => setForm({ ...form, test_instructions: e.target.value })} rows={3} placeholder="Instructions shown to the candidate before taking the test..." className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
              </div>
              <div className="md:col-span-2 flex justify-end gap-3">
                <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="bg-primary text-white px-6 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50">
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                {[
                  { label: "Department", value: j.department || "—" },
                  { label: "Type", value: j.type },
                  { label: "Openings", value: j.openings ?? 1 },
                  { label: "Test Duration", value: `${j.test_duration_minutes ?? 60} minutes` },
                  { label: "Posted", value: new Date(j.created_at).toLocaleDateString() },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between">
                    <span className="text-slate-500">{item.label}</span>
                    <span className="font-medium text-slate-900 dark:text-white">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-slate-500 mb-2">Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(j.target_skills ?? []).map((s: string) => (
                      <span key={s} className="text-xs bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                    {!j.target_skills?.length && <span className="text-slate-400 text-xs">No skills listed</span>}
                  </div>
                </div>
                {j.test_instructions && (
                  <div>
                    <p className="text-slate-500 mb-1">Test Instructions</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 bg-amber-50 dark:bg-amber-900/10 rounded-lg p-3 border border-amber-100 dark:border-amber-800">{j.test_instructions}</p>
                  </div>
                )}
                {j.description && (
                  <div>
                    <p className="text-slate-500 mb-1">Description</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-6">{j.description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Questions Tab ── */}
      {tab === "questions" && (
        <div className="space-y-6">
          {/* Linked questions */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Test Questions ({jobQuestions.length})</h2>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1} max={10}
                  value={generateCount}
                  onChange={(e) => setGenerateCount(Number(e.target.value))}
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={handleGenerateQuestions}
                  disabled={generateLoading}
                  className="flex items-center gap-1.5 bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50"
                >
                  {generateLoading ? (
                    <><span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> Generating...</>
                  ) : (
                    <><span className="material-symbols-outlined text-base">smart_toy</span> AI Generate</>
                  )}
                </button>
              </div>
            </div>
            {jqLoading ? (
              <div className="p-8 flex justify-center"><div className="size-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : jobQuestions.length === 0 ? (
              <div className="p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">help_outline</span>
                <p className="text-sm text-slate-500">No questions linked yet. Add from the bank below or AI generate.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {jobQuestions.map((jq: any, idx: number) => {
                  const q = jq.questions;
                  const diffColors: Record<string, string> = { Easy: "bg-green-100 text-green-700", Medium: "bg-amber-100 text-amber-700", Hard: "bg-red-100 text-red-700" };
                  return (
                    <div key={jq.id} className="p-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-400 mt-1 w-5 shrink-0">Q{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-2">{q?.text}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diffColors[q?.difficulty] ?? "bg-slate-100 text-slate-500"}`}>{q?.difficulty}</span>
                            <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full capitalize">{q?.type}</span>
                            <span className="text-xs text-slate-400">{q?.skill}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(q?.id)}
                        disabled={actionLoading === "rm_" + q?.id}
                        className="shrink-0 size-7 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Question bank picker */}
          <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-3">
              <h2 className="font-bold text-slate-900 dark:text-white">Question Bank</h2>
              <div className="flex gap-2">
                {["all", "descriptive", "coding"].map((f) => (
                  <button key={f} onClick={() => setQuestionFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all capitalize ${questionFilter === f ? "bg-primary text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-500"}`}>{f}</button>
                ))}
              </div>
            </div>
            {aqLoading ? (
              <div className="p-8 flex justify-center"><div className="size-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : allQuestions.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-slate-500">No questions in the bank yet. <Link href="/recruiter/questions" className="text-primary hover:underline">Add questions</Link></p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[400px] overflow-y-auto">
                {allQuestions.map((q: any) => {
                  const diffColors: Record<string, string> = { Easy: "bg-green-100 text-green-700", Medium: "bg-amber-100 text-amber-700", Hard: "bg-red-100 text-red-700" };
                  const isLinked = linkedQuestionIds.has(q.id);
                  return (
                    <div key={q.id} className={`p-4 flex items-start justify-between gap-3 ${isLinked ? "opacity-50" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white line-clamp-2">{q.text}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diffColors[q.difficulty] ?? "bg-slate-100 text-slate-500"}`}>{q.difficulty}</span>
                          <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-0.5 rounded-full capitalize">{q.type}</span>
                          <span className="text-xs text-slate-400">{q.skill}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddQuestion(q.id)}
                        disabled={isLinked || actionLoading === "add_" + q.id}
                        className={`shrink-0 size-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-40 ${isLinked ? "bg-green-100 text-green-600" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"}`}
                      >
                        <span className="material-symbols-outlined text-sm">{isLinked ? "check" : "add"}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Applications Tab ── */}
      {tab === "applications" && (
        <div className="bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="p-5 border-b border-slate-200 dark:border-slate-700">
            <h2 className="font-bold text-slate-900 dark:text-white">Applications ({applications.length})</h2>
          </div>
          {appsLoading ? (
            <div className="p-10 flex justify-center"><div className="size-6 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300 block mb-2">inbox</span>
              <p className="text-sm text-slate-500">No applications yet for this job.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {applications.map((app: any) => (
                <div key={app.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-primary text-sm">person</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{app.profiles?.name ?? "Unknown Candidate"}</p>
                      <p className="text-xs text-slate-400">{app.profiles?.email ?? "—"} · Applied {new Date(app.applied_at).toLocaleDateString()}</p>
                      {app.cover_note && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">"{app.cover_note}"</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${appStatusColors[app.status] ?? "bg-slate-100 text-slate-500"}`}>
                      {appStatusLabels[app.status] ?? app.status}
                    </span>

                    {(app.status === "applied" || app.status === "under_review") && (
                      <>
                        <button
                          onClick={() => handleEnableTest(app)}
                          disabled={actionLoading === app.id + "_enable"}
                          className="text-xs font-bold bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          {actionLoading === app.id + "_enable" ? "..." : <><span className="material-symbols-outlined text-xs">play_arrow</span> Enable Test</>}
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading === app.id + "_reject"}
                          className="text-xs font-bold bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {app.status === "test_completed" && (
                      <>
                        <button
                          onClick={() => handleMarkHired(app.id)}
                          disabled={actionLoading === app.id + "_hire"}
                          className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">handshake</span> Hire
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          disabled={actionLoading === app.id + "_reject"}
                          className="text-xs font-bold bg-red-50 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
