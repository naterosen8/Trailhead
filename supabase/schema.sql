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
  updated_at timestamptz not null default now(),
  circle text,
  is_public boolean not null default false
);

-- Existing databases from before Circles: add the two new columns.
alter table public.profiles add column if not exists circle text;
alter table public.profiles add column if not exists is_public boolean not null default false;

alter table public.profiles drop constraint if exists profiles_circle_check;
alter table public.profiles add constraint profiles_circle_check
  check (circle is null or circle in ('college', 'entrepreneurs', 'fitness', 'creators', 'investors', 'outdoors', 'trades'));

alter table public.profiles enable row level security;

drop policy if exists "profiles are read/write by owner only" on public.profiles;
create policy "profiles are read/write by owner only"
  on public.profiles
  for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No separate "public profiles are readable" policy: circle visibility is
-- handled entirely through the circle_feed()/circle_member_counts() functions
-- below, which are security definer and return only the curated fields a
-- circle needs (a display name, entry content) — never a raw row, never an
-- email. Fewer places where cross-user access is possible is safer than
-- more, so direct table access to other people's rows stays fully closed.

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

-- Circles: a lightweight reaction on someone else's entry. One per
-- (entry, person) — inserting the same pair twice is rejected outright by
-- the unique constraint, not just discouraged by the UI.
create table if not exists public.cheers (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.build_logs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (entry_id, user_id)
);

create index if not exists cheers_entry_id_idx on public.cheers (entry_id);

alter table public.cheers enable row level security;

-- You can see a cheer if you left it, or if it's on your own entry (so you
-- can tell who cheered your work) — never anyone else's reactions to
-- someone else's entry via this table directly. circle_feed() below is
-- where aggregate counts for a whole feed come from instead.
drop policy if exists "cheers are visible to their author or the entry owner" on public.cheers;
create policy "cheers are visible to their author or the entry owner"
  on public.cheers
  for select
  using (
    auth.uid() = user_id
    or auth.uid() = (select user_id from public.build_logs where id = entry_id)
  );

-- Helper for the policy below. A plain subquery here would run under the
-- cheering user's own RLS on build_logs/profiles, which only lets them see
-- their OWN rows — so checking "is this other person's entry public" would
-- always come back empty and reject every legitimate cheer. Security
-- definer bypasses that for this one narrow, read-only check.
create or replace function public.entry_is_public(p_entry_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.build_logs bl
    join public.profiles p on p.id = bl.user_id
    where bl.id = p_entry_id and p.is_public = true
  );
$$;

grant execute on function public.entry_is_public(uuid) to authenticated;

-- You can only cheer your own reaction (never insert one attributed to
-- someone else), and only on an entry that actually belongs to a public
-- profile — cheering isn't a backdoor into seeing or touching private data.
drop policy if exists "cheer your own reaction on a public entry" on public.cheers;
create policy "cheer your own reaction on a public entry"
  on public.cheers
  for insert
  with check (
    auth.uid() = user_id
    and public.entry_is_public(entry_id)
  );

drop policy if exists "remove your own cheer" on public.cheers;
create policy "remove your own cheer"
  on public.cheers
  for delete
  using (auth.uid() = user_id);

-- The circle feed itself: every public entry in one circle, newest first,
-- with a cheer count and whether the calling user has already cheered it.
-- Security definer so it can read across everyone's rows to build this,
-- but it hands back only entry content someone explicitly made public plus
-- their display name — never an id, email, or anything from a private
-- profile. Restricted to signed-in users, not anon: opting a profile into
-- a circle means "visible to other people building here," not "visible to
-- the entire internet."
create or replace function public.circle_feed(p_circle text, p_limit integer default 60)
returns table (
  entry_id uuid,
  title text,
  did text,
  learned text,
  struggled text,
  next text,
  entry_date date,
  created_at timestamptz,
  author_name text,
  cheer_count bigint,
  cheered_by_me boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select
    bl.id,
    bl.title,
    bl.did,
    bl.learned,
    bl.struggled,
    bl.next,
    bl.date,
    bl.created_at,
    coalesce(nullif(p.name, ''), 'Someone on the trail'),
    (select count(*) from public.cheers c where c.entry_id = bl.id),
    exists (select 1 from public.cheers c where c.entry_id = bl.id and c.user_id = auth.uid())
  from public.build_logs bl
  join public.profiles p on p.id = bl.user_id
  where p.is_public = true and p.circle = p_circle
  order by bl.created_at desc
  limit greatest(1, least(coalesce(p_limit, 60), 200));
$$;

grant execute on function public.circle_feed(text, integer) to authenticated;

-- How many public members are in each circle — real counts, no names, safe
-- to show while someone's still picking a circle to join.
create or replace function public.circle_member_counts()
returns table (circle text, member_count bigint)
language sql
security definer
set search_path = public
stable
as $$
  select circle, count(*) as member_count
  from public.profiles
  where is_public = true and circle is not null
  group by circle;
$$;

grant execute on function public.circle_member_counts() to authenticated;
