-- ============================================================
-- HireWise — Analytics RPC Functions Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Average interview_response score grouped by question skill
CREATE OR REPLACE FUNCTION analytics_skill_scores()
RETURNS TABLE(subject text, score numeric) AS $$
BEGIN
  RETURN QUERY
    SELECT
      q.skill AS subject,
      ROUND(AVG(ir.score), 1) AS score
    FROM interview_responses ir
    JOIN questions q ON q.id = ir.question_id
    WHERE ir.score IS NOT NULL
      AND q.skill IS NOT NULL
      AND q.skill <> ''
    GROUP BY q.skill
    ORDER BY score DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Average score + count grouped by question difficulty
CREATE OR REPLACE FUNCTION analytics_difficulty_performance()
RETURNS TABLE(difficulty text, avg numeric, count bigint) AS $$
BEGIN
  RETURN QUERY
    SELECT
      q.difficulty,
      ROUND(AVG(ir.score), 1) AS avg,
      COUNT(*)::bigint AS count
    FROM interview_responses ir
    JOIN questions q ON q.id = ir.question_id
    WHERE ir.score IS NOT NULL
      AND q.difficulty IS NOT NULL
    GROUP BY q.difficulty
    ORDER BY
      CASE q.difficulty
        WHEN 'Easy' THEN 1
        WHEN 'Medium' THEN 2
        WHEN 'Hard' THEN 3
        ELSE 4
      END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Weekly avg interview score + distinct candidate count (last 6 weeks)
CREATE OR REPLACE FUNCTION analytics_weekly_scores()
RETURNS TABLE(week text, score numeric, candidates bigint) AS $$
BEGIN
  RETURN QUERY
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', now()) - interval '5 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS week_start
    )
    SELECT
      'W' || ROW_NUMBER() OVER (ORDER BY w.week_start)::text AS week,
      COALESCE(ROUND(AVG(i.score), 1), 0) AS score,
      COALESCE(COUNT(DISTINCT i.candidate_id), 0)::bigint AS candidates
    FROM weeks w
    LEFT JOIN interviews i
      ON i.completed_at >= w.week_start
     AND i.completed_at < w.week_start + interval '1 week'
     AND i.status = 'completed'
     AND i.score IS NOT NULL
    GROUP BY w.week_start
    ORDER BY w.week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Weekly completed vs abandoned (cancelled) interviews (last 6 weeks)
CREATE OR REPLACE FUNCTION analytics_weekly_completions()
RETURNS TABLE(week text, completed bigint, abandoned bigint) AS $$
BEGIN
  RETURN QUERY
    WITH weeks AS (
      SELECT generate_series(
        date_trunc('week', now()) - interval '5 weeks',
        date_trunc('week', now()),
        interval '1 week'
      ) AS week_start
    )
    SELECT
      'W' || ROW_NUMBER() OVER (ORDER BY w.week_start)::text AS week,
      COALESCE(COUNT(*) FILTER (WHERE i.status = 'completed'), 0)::bigint AS completed,
      COALESCE(COUNT(*) FILTER (WHERE i.status = 'cancelled'), 0)::bigint AS abandoned
    FROM weeks w
    LEFT JOIN interviews i
      ON i.completed_at >= w.week_start
     AND i.completed_at < w.week_start + interval '1 week'
     AND i.status IN ('completed', 'cancelled')
    GROUP BY w.week_start
    ORDER BY w.week_start;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Summary stats: avg score, completion rate, avg time per question, bias alert count
CREATE OR REPLACE FUNCTION analytics_summary()
RETURNS TABLE(avg_score numeric, completion_rate numeric, avg_time_per_question numeric, bias_alerts bigint) AS $$
BEGIN
  RETURN QUERY
    SELECT
      COALESCE(ROUND(AVG(i.score), 1), 0) AS avg_score,
      CASE
        WHEN COUNT(*) FILTER (WHERE i.status IN ('completed', 'cancelled')) = 0 THEN 0
        ELSE ROUND(
          100.0 * COUNT(*) FILTER (WHERE i.status = 'completed')
          / COUNT(*) FILTER (WHERE i.status IN ('completed', 'cancelled')),
          0
        )
      END AS completion_rate,
      COALESCE(
        ROUND(
          AVG(
            CASE
              WHEN i.total_questions > 0
              THEN i.elapsed_seconds::numeric / i.total_questions / 60
              ELSE NULL
            END
          ),
          1
        ),
        0
      ) AS avg_time_per_question,
      (SELECT COUNT(*) FROM bias_alerts WHERE dismissed = false)::bigint AS bias_alerts
    FROM interviews i
    WHERE i.status = 'completed'
      AND i.score IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users (recruiters/admins access the page)
GRANT EXECUTE ON FUNCTION analytics_skill_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_difficulty_performance() TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_weekly_scores() TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_weekly_completions() TO authenticated;
GRANT EXECUTE ON FUNCTION analytics_summary() TO authenticated;
