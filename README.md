# Trailhead

A social network for people building themselves. Not a highlight reel — a trail.

Every other platform asks you to perform a finished version of yourself
(Instagram/TikTok), a polished professional (LinkedIn), or something judged
in three seconds (dating apps). Trailhead is a place to post the in-progress
version: what you're building, what you're learning, what you're struggling
with, and where you're actually trying to go.

## What's real right now

- **Profile** — an editable life dashboard (markers, streaks, a stated goal),
  not a bio.
- **Build Log** — dated entries with a fixed shape (Did / Learned / Struggled /
  Next). The app computes your posting streak from real entry dates; it isn't
  manually typed in.
- **Data export / import** — your data is stored locally in your browser and
  exports to a single JSON file at any time. No account, no lock-in.
- **`/demo`** — a static, clearly labeled example dashboard for anyone
  visiting cold, so the product doesn't look empty on someone else's browser.

## What's intentionally not built yet

Circles, accountability-partner matching, and earned skill badges all need
real people on both sides to mean anything. Rather than fake that with
placeholder data, this build proves the individual habit loop (profile +
build log) first. See the roadmap section on the landing page for the exact
scope split.

## Stack

React + Vite, plain CSS (no framework), client-side routing via
`react-router-dom`, state persisted to `localStorage`. No backend — this is
a single-user, local-first build by design at this stage.

## Running locally

```bash
npm install
npm run dev       # dev server
npm run build     # production build to dist/
npm run preview   # preview the production build locally
```

## Deploying

Static build, deployable anywhere that serves static files. `vercel.json`
includes a rewrite so client-side routes (`/demo`, `/app/profile`, `/app/log`)
resolve correctly on direct navigation or refresh, not just via in-app links.
