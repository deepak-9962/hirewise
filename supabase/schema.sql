-- ============================================================
-- HIREWISE — Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 0. Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  phone text default '',
  location text default '',
  experience text default '',
  role text not null default 'candidate' check (role in ('candidate', 'recruiter', 'admin')),
  status text not null default 'active' check (status in ('active', 'suspended', 'inactive')),
  skills text[] default '{}',
  resume_url text default '',
  avatar_url text default '',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'candidate')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. JOBS
-- ============================================================
create table public.jobs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  department text default '',
  type text default 'Full-time' check (type in ('Full-time', 'Part-time', 'Contract')),
  description text default '',
  target_skills text[] default '{}',
  status text default 'active' check (status in ('active', 'paused', 'closed')),
  recruiter_id uuid references public.profiles(id) on delete set null,
  openings int default 1,
  test_duration_minutes int default 30,
  test_instructions text default '',
  applicants_count int default 0,
  interviews_count int default 0,
  avg_score numeric(5,2) default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 3. QUESTIONS
-- ============================================================
create table public.questions (
  id uuid primary key default uuid_generate_v4(),
  text text not null,
  type text not null default 'descriptive' check (type in ('descriptive', 'coding', 'mcq')),
  skill text default '',
  difficulty text default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  time_limit int default 300,
  language text default '',
  starter_code text default '',
  test_cases jsonb default '[]'::jsonb,
  options jsonb default '[]'::jsonb,
  job_id uuid references public.jobs(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ============================================================
-- 4. APPLICATIONS (candidate applies to a job)
-- ============================================================
create table public.applications (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete cascade,
  status text default 'applied' check (status in ('applied', 'under_review', 'test_enabled', 'test_completed', 'rejected', 'hired')),
  cover_note text default '',
  resume_url text default '',
  applied_at timestamptz default now(),
  unique(job_id, candidate_id)
);

-- ============================================================
-- 5. JOB QUESTIONS (links questions to jobs for the test)
-- ============================================================
create table public.job_questions (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  order_index int default 0,
  time_limit_seconds int default 300,
  unique(job_id, question_id)
);

-- ============================================================
-- 6. INTERVIEWS
-- ============================================================
create table public.interviews (
  id uuid primary key default uuid_generate_v4(),
  job_id uuid references public.jobs(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  status text default 'scheduled' check (status in ('scheduled', 'in-progress', 'completed', 'cancelled')),
  type text default 'Technical',
  score numeric(5,2),
  is_paused boolean default false,
  current_question int default 0,
  total_questions int default 0,
  elapsed_seconds int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 7. INTERVIEW RESPONSES (answers per question)
-- ============================================================
create table public.interview_responses (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interviews(id) on delete cascade,
  question_id uuid references public.questions(id) on delete cascade,
  answer_text text default '',
  code_output text default '',
  language_used text default '',
  is_submitted boolean default false,
  score numeric(5,2),
  ai_feedback text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 8. REPORTS (AI-generated interview reports)
-- ============================================================
create table public.reports (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interviews(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete cascade,
  overall_score numeric(5,2) default 0,
  technical_score numeric(5,2) default 0,
  communication_score numeric(5,2) default 0,
  reasoning_score numeric(5,2) default 0,
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  ai_summary text default '',
  recruiter_feedback text default '',
  feedback_submitted boolean default false,
  generated_at timestamptz default now()
);

-- ============================================================
-- 9. BIAS ALERTS
-- ============================================================
create table public.bias_alerts (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  risk text default 'Medium' check (risk in ('High', 'Medium', 'Low')),
  candidate_id uuid references public.profiles(id) on delete set null,
  interview_id uuid references public.interviews(id) on delete set null,
  detail text default '',
  factors text[] default '{}',
  dismissed boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- 10. AI EVALUATION LOGS
-- ============================================================
create table public.ai_evaluations (
  id uuid primary key default uuid_generate_v4(),
  interview_id uuid references public.interviews(id) on delete cascade,
  candidate_id uuid references public.profiles(id) on delete set null,
  eval_type text default '',
  model_used text default 'GPT-4o',
  score numeric(5,2),
  confidence numeric(5,2),
  latency_ms int default 0,
  tokens_used int default 0,
  retries int default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 11. SYSTEM LOGS (admin metrics)
-- ============================================================
create table public.system_logs (
  id uuid primary key default uuid_generate_v4(),
  level text default 'info' check (level in ('info', 'warning', 'error')),
  message text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 12. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.questions enable row level security;
alter table public.applications enable row level security;
alter table public.job_questions enable row level security;
alter table public.interviews enable row level security;
alter table public.interview_responses enable row level security;
alter table public.reports enable row level security;
alter table public.bias_alerts enable row level security;
alter table public.ai_evaluations enable row level security;
alter table public.system_logs enable row level security;

-- PROFILES: users can read all profiles, update their own
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- JOBS: anyone can read, recruiters/admins can insert/update
create policy "Jobs are viewable by everyone" on public.jobs
  for select using (true);
create policy "Recruiters can create jobs" on public.jobs
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Recruiters can update their jobs" on public.jobs
  for update using (
    recruiter_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- QUESTIONS: anyone can read, recruiters/admins can manage
create policy "Questions are viewable by everyone" on public.questions
  for select using (true);
create policy "Recruiters can create questions" on public.questions
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Recruiters can update questions" on public.questions
  for update using (
    created_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
create policy "Recruiters can delete questions" on public.questions
  for delete using (
    created_by = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- APPLICATIONS: candidates see/create own, recruiters/admins see all
create policy "Candidates view own applications" on public.applications
  for select using (
    candidate_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Candidates can apply" on public.applications
  for insert with check (
    candidate_id = auth.uid()
  );
create policy "Recruiters can update applications" on public.applications
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );

-- JOB_QUESTIONS: anyone can read, recruiters/admins can manage
create policy "Job questions are viewable by everyone" on public.job_questions
  for select using (true);
create policy "Recruiters can manage job questions" on public.job_questions
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );

-- INTERVIEWS: candidates see own, recruiters see all for their jobs, admins see all
create policy "Candidates see own interviews" on public.interviews
  for select using (
    candidate_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Recruiters can create interviews" on public.interviews
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Interview participants can update" on public.interviews
  for update using (
    candidate_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );

-- INTERVIEW RESPONSES: candidates can manage own, recruiters can read
create policy "Candidates manage own responses" on public.interview_responses
  for all using (
    exists (
      select 1 from public.interviews
      where interviews.id = interview_responses.interview_id
      and (interviews.candidate_id = auth.uid() or
           exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin')))
    )
  );

-- REPORTS: candidates see own, recruiters/admins see all
create policy "Reports access" on public.reports
  for select using (
    candidate_id = auth.uid() or
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "System can create reports" on public.reports
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );
create policy "Recruiters can update reports" on public.reports
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );

-- BIAS ALERTS: admins only
create policy "Admins can manage bias alerts" on public.bias_alerts
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- AI EVALUATIONS: admins and recruiters
create policy "Admins view evaluations" on public.ai_evaluations
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('recruiter', 'admin'))
  );

-- SYSTEM LOGS: admin only
create policy "Admins view logs" on public.system_logs
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- 11. SEED DATA (Optional — for testing)
-- ============================================================
-- You can insert seed data after running this schema.
-- Example:
-- insert into public.jobs (title, department, type, status, target_skills)
-- values ('Senior React Developer', 'Engineering', 'Full-time', 'active', ARRAY['React', 'TypeScript', 'Node.js']);
