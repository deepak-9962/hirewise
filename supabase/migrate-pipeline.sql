-- ============================================================
-- HIREWISE — Incremental Migration: Hiring Pipeline
-- Run this in Supabase SQL Editor to add the new tables/columns
-- Safe to re-run (uses IF NOT EXISTS / IF NOT EXISTS checks)
-- ============================================================

-- 1. Add new columns to JOBS table
alter table public.jobs add column if not exists openings int default 1;
alter table public.jobs add column if not exists test_duration_minutes int default 30;
alter table public.jobs add column if not exists test_instructions text default '';

-- 2. Create APPLICATIONS table
create table if not exists public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete cascade,
  status text default 'applied' check (status in ('applied', 'under_review', 'test_enabled', 'test_completed', 'rejected', 'hired')),
  cover_note text default '',
  resume_url text default '',
  applied_at timestamptz default now(),
  unique(job_id, candidate_id)
);

-- 3. Create JOB_QUESTIONS table
create table if not exists public.job_questions (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  order_index int default 0,
  time_limit_seconds int default 300,
  unique(job_id, question_id)
);

-- 4. Add application_id to INTERVIEWS table
alter table public.interviews add column if not exists application_id uuid references public.applications(id) on delete set null;

-- 5. Enable RLS on new tables
alter table public.applications enable row level security;
alter table public.job_questions enable row level security;

-- 6. RLS policies for APPLICATIONS
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'applications' and policyname = 'Candidates view own applications') then
    create policy "Candidates view own applications" on public.applications
      for select using (
        candidate_id = auth.uid() or
        exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'applications' and policyname = 'Candidates can apply') then
    create policy "Candidates can apply" on public.applications
      for insert with check (
        candidate_id = auth.uid()
      );
  end if;

  if not exists (select 1 from pg_policies where tablename = 'applications' and policyname = 'Recruiters can update applications') then
    create policy "Recruiters can update applications" on public.applications
      for update using (
        exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
      );
  end if;
end $$;

-- 7. RLS policies for JOB_QUESTIONS
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'job_questions' and policyname = 'Job questions are viewable by everyone') then
    create policy "Job questions are viewable by everyone" on public.job_questions
      for select using (true);
  end if;

  if not exists (select 1 from pg_policies where tablename = 'job_questions' and policyname = 'Recruiters can manage job questions') then
    create policy "Recruiters can manage job questions" on public.job_questions
      for all using (
        exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
      );
  end if;
end $$;

-- Done! Your database now supports the full hiring pipeline.
