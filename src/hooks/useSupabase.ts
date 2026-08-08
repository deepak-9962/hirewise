"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient();

// ── Timeout Guard: prevent queries from hanging indefinitely ──
async function withTimeout<T>(promise: PromiseLike<T>, ms = 6000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Query timed out after ${ms}ms`));
    }, ms);
    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

// ── Shared Multiplexed Realtime Subscription ──
// Subscribes per-table using valid Supabase Realtime postgres_changes filters
// to prevent WebSocket reconnection loops and channel saturation.
let _sharedRealtimeChannel: ReturnType<typeof supabase.channel> | null = null;
const _realtimeListeners = new Map<string, Set<() => void>>();

function getSharedRealtimeChannel() {
  if (!_sharedRealtimeChannel) {
    _sharedRealtimeChannel = supabase.channel("hirewise-global-realtime");
  }
  return _sharedRealtimeChannel;
}

function subscribeToTable(table: string, callback: () => void) {
  if (!table) return () => {};

  if (!_realtimeListeners.has(table)) {
    _realtimeListeners.set(table, new Set());

    // Register a valid postgres_changes listener for this specific table
    getSharedRealtimeChannel()
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: table },
        () => {
          const listeners = _realtimeListeners.get(table);
          if (listeners) {
            listeners.forEach((cb) => cb());
          }
        }
      )
      .subscribe();
  }

  _realtimeListeners.get(table)!.add(callback);

  return () => {
    const set = _realtimeListeners.get(table);
    if (set) {
      set.delete(callback);
    }
  };
}

// ── Helper: try FK join, fall back to manual join ──
async function queryWithFallback<T>(
  primaryQuery: () => PromiseLike<{ data: T | null; error: any }>,
  fallbackQuery: () => PromiseLike<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  try {
    const result = await withTimeout(primaryQuery(), 4000);
    if (result.error) {
      const errStr = String(result.error?.code ?? result.error?.message ?? result.error);
      if (errStr.includes("400") || /relationship|foreign key|hint/i.test(errStr)) {
        return await withTimeout(fallbackQuery(), 4000);
      }
    }
    return result;
  } catch (err) {
    try {
      return await withTimeout(fallbackQuery(), 4000);
    } catch {
      return { data: null, error: err };
    }
  }
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

// ── Generic fetch helper (with optional polling & instant SWR memory cache) ──
const queryMemoryCache = new Map<string, any>();

export function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  deps: unknown[] = [],
  options: { enabled?: boolean; pollInterval?: number } = {}
) {
  const { enabled = true, pollInterval } = options;
  const cacheKey = JSON.stringify(deps);

  const hasCache = queryMemoryCache.has(cacheKey);

  const [data, setData] = useState<T | null>(() => {
    return hasCache ? queryMemoryCache.get(cacheKey) : null;
  });
  const [loading, setLoading] = useState<boolean>(() => !hasCache && enabled);
  const [error, setError] = useState<string | null>(null);

  // Sync state when cacheKey changes
  const prevCacheKey = useRef(cacheKey);
  if (prevCacheKey.current !== cacheKey) {
    prevCacheKey.current = cacheKey;
    const cached = queryMemoryCache.get(cacheKey) ?? null;
    setData(cached);
    setLoading(cached === null && enabled);
  }

  // Always use latest queryFn via ref (avoids stale closure issues)
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const refetch = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    if (!queryMemoryCache.has(cacheKey)) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await withTimeout(queryFnRef.current(), 6000);
      if (res.error) {
        setError(String(res.error));
      } else {
        setData(res.data);
        queryMemoryCache.set(cacheKey, res.data);
      }
    } catch (err) {
      console.warn("useSupabaseQuery timeout/error:", err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [cacheKey, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Polling support
  useEffect(() => {
    if (!pollInterval || !enabled) return;
    const id = setInterval(() => {
      refetch();
    }, pollInterval);
    return () => clearInterval(id);
  }, [pollInterval, enabled, refetch]);

  return { data, loading, error, refetch };
}

// ── Realtime-enabled fetch helper ──
// Subscribes to shared Realtime channel to auto-refetch without channel saturation.
export function useRealtimeQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  realtimeConfig: {
    table: string;
    event?: "INSERT" | "UPDATE" | "DELETE" | "*";
    filter?: string;
  },
  deps: unknown[] = [],
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const base = useSupabaseQuery(queryFn, deps, options);

  const refetchRef = useRef(base.refetch);
  refetchRef.current = base.refetch;

  useEffect(() => {
    if (!enabled || !realtimeConfig.table) return;

    const unsubscribe = subscribeToTable(realtimeConfig.table, () => {
      refetchRef.current();
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, realtimeConfig.table]);

  return base;
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
  }, [roleFilter], { pollInterval: 60_000 });
}

// ── Jobs ──
export function useJobs(status?: string) {
  return useRealtimeQuery(
    () => {
      let q = supabase.from("jobs").select("*").order("created_at", { ascending: false });
      if (status && status !== "all") q = q.eq("status", status);
      return q;
    },
    { table: "jobs" },
    [status]
  );
}

export function useJobById(id?: string) {
  return useRealtimeQuery(
    () => supabase.from("jobs").select("*").eq("id", id!).single(),
    { table: "jobs", filter: id ? `id=eq.${id}` : undefined },
    [id],
    { enabled: !!id }
  );
}

export function useInterviewsByJob(jobId?: string) {
  return useRealtimeQuery(
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
    { table: "interviews", filter: jobId ? `job_id=eq.${jobId}` : undefined },
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
  return useRealtimeQuery(
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
    { table: "applications", filter: jobId ? `job_id=eq.${jobId}` : undefined },
    [jobId],
    { enabled: !!jobId }
  );
}

export function useCandidateApplications(userId?: string) {
  return useRealtimeQuery(
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
    { table: "applications", filter: userId ? `candidate_id=eq.${userId}` : undefined },
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
  return useRealtimeQuery(
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
    { table: "job_questions", filter: jobId ? `job_id=eq.${jobId}` : undefined },
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

// ── Open Jobs (for candidates) ──
export function useOpenJobs() {
  return useRealtimeQuery(
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
    { table: "jobs" },
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
  return useRealtimeQuery(
    () => {
      let q = supabase.from("questions").select("*").order("created_at", { ascending: false });
      if (filter && filter !== "all") q = q.eq("type", filter);
      return q;
    },
    { table: "questions" },
    [filter]
  );
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
  return useRealtimeQuery(
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
    { table: "interviews", filter: candidateId ? `candidate_id=eq.${candidateId}` : undefined },
    [candidateId],
    { enabled: !!candidateId }
  );
}

export function useAllInterviews(status?: string) {
  return useRealtimeQuery(
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
    { table: "interviews" },
    [status]
  );
}

export async function updateInterview(id: string, updates: Record<string, unknown>) {
  return supabase.from("interviews").update(updates).eq("id", id);
}

// ── Realtime Monitoring Hook ──
export function useRealtimeMonitoring() {
  const [liveInterviews, setLiveInterviews] = useState<any[]>([]);
  const [completedInterviews, setCompletedInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<string | null>(null);

  const fetchMonitoringData = useCallback(async () => {
    try {
      const { data: liveData } = await queryWithFallback(
        () =>
          supabase
            .from("interviews")
            .select("*, profiles!candidate_id(name, email), jobs(title, department)")
            .neq("status", "completed")
            .order("created_at", { ascending: false }),
        async () => {
          const { data, error } = await supabase
            .from("interviews")
            .select("*")
            .neq("status", "completed")
            .order("created_at", { ascending: false });
          if (error || !data) return { data, error };
          const withProfiles = await enrichWithProfiles(data, "candidate_id");
          const withJobs = await enrichWithJobs(withProfiles, "job_id", "id, title, department");
          return { data: withJobs as any, error: null };
        }
      );

      const { data: completedData } = await queryWithFallback(
        () =>
          supabase
            .from("interviews")
            .select("*, profiles!candidate_id(name, email), jobs(title, department)")
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(15),
        async () => {
          const { data, error } = await supabase
            .from("interviews")
            .select("*")
            .eq("status", "completed")
            .order("completed_at", { ascending: false })
            .limit(15);
          if (error || !data) return { data, error };
          const withProfiles = await enrichWithProfiles(data, "candidate_id");
          const withJobs = await enrichWithJobs(withProfiles, "job_id", "id, title, department");
          return { data: withJobs as any, error: null };
        }
      );

      if (liveData) setLiveInterviews(liveData);
      if (completedData) setCompletedInterviews(completedData);
    } catch (err) {
      console.error("Failed to fetch monitoring data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonitoringData();

    const channel = supabase
      .channel("realtime-monitoring-channel")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "interviews" },
        (payload: any) => {
          const eventMsg = `Interview ${payload.eventType ? payload.eventType.toLowerCase() : "updated"}`;
          setLastEvent(eventMsg);
          fetchMonitoringData();
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "interview_responses" },
        () => {
          setLastEvent("Candidate response updated");
          fetchMonitoringData();
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMonitoringData]);

  return {
    liveInterviews,
    completedInterviews,
    loading,
    isConnected,
    lastEvent,
    refetch: fetchMonitoringData,
  };
}


// ── Interview Responses ──
export function useInterviewResponses(interviewId?: string) {
  return useRealtimeQuery(
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
    { table: "interview_responses", filter: interviewId ? `interview_id=eq.${interviewId}` : undefined },
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
  return useRealtimeQuery(
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
    { table: "reports", filter: candidateId ? `candidate_id=eq.${candidateId}` : undefined },
    [candidateId],
    { enabled: !!candidateId }
  );
}

export function useAllReports() {
  return useRealtimeQuery(
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
    },
    { table: "reports" }
  );
}

export function useReport(reportId?: string) {
  return useRealtimeQuery(
    async () => {
      return queryWithFallback(
        () =>
          supabase
            .from("reports")
            .select("*, profiles!candidate_id(name, email), interviews(*, jobs(title, department))")
            .eq("id", reportId!)
            .single(),
        async () => {
          const { data, error } = await supabase
            .from("reports")
            .select("*")
            .eq("id", reportId!)
            .single();
          if (error || !data) return { data, error };
          const enriched = await enrichWithProfiles([data], "candidate_id");
          return { data: enriched[0] as any, error: null };
        }
      );
    },
    { table: "reports", filter: reportId ? `id=eq.${reportId}` : undefined },
    [reportId],
    { enabled: !!reportId }
  );
}

export async function updateReport(id: string, updates: Record<string, unknown>) {
  return supabase.from("reports").update(updates).eq("id", id);
}

// ── Bias Alerts ──
export function useBiasAlerts() {
  return useRealtimeQuery(
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
    },
    { table: "bias_alerts" }
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
    },
    [],
    { pollInterval: 60_000 }
  );
}

// ── System Logs ──
export function useSystemLogs() {
  return useSupabaseQuery(
    () =>
      supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    [],
    { pollInterval: 30_000 }
  );
}

// ── Dashboard Stats (aggregated) ──
export function useDashboardStats(role: string) {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
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
  }, [role]);

  useEffect(() => {
    fetchStats();

    const channel = supabase
      .channel(`realtime-dashboard-stats-${role}`)
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "interviews" }, () => fetchStats())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "jobs" }, () => fetchStats())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "applications" }, () => fetchStats())
      .on("postgres_changes" as any, { event: "*", schema: "public", table: "profiles" }, () => fetchStats())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, role]);

  // Poll every 30 seconds as fallback
  useEffect(() => {
    const id = setInterval(fetchStats, 30_000);
    return () => clearInterval(id);
  }, [fetchStats]);

  return { stats, loading };
}
