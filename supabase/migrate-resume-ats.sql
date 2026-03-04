-- ============================================================
-- HIREWISE — Resume ATS Scoring Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Run AFTER migrate-ats.sql
-- ============================================================

-- 1. Resume Scores table — stores AI-generated resume analysis per application
CREATE TABLE IF NOT EXISTS public.resume_scores (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  overall_score numeric(5,2) DEFAULT 0,
  skill_match_score numeric(5,2) DEFAULT 0,
  experience_score numeric(5,2) DEFAULT 0,
  education_score numeric(5,2) DEFAULT 0,
  keyword_matches text[] DEFAULT '{}',
  missing_skills text[] DEFAULT '{}',
  recommendation text DEFAULT '',
  ai_summary text DEFAULT '',
  parsed_resume_text text DEFAULT '',
  scored_at timestamptz DEFAULT now(),
  UNIQUE(application_id)
);

-- 2. RLS for resume_scores
ALTER TABLE public.resume_scores ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view all scores
CREATE POLICY "Recruiters can view resume scores"
  ON public.resume_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

-- Candidates can view their own scores
CREATE POLICY "Candidates can view own resume scores"
  ON public.resume_scores
  FOR SELECT
  USING (candidate_id = auth.uid());

-- Service role (API routes) can insert/update via admin client,
-- but for direct client usage, recruiters can manage:
CREATE POLICY "Recruiters can create resume scores"
  ON public.resume_scores
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

CREATE POLICY "Recruiters can update resume scores"
  ON public.resume_scores
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

CREATE POLICY "Recruiters can delete resume scores"
  ON public.resume_scores
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_scores_application_id ON public.resume_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_resume_scores_candidate_id ON public.resume_scores(candidate_id);
CREATE INDEX IF NOT EXISTS idx_resume_scores_job_id ON public.resume_scores(job_id);
CREATE INDEX IF NOT EXISTS idx_resume_scores_overall ON public.resume_scores(overall_score DESC);

-- Done! The resume_scores table is now ready.
-- Resume ATS scores will be stored here when recruiters trigger scoring from the ATS pipeline.
