-- ============================================================
-- CANDIDATE PROFILE EXTENSION
-- Adds education, experience, projects, social links,
-- profile visibility + RLS policies
-- ============================================================

-- 1. ALTER PROFILES — add new columns
alter table public.profiles
  add column if not exists bio text default '',
  add column if not exists headline text default '',
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'private')),
  add column if not exists linkedin_url text default '',
  add column if not exists github_url text default '',
  add column if not exists portfolio_url text default '';

-- ============================================================
-- 2. CANDIDATE EDUCATION
-- ============================================================
create table if not exists public.candidate_education (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  institution text not null default '',
  degree text not null default '',
  field_of_study text default '',
  start_date date,
  end_date date,
  grade text default '',
  description text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 3. CANDIDATE EXPERIENCE
-- ============================================================
create table if not exists public.candidate_experience (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  company text not null default '',
  title text not null default '',
  location text default '',
  start_date date,
  end_date date,
  is_current boolean default false,
  description text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 4. CANDIDATE PROJECTS
-- ============================================================
create table if not exists public.candidate_projects (
  id uuid primary key default uuid_generate_v4(),
  candidate_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  description text default '',
  technologies text[] default '{}',
  live_url text default '',
  github_url text default '',
  image_url text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- 5. ENABLE RLS
-- ============================================================
alter table public.candidate_education enable row level security;
alter table public.candidate_experience enable row level security;
alter table public.candidate_projects enable row level security;

-- ============================================================
-- 6. RLS POLICIES — CANDIDATE EDUCATION
-- ============================================================

-- Anyone can view education for public profiles; owners always see their own
create policy "Education viewable for public profiles"
  on public.candidate_education for select
  using (
    candidate_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = candidate_education.candidate_id
        and visibility = 'public'
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('recruiter', 'admin')
    )
  );

-- Only the owner can insert their own education
create policy "Candidates insert own education"
  on public.candidate_education for insert
  with check (candidate_id = auth.uid());

-- Only the owner can update their own education
create policy "Candidates update own education"
  on public.candidate_education for update
  using (candidate_id = auth.uid());

-- Only the owner can delete their own education
create policy "Candidates delete own education"
  on public.candidate_education for delete
  using (candidate_id = auth.uid());

-- ============================================================
-- 7. RLS POLICIES — CANDIDATE EXPERIENCE
-- ============================================================

create policy "Experience viewable for public profiles"
  on public.candidate_experience for select
  using (
    candidate_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = candidate_experience.candidate_id
        and visibility = 'public'
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('recruiter', 'admin')
    )
  );

create policy "Candidates insert own experience"
  on public.candidate_experience for insert
  with check (candidate_id = auth.uid());

create policy "Candidates update own experience"
  on public.candidate_experience for update
  using (candidate_id = auth.uid());

create policy "Candidates delete own experience"
  on public.candidate_experience for delete
  using (candidate_id = auth.uid());

-- ============================================================
-- 8. RLS POLICIES — CANDIDATE PROJECTS
-- ============================================================

create policy "Projects viewable for public profiles"
  on public.candidate_projects for select
  using (
    candidate_id = auth.uid()
    or exists (
      select 1 from public.profiles
      where id = candidate_projects.candidate_id
        and visibility = 'public'
    )
    or exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('recruiter', 'admin')
    )
  );

create policy "Candidates insert own projects"
  on public.candidate_projects for insert
  with check (candidate_id = auth.uid());

create policy "Candidates update own projects"
  on public.candidate_projects for update
  using (candidate_id = auth.uid());

create policy "Candidates delete own projects"
  on public.candidate_projects for delete
  using (candidate_id = auth.uid());

-- ============================================================
-- 9. STORAGE BUCKETS (run manually in Supabase Dashboard 
--    or via supabase CLI if not already created)
-- ============================================================

-- Create storage buckets for avatars and resumes
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

-- Storage RLS: avatars — public read, authenticated upload own
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS: resumes — owner + recruiters/admins can read
create policy "Resume accessible by owner and recruiters"
  on storage.objects for select
  using (
    bucket_id = 'resumes'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.profiles
        where id = auth.uid() and role in ('recruiter', 'admin')
      )
    )
  );

create policy "Users can upload their own resume"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own resume"
  on storage.objects for update
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own resume"
  on storage.objects for delete
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- 10. INDEXES
-- ============================================================
create index if not exists idx_education_candidate on public.candidate_education(candidate_id);
create index if not exists idx_experience_candidate on public.candidate_experience(candidate_id);
create index if not exists idx_projects_candidate on public.candidate_projects(candidate_id);
