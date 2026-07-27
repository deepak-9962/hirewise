"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";

const supabase = createClient();

// ── Types ──
export interface SkillScore {
  subject: string;
  score: number;
}

export interface DifficultyPerformance {
  difficulty: string;
  avg: number;
  count: number;
}

export interface WeeklyScore {
  week: string;
  score: number;
  candidates: number;
}

export interface WeeklyCompletion {
  week: string;
  completed: number;
  abandoned: number;
}

export interface SummaryStats {
  avg_score: number;
  completion_rate: number;
  avg_time_per_question: number;
  bias_alerts: number;
}

export interface AnalyticsData {
  radarData: SkillScore[];
  barData: DifficultyPerformance[];
  lineData: WeeklyScore[];
  completionData: WeeklyCompletion[];
  summaryStats: SummaryStats | null;
  loading: boolean;
  error: string | null;
}

// ── Hook ──
export function useAnalyticsData(): AnalyticsData {
  const [radarData, setRadarData] = useState<SkillScore[]>([]);
  const [barData, setBarData] = useState<DifficultyPerformance[]>([]);
  const [lineData, setLineData] = useState<WeeklyScore[]>([]);
  const [completionData, setCompletionData] = useState<WeeklyCompletion[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [skillRes, diffRes, weeklyRes, completionRes, summaryRes] =
        await Promise.all([
          supabase.rpc("analytics_skill_scores"),
          supabase.rpc("analytics_difficulty_performance"),
          supabase.rpc("analytics_weekly_scores"),
          supabase.rpc("analytics_weekly_completions"),
          supabase.rpc("analytics_summary"),
        ]);

      // Collect any RPC errors
      const errors = [skillRes, diffRes, weeklyRes, completionRes, summaryRes]
        .filter((r) => r.error)
        .map((r) => r.error?.message ?? String(r.error));

      if (errors.length > 0) {
        setError(errors.join("; "));
      }

      setRadarData(
        (skillRes.data ?? []).map((r: any) => ({
          subject: r.subject,
          score: Number(r.score),
        }))
      );

      setBarData(
        (diffRes.data ?? []).map((r: any) => ({
          difficulty: r.difficulty,
          avg: Number(r.avg),
          count: Number(r.count),
        }))
      );

      setLineData(
        (weeklyRes.data ?? []).map((r: any) => ({
          week: r.week,
          score: Number(r.score),
          candidates: Number(r.candidates),
        }))
      );

      setCompletionData(
        (completionRes.data ?? []).map((r: any) => ({
          week: r.week,
          completed: Number(r.completed),
          abandoned: Number(r.abandoned),
        }))
      );

      if (summaryRes.data && summaryRes.data.length > 0) {
        const s = summaryRes.data[0];
        setSummaryStats({
          avg_score: Number(s.avg_score),
          completion_rate: Number(s.completion_rate),
          avg_time_per_question: Number(s.avg_time_per_question),
          bias_alerts: Number(s.bias_alerts),
        });
      } else {
        setSummaryStats(null);
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { radarData, barData, lineData, completionData, summaryStats, loading, error };
}
