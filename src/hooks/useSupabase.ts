"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { useAuth } from "@/context/AuthContext";

const supabase = createClient();

// ── Generic fetch helper ──
export function useSupabaseQuery<T>(
  queryFn: () => PromiseLike<{ data: T | null; error: unknown }>,
  deps: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await queryFn();
    if (error) setError(String(error));
    else setData(data);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}

// ── Profiles ──
export function useProfile() {
  const { user } = useAuth();
  return useSupabaseQuery(
    () => supabase.from("profiles").select("*").eq("id", user?.id ?? "").single(),
    [user?.id]
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

export async function createJob(job: {
  title: string;
  department: string;
  type: string;
  description: string;
  target_skills: string[];
  recruiter_id: string;
}) {
  return supabase.from("jobs").insert(job).select().single();
}

export async function updateJob(id: string, updates: Record<string, unknown>) {
  return supabase.from("jobs").update(updates).eq("id", id);
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
    () =>
      supabase
        .from("interviews")
        .select("*, jobs(title, department)")
        .eq("candidate_id", candidateId ?? "")
        .order("scheduled_at", { ascending: false }),
    [candidateId]
  );
}

export function useAllInterviews(status?: string) {
  return useSupabaseQuery(() => {
    let q = supabase
      .from("interviews")
      .select("*, profiles!candidate_id(name, email), jobs(title)")
      .order("created_at", { ascending: false });
    if (status && status !== "all") q = q.eq("status", status);
    return q;
  }, [status]);
}

export async function updateInterview(id: string, updates: Record<string, unknown>) {
  return supabase.from("interviews").update(updates).eq("id", id);
}

// ── Interview Responses ──
export function useInterviewResponses(interviewId?: string) {
  return useSupabaseQuery(
    () =>
      supabase
        .from("interview_responses")
        .select("*, questions(*)")
        .eq("interview_id", interviewId ?? "")
        .order("created_at", { ascending: true }),
    [interviewId]
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
    () =>
      supabase
        .from("reports")
        .select("*, interviews(*, jobs(title, department))")
        .eq("candidate_id", candidateId ?? "")
        .order("generated_at", { ascending: false }),
    [candidateId]
  );
}

export function useAllReports() {
  return useSupabaseQuery(() =>
    supabase
      .from("reports")
      .select("*, profiles!candidate_id(name, email), interviews(*, jobs(title))")
      .order("generated_at", { ascending: false })
  );
}

export async function updateReport(id: string, updates: Record<string, unknown>) {
  return supabase.from("reports").update(updates).eq("id", id);
}

// ── Bias Alerts ──
export function useBiasAlerts() {
  return useSupabaseQuery(() =>
    supabase
      .from("bias_alerts")
      .select("*, profiles!candidate_id(name)")
      .order("created_at", { ascending: false })
  );
}

export async function dismissBiasAlert(id: string) {
  return supabase.from("bias_alerts").update({ dismissed: true }).eq("id", id);
}

// ── AI Evaluations ──
export function useAIEvaluations() {
  return useSupabaseQuery(() =>
    supabase
      .from("ai_evaluations")
      .select("*, profiles!candidate_id(name)")
      .order("created_at", { ascending: false })
      .limit(50)
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
