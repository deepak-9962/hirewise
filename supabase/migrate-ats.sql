-- ============================================================
-- HIREWISE — ATS (Applicant Tracking System) Migration
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Expand application status to support full ATS pipeline stages
-- Add new statuses: shortlisted, interview_scheduled, offered, withdrawn
ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_status_check;

ALTER TABLE public.applications
  ADD CONSTRAINT applications_status_check
  CHECK (status IN (
    'applied',
    'under_review',
    'shortlisted',
    'test_enabled',
    'test_completed',
    'interview_scheduled',
    'offered',
    'hired',
    'rejected',
    'withdrawn'
  ));

-- 2. Pipeline Notes table — for recruiter notes on applications
CREATE TABLE IF NOT EXISTS public.pipeline_notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid REFERENCES public.applications(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- 3. Add proctoring_data to interviews (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'interviews'
    AND column_name = 'proctoring_data'
  ) THEN
    ALTER TABLE public.interviews ADD COLUMN proctoring_data jsonb DEFAULT NULL;
  END IF;
END
$$;

-- 4. RLS for pipeline_notes
ALTER TABLE public.pipeline_notes ENABLE ROW LEVEL SECURITY;

-- Recruiters and admins can view all notes
CREATE POLICY "Recruiters can view pipeline notes"
  ON public.pipeline_notes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

-- Recruiters and admins can create notes
CREATE POLICY "Recruiters can create pipeline notes"
  ON public.pipeline_notes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('recruiter', 'admin')
    )
  );

-- Authors can update their own notes
CREATE POLICY "Authors can update own notes"
  ON public.pipeline_notes
  FOR UPDATE
  USING (author_id = auth.uid());

-- Authors can delete their own notes
CREATE POLICY "Authors can delete own notes"
  ON public.pipeline_notes
  FOR DELETE
  USING (author_id = auth.uid());

-- 5. Create indexes for common ATS queries
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_notes_application_id ON public.pipeline_notes(application_id);
CREATE INDEX IF NOT EXISTS idx_interviews_application_id ON public.interviews(application_id);

-- Done! The ATS pipeline is now ready.
-- The application statuses have been expanded to support the full pipeline:
--   applied → under_review → shortlisted → test_enabled → test_completed →
--   interview_scheduled → offered → hired
--   (rejected / withdrawn can happen at any stage)
