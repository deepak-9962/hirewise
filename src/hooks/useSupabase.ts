"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient();

// ── Helper: try FK join, fall back to manual join ──
async function queryWithFallback<T>(
  primaryQuery: () => PromiseLike<{ data: T | null; error: any }>,
  fallbackQuery: () => PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const result = await primaryQuery();
  // If 400 error (usually FK join issue), try fallback
  if (result.error && String(result.error?.code ?? result.error?.message ?? result.error).includes("400")) {
    return fallbackQuery();
  }
  // Also check for "Could not find a relationship" type PostgREST errors
  if (result.error && /relationship|foreign key|hint/i.test(String(result.error?.message ?? ""))) {
    return fallbackQuery();
  }
  return result;
}

async function enrichWithProfiles<T extends Record<string, any>>(
  items: T[],
  idField: string
): Promise<(T & { profiles: any })[]> {
  const ids = [...new Set(items.map((i) => i[idField]).filter(Boolean))];
  if (ids.length === 0) return items.map((i) => ({ ...i, profiles: null }));
  const { data: profiles } = await supabase.from("profiles").select("id, name, email").in("id", ids);
  const map = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  return items.map((i) => ({ ...i, profiles: map.get(i[idField]) ?? null }));
}

async function enrichWithJobs<T extends Record<string, any>>(
  items: T[],
  idField: string,
  fields = "id, title, department, type, status, target_skills"
): Promise<(T & { jobs: any })[]> {
  const ids = [...new Set(items.map((i) => i[idField]).filter(Boolean))];
  if (ids.length === 0) return items.map((i) => ({ ...i, jobs: null }));
  const { data: jobs } = await supabase.from("jobs").select(fields).in("id", ids);
  const map = new Map((jobs ?? []).map((j: any) => [j.id, j]));
  return items.map((i) => ({ ...i, jobs: map.get(i[idField]) ?? null }));
}

// ── Generic fetch helper ──
export function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Always use latest queryFn via ref (avoids stale closure issues)
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await queryFnRef.current();
      if (error) setError(String(error));
      else setData(data);
    } catch (err) {
      setError(String(err));
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Profiles ──
export function useProfile() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () => supabase.from("profiles").select("*").eq("id", user!.id).single(),
    [user?.id],
    { enabled: !!user?.id }
  );
}

export function useAllProfiles(roleFilter?: string) {
  return useSupabaseQuery(() => {
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (roleFilter && roleFilter !== "all") q = q.eq("role", roleFilter);
    return q;
  }, [roleFilter]);
}

// ── Jobs ──
export function useJobs(status?: string) {
  return useSupabaseQuery(() => {
    let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    return q;
  }, [status]);
}

export function useJobById(id?: string) {
  return useSupabaseQuery(
    () => supabase.from("jobs").select("*").eq("id", id!).single(),
    [id],
    { enabled: !!id }
  );
}

export function useInterviewsByJob(jobId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("interviews")
            .select("*, profiles!candidate_id(name, email)")
            .eq("job_id", jobId!)
            .order("created_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("interviews")
            .select("*")
            .eq("job_id", jobId!)
            .order("created_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles(data, "candidate_id");
          return { data: enriched as any, error: null };
        }
      );
    },
    [jobId],
    { enabled: !!jobId }
  );
}

export async function createJob(job: {
  title: string;
  department: string;
  type: string;
  description: string;
  target_skills: string[];
  recruiter_id: string;
  openings?: number;
}) {
  return supabase.from("jobs").insert(job).select().single();
}

export async function updateJob(id: string, updates: Record<string, unknown>) {
  const res = await fetch(`/api/jobs/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? "Update failed" };
  }
  return { error: null };
}

export async function deleteJob(id: string) {
  const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { error: body.error ?? "Delete failed" };
  }
  return { error: null };
}

// ── Applications ──
export function useApplications(jobId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("applications")
            .select("*, profiles!candidate_id(name, email)")
            .eq("job_id", jobId!)
            .order("applied_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("job_id", jobId!)
            .order("applied_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles(data, "candidate_id");
          return { data: enriched as any, error: null };
        }
      );
    },
    [jobId],
    { enabled: !!jobId }
  );
}

export function useCandidateApplications(userId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("applications")
            .select("*, jobs(id, title, department, type, status, target_skills)")
            .eq("candidate_id", userId!)
            .order("applied_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("applications")
            .select("*")
            .eq("candidate_id", userId!)
            .order("applied_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithJobs(data, "job_id");
          return { data: enriched as any, error: null };
        }
      );
    },
    [userId],
    { enabled: !!userId }
  );
}

export async function createApplication(jobId: string, candidateId: string, coverNote?: string) {
  const res = await fetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ job_id: jobId, candidate_id: candidateId, cover_note: coverNote }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { data: null, error: body.error ?? "Failed to apply" };
  return { data: body, error: null };
}

export async function updateApplicationStatus(id: string, status: string) {
  const res = await fetch(`/api/applications/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { error: body.error ?? "Update failed" };
  return { error: null, data: body };
}

export async function createInterview(applicationId: string, candidateId: string, jobId: string) {
  const res = await fetch("/api/applications/enable-test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ application_id: applicationId, candidate_id: candidateId, job_id: jobId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { data: null, error: body.error ?? "Failed to enable test" };
  return { data: body, error: null };
}

// ── Job Questions ──
export function useJobQuestions(jobId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("job_questions")
            .select("*, questions(*)")
            .eq("job_id", jobId!)
            .order("order_index", { ascending: true }),
        async () => {
          const { data, error } = await supabase
            .from("job_questions")
            .select("*")
            .eq("job_id", jobId!)
            .order("order_index", { ascending: true });
          return { data, error };
        }
      );
    },
    [jobId],
    { enabled: !!jobId }
  );
}

export async function addJobQuestion(jobId: string, questionId: string, orderIndex: number) {
  return supabase.from("job_questions").insert({ job_id: jobId, question_id: questionId, order_index: orderIndex });
}

export async function removeJobQuestion(jobId: string, questionId: string) {
  return supabase.from("job_questions").delete().eq("job_id", jobId).eq("question_id", questionId);
}

// ── All Applications (recruiter view, via admin API) ──
export function useAllApplications(limit = 20) {
  const [data, setData] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/all?limit=${limit}`);
      const json = await res.json();
      if (!res.ok) { setError(json.error ?? "Failed"); setData([]); }
      else setData(Array.isArray(json) ? json : []);
    } catch (e: any) {
      setError(e?.message ?? "Network error");
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// ── Application Stats (recruiter dashboard counters) ──
export function useApplicationStats() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/applications/stats");
      if (res.ok) setStats(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refetch();
    // Refetch whenever the tab becomes visible (e.g. user navigates back)
    const onVisible = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  return { stats, loading, refetch };
}

// ── Open Jobs (for candidates) ──
export function useOpenJobs() {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("jobs")
            .select("*, profiles!recruiter_id(name, email)")
            .eq("status", "active")
            .order("created_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("jobs")
            .select("*")
            .eq("status", "active")
            .order("created_at", { ascending: false });
          return { data, error };
        }
      );
    },
    []
  );
}

export async function applyToJob(jobId: string, candidateId: string) {
  // Check if already applied
  const { data: existing } = await supabase
    .from("interviews")
    .select("id")
    .eq("job_id", jobId)
    .eq("candidate_id", candidateId)
    .maybeSingle();

  if (existing) {
    return { data: null, error: "You have already applied to this job." };
  }

  // Get question count for this job
  const { count } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("job_id", jobId);

  // Create interview
  const { data, error } = await supabase
    .from("interviews")
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      status: "scheduled",
      scheduled_at: new Date().toISOString(),
      total_questions: count ?? 0,
    })
    .select()
    .single();

  if (!error) {
    // Increment applicants_count on the job
    await supabase.rpc("increment_applicants", { job_id_input: jobId }).catch(() => {
      // Fallback: manual increment if RPC doesn't exist
      supabase
        .from("jobs")
        .select("applicants_count")
        .eq("id", jobId)
        .single()
        .then(({ data: job }: { data: any }) => {
          if (job) {
            supabase
              .from("jobs")
              .update({ applicants_count: (job.applicants_count || 0) + 1 })
              .eq("id", jobId);
          }
        });
    });
  }

  return { data, error };
}

// ── Questions ──
export function useQuestions(filter?: string) {
  return useSupabaseQuery(() => {
    let q = supabase.from("questions").select("*").order("created_at", { ascending: false });
    if (filter && filter !== "all") q = q.eq("type", filter);
    return q;
  }, [filter]);
}

export async function createQuestion(question: {
  text: string;
  type: string;
  skill: string;
  difficulty: string;
  time_limit?: number;
  language?: string;
  starter_code?: string;
  test_cases?: unknown;
  job_id?: string;
  created_by: string;
}) {
  return supabase.from("questions").insert(question).select().single();
}

export async function deleteQuestion(id: string) {
  return supabase.from("questions").delete().eq("id", id);
}

// ── Interviews ──
export function useCandidateInterviews(candidateId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("interviews")
            .select("*, jobs(title, department)")
            .eq("candidate_id", candidateId!)
            .order("scheduled_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("interviews")
            .select("*")
            .eq("candidate_id", candidateId!)
            .order("scheduled_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithJobs(data, "job_id", "id, title, department");
          return { data: enriched as any, error: null };
        }
      );
    },
    [candidateId],
    { enabled: !!candidateId }
  );
}

export function useAllInterviews(status?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () => {
          let q = supabase
            .from("interviews")
            .select("*, profiles!candidate_id(name, email), jobs(title)")
            .order("created_at", { ascending: false });
          if (status && status !== "all") q = q.eq("status", status);
          return q;
        },
        async () => {
          let q = supabase
            .from("interviews")
            .select("*")
            .order("created_at", { ascending: false });
          if (status && status !== "all") q = q.eq("status", status);
          const { data, error } = await q;
          if (error || !data) return { data, error };
          const withProfiles = await enrichWithProfiles(data, "candidate_id");
          const withJobs = await enrichWithJobs(withProfiles, "job_id", "id, title");
          return { data: withJobs as any, error: null };
        }
      );
    },
    [status]
  );
}

export async function updateInterview(id: string, updates: Record<string, unknown>) {
  return supabase.from("interviews").update(updates).eq("id", id);
}

// ── Interview Responses ──
export function useInterviewResponses(interviewId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("interview_responses")
            .select("*, questions(*)")
            .eq("interview_id", interviewId!)
            .order("created_at", { ascending: true }),
        async () => {
          const { data, error } = await supabase
            .from("interview_responses")
            .select("*")
            .eq("interview_id", interviewId!)
            .order("created_at", { ascending: true });
          return { data, error };
        }
      );
    },
    [interviewId],
    { enabled: !!interviewId }
  );
}

export async function upsertResponse(response: {
  interview_id: string;
  question_id: string;
  answer_text: string;
  code_output?: string;
  language_used?: string;
  is_submitted: boolean;
}) {
  return supabase.from("interview_responses").upsert(response, {
    onConflict: "interview_id,question_id",
  });
}

// ── Reports ──
export function useCandidateReports(candidateId?: string) {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("reports")
            .select("*, interviews(*, jobs(title, department))")
            .eq("candidate_id", candidateId!)
            .order("generated_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("candidate_id", candidateId!)
            .order("generated_at", { ascending: false });
          return { data, error };
        }
      );
    },
    [candidateId],
    { enabled: !!candidateId }
  );
}

export function useAllReports() {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("reports")
            .select("*, profiles!candidate_id(name, email), interviews(*, jobs(title))")
            .order("generated_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("reports")
            .select("*")
            .order("generated_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles(data, "candidate_id");
          return { data: enriched as any, error: null };
        }
      );
    }
  );
}

export async function updateReport(id: string, updates: Record<string, unknown>) {
  return supabase.from("reports").update(updates).eq("id", id);
}

// ── Recruiter Analytics ──
export function useRecruiterAnalytics() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analytics/recruiter");
      if (res.ok) setData(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    refetch();
    const onVisible = () => { if (document.visibilityState === "visible") refetch(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refetch]);

  return { data, loading, refetch };
}

// ── Bias Alerts ──
export function useBiasAlerts() {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("bias_alerts")
            .select("*, profiles!candidate_id(name)")
            .order("created_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("bias_alerts")
            .select("*")
            .order("created_at", { ascending: false });
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles(data, "candidate_id");
          return { data: enriched as any, error: null };
        }
      );
    }
  );
}

export async function dismissBiasAlert(id: string) {
  return supabase.from("bias_alerts").update({ dismissed: true }).eq("id", id);
}

// ── AI Evaluations ──
export function useAIEvaluations() {
  return useSupabaseQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("ai_evaluations")
            .select("*, profiles!candidate_id(name)")
            .order("created_at", { ascending: false })
            .limit(50),
        async () => {
          const { data, error } = await supabase
            .from("ai_evaluations")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(50);
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles(data, "candidate_id");
          return { data: enriched as any, error: null };
        }
      );
    }
  );
}

// ── System Logs ──
export function useSystemLogs() {
  return useSupabaseQuery(() =>
    supabase
      .from("system_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)
  );
}

// ── Dashboard Stats (aggregated) ──
export function useDashboardStats(role: string) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const results: Record<string, number> = {};

      if (role === "admin") {
        const [users, interviews, jobs, alerts] = await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase.from("interviews").select("id", { count: "exact", head: true }),
          supabase.from("jobs").select("id", { count: "exact", head: true }),
          supabase.from("bias_alerts").select("id", { count: "exact", head: true }).eq("dismissed", false),
        ]);
        results.totalUsers = users.count ?? 0;
        results.totalInterviews = interviews.count ?? 0;
        results.totalJobs = jobs.count ?? 0;
        results.activeBiasAlerts = alerts.count ?? 0;
      }

      if (role === "recruiter") {
        const [jobs, interviews, completed, candidates] = await Promise.all([
          supabase.from("jobs").select("id", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("interviews").select("id", { count: "exact", head: true }),
          supabase.from("interviews").select("id", { count: "exact", head: true }).eq("status", "completed"),
          supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "candidate"),
        ]);
        results.activeJobs = jobs.count ?? 0;
        results.totalInterviews = interviews.count ?? 0;
        results.completed = completed.count ?? 0;
        results.totalCandidates = candidates.count ?? 0;
      }

      setStats(results);
      setLoading(false);
    };
    fetchStats();
  }, [role]);

  return { stats, loading };
}
