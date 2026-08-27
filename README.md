# Trailhead

A social network for people building themselves. Not a highlight reel — a trail.

Every other platform asks you to perform a finished version of yourself
(Instagram/TikTok), a polished professional (LinkedIn), or something judged
in three seconds (dating apps). Trailhead is a place to post the in-progress
version: what you're building, what you're learning, what you're struggling
with, and where you're actually trying to go.

## What's real right now

- **Real accounts** — sign up, sign in, and your dashboard follows you across
  devices. Backed by Supabase (Postgres + Auth), with row-level security so
  every user can only ever read or write their own data.
- **Profile** — an editable life dashboard (markers, streaks, a stated goal),
  not a bio.
- **Build Log** — dated entries with a fixed shape (Did / Learned / Struggled /
  Next). The app computes your posting streak from real entry dates; it isn't
  manually typed in.
- **Data export / import** — download your data as a JSON file any time, and
  restore it into any account. It appends rather than overwrites, so it's
  safe to run more than once.
- **`/demo`** — a static, clearly labeled example dashboard for anyone
  visiting cold, so the product doesn't look empty before you've signed up.

## What's intentionally not built yet

Circles, accountability-partner matching, and earned skill badges all need
real people on both sides to mean anything. Rather than fake that with
placeholder data, this build proves the individual habit loop (profile +
build log) first. See the roadmap section on the landing page for the exact
scope split.

## Stack

React + Vite, plain CSS (no framework), client-side routing via
`react-router-dom`, [Supabase](https://supabase.com) for auth and Postgres
storage.

## Setup

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
   (takes about two minutes to provision).
2. In the project's **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) and run it. This creates the
   `profiles` and `build_logs` tables with row-level security already
   locked down to "each user can only touch their own rows."
3. In **Project Settings → API**, copy the **Project URL** and the **anon
   public** key.
4. Optional, for frictionless demoing: under **Authentication → Sign In /
   Providers → Email**, you can turn off "Confirm email" so new accounts work
   immediately instead of requiring an email click-through. Leave it on for
   a real launch.
5. Once you have a deployed URL (e.g. on Vercel), set it as the **Site URL**
   under **Authentication → URL Configuration** so email confirmation links
   point at the right place instead of `localhost`.

### 2. Configure the app

Copy `.env.example` to `.env.local` and fill in the two values from step 1:

```bash
cp .env.example .env.local
```

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

The anon key is safe to expose client-side — it's designed for this, and
access is enforced by the database's row-level security policies, not by
keeping the key secret.

When deploying (e.g. to Vercel), set the same two variables in the project's
environment variable settings.

## Running locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

Without the two env vars set, the app still runs — every page that needs an
account shows a clear "accounts aren't connected yet" message instead of
crashing, which is what you'll see before step 2 above.

## Deploying

Static build, deployable anywhere that serves static files. `vercel.json`
includes a rewrite so client-side routes (`/demo`, `/signin`, `/app/profile`,
`/app/log`) resolve correctly on direct navigation or refresh, not just via
in-app links.
