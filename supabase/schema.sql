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
  is_public boolean not null default false,
  looking_for_partner boolean not null default false
);

-- Existing databases from before Circles: add the two new columns.
alter table public.profiles add column if not exists circle text;
alter table public.profiles add column if not exists is_public boolean not null default false;
-- Existing databases from before Partners: one more.
alter table public.profiles add column if not exists looking_for_partner boolean not null default false;

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
-- Changing the return shape below (adding author_id / author_looking_for_partner)
-- means the old function must be dropped first — Postgres won't let
-- create-or-replace change a function's output columns in place.
drop function if exists public.circle_feed(text, integer);
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
  author_id uuid,
  author_name text,
  author_looking_for_partner boolean,
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
    p.id,
    coalesce(nullif(p.name, ''), 'Someone on the trail'),
    p.looking_for_partner,
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

-- Accountability Partners: opt-in direct messaging between two people in the
-- same circle who have both turned on "looking for a partner." Mutual opt-in
-- both ways, not just "anyone public can message anyone" — a public profile
-- means "visible in the feed," it does not by itself mean "open to DMs."
--
-- Helper for the insert policy below, same reasoning as entry_is_public():
-- checking someone ELSE's profile fields under the sender's own RLS would
-- always fail (they can only see their own profile row), so this has to run
-- as security definer.
create or replace function public.can_message(p_recipient uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles me
    join public.profiles them on them.id = p_recipient
    where me.id = auth.uid()
      and me.id <> them.id
      and me.is_public = true and them.is_public = true
      and me.looking_for_partner = true and them.looking_for_partner = true
      and me.circle is not null
      and me.circle = them.circle
  );
$$;

grant execute on function public.can_message(uuid) to authenticated;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_no_self_message check (sender_id <> recipient_id),
  constraint messages_body_not_blank check (length(trim(body)) > 0)
);

create index if not exists messages_thread_idx on public.messages (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at);

alter table public.messages enable row level security;

-- Only the two people in the conversation can ever see a message — not
-- circle-mates, not anyone else, no exceptions.
drop policy if exists "messages are visible to sender or recipient" on public.messages;
create policy "messages are visible to sender or recipient"
  on public.messages
  for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- You can only send as yourself, and only to someone who has mutually opted
-- into partnering with your circle. No update/delete policies at all: once
-- sent, a message is permanent, like a real conversation.
drop policy if exists "send a message to a mutual accountability partner" on public.messages;
create policy "send a message to a mutual accountability partner"
  on public.messages
  for insert
  with check (
    auth.uid() = sender_id
    and public.can_message(recipient_id)
  );

-- Everyone in a circle who's opted into partnering, so people can find each
-- other before messaging. Security definer so it can read across profiles,
-- but hands back only a name and goal — never an email or anything private.
create or replace function public.circle_partners(p_circle text)
returns table (user_id uuid, name text, goal text)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, coalesce(nullif(p.name, ''), 'Someone on the trail'), p.goal
  from public.profiles p
  where p.is_public = true
    and p.looking_for_partner = true
    and p.circle = p_circle
    and p.id <> auth.uid()
  order by p.updated_at desc;
$$;

grant execute on function public.circle_partners(text) to authenticated;

-- One row per conversation the caller is in, with the latest message, so the
-- inbox can be built without pulling every message up front. Security
-- definer only to join in the partner's display name — the underlying
-- message rows it reads are already ones the caller is allowed to see.
create or replace function public.list_conversations()
returns table (
  partner_id uuid,
  partner_name text,
  last_body text,
  last_created_at timestamptz,
  last_sender_id uuid
)
language sql
security definer
set search_path = public
stable
as $$
  with my_messages as (
    select
      case when sender_id = auth.uid() then recipient_id else sender_id end as partner_id,
      body,
      created_at,
      sender_id
    from public.messages
    where auth.uid() = sender_id or auth.uid() = recipient_id
  ),
  ranked as (
    select
      my_messages.*,
      row_number() over (partition by partner_id order by created_at desc) as rn
    from my_messages
  )
  select
    r.partner_id,
    coalesce(nullif(p.name, ''), 'Someone on the trail'),
    r.body,
    r.created_at,
    r.sender_id
  from ranked r
  join public.profiles p on p.id = r.partner_id
  where r.rn = 1
  order by r.created_at desc;
$$;

grant execute on function public.list_conversations() to authenticated;
