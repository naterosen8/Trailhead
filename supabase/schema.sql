-- Trailhead database schema.
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query -> Run).
-- Safe to re-run: every statement is idempotent.

create extension if not exists "pgcrypto";

-- One row per user: the life-dashboard profile.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default 'Your name',
  location text not null default '',
  streak_num integer not null default 0,
  streak_label text not null default 'day streak',
  goal text not null default '',
  markers jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles are read/write by owner only" on public.profiles;
create policy "profiles are read/write by owner only"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Many rows per user: build log entries.
create table if not exists public.build_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week integer not null,
  date date not null,
  title text not null,
  did text not null default '',
  learned text not null default '',
  struggled text not null default '',
  next text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists build_logs_user_id_idx on public.build_logs (user_id, date desc);

alter table public.build_logs enable row level security;

drop policy if exists "build logs are read/write by owner only" on public.build_logs;
create policy "build logs are read/write by owner only"
  on public.build_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Public, anonymous-readable aggregate counts for the landing page. This is
-- the one intentional exception to "every row is private": it runs with the
-- privileges of its owner (security definer) so it can count across all
-- rows, but it returns two numbers only — never any row data, never anyone's
-- name, email, or entries. Safe to expose to unauthenticated visitors.
create or replace function public.trailhead_stats()
returns table (total_people bigint, total_entries bigint)
language sql
security definer
set search_path = public
as $$
  select
    (select count(*) from public.profiles) as total_people,
    (select count(*) from public.build_logs) as total_entries;
$$;

grant execute on function public.trailhead_stats() to anon, authenticated;
