-- ============================================================
-- HireWise Pipeline Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Add new columns to jobs
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS openings integer NOT NULL DEFAULT 1;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS test_duration_minutes integer NOT NULL DEFAULT 60;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS test_instructions text;

-- 2. Add application_id to interviews (soft reference)
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS application_id uuid;
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES jobs(id) ON DELETE SET NULL;

-- 3. applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  candidate_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'applied'
    CHECK (status IN ('applied', 'under_review', 'test_enabled', 'test_completed', 'rejected', 'hired')),
  applied_at timestamptz DEFAULT now(),
  cover_note text,
  UNIQUE(job_id, candidate_id)
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Candidates can insert own applications" ON applications;
CREATE POLICY "Candidates can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Candidates can view own applications" ON applications;
CREATE POLICY "Candidates can view own applications" ON applications
  FOR SELECT USING (auth.uid() = candidate_id);

DROP POLICY IF EXISTS "Service role full access applications" ON applications;
CREATE POLICY "Service role full access applications" ON applications
  FOR ALL USING (true);

-- 4. job_questions junction table
CREATE TABLE IF NOT EXISTS job_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES jobs(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  time_limit_seconds integer,
  UNIQUE(job_id, question_id)
);

ALTER TABLE job_questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on job_questions" ON job_questions;
CREATE POLICY "Allow all on job_questions" ON job_questions FOR ALL USING (true);

-- Done!
