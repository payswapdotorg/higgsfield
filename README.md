# HF Studio — Wave 1 Foundation

A clean-room clone of the higgsfield.ai **product** (the AI creative-suite app),
wave 1 of 4: app shell, auth + guest mode, the Cinema Studio composer, and
projects (folders) with a credits wallet model and paywall surface.

- **Work order:** HF-W1 · **Branch:** `hf/wave-1-foundation`
- **Stack:** Next.js 16 (App Router) · TypeScript strict · Tailwind CSS 4 ·
  shadcn/ui (New York) · Lucide · Prisma + SQLite · TanStack Query · Zustand ·
  next-auth v4 · sonner

## Setup

```bash
bun install
bun run db:push     # create/refresh the SQLite schema (idempotent)
bun run db:seed     # seed users, projects, contests, credit txns (idempotent)
bun run dev         # dev server on http://localhost:3000
```

Optional env (all have safe dev fallbacks — **no credentials are required**):

```bash
DATABASE_URL=file:./db/custom.db          # default already in .env
NEXTAUTH_SECRET=...                       # dev fallback: hf-studio-dev-secret
GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=...  # enables real Google OAuth (off by default)
```

## Quality gates (wave-1 receipts)

```bash
bun run lint               # ESLint — 0 errors
bunx tsc --noEmit          # strict typecheck — exit 0
bun run db:push            # run twice → idempotent
bun run db:seed            # run twice → idempotent
bun test tests/api.test.ts # 7/7 API contract tests against the running dev server
```

`bun run build` is intentionally **not** run in this delivery sandbox (the dev
server owns port 3000; the station re-verifies on its own hardware).

## What's in wave 1

- **Studio shell** — left sidebar (Home, My generations, My elements, My
  favorites, Community, Projects + New project, promo card), top bar (Explore,
  Pricing with 55% OFF badge, credits chip, account chip / Log in). Dark
  theme first; sidebar collapses to a drawer below `lg`.
- **Cinema Studio composer** (`/generate`) — Image/Video/References tabs
  (References `0/50` counter), prompt box with captured demo prompt, Film
  setup panel (Camera / Color palette / Lighting — Auto), settings chips
  (`Cinema Studio 4.0`, `1080p`, `16:9`, `5s`, `On`, `1/4`), GENERATE button
  with live credit cost (default config prices at exactly **80** credits),
  project picker popover ("My projects" / Create new project / Private
  badges). Composer state persists (zustand persist → prompt survives
  reload).
- **Paywall** — credits < cost opens the UPGRADE REQUIRED modal: personal
  promo code, 55% OFF, Monthly/Annual toggle, STARTER/PLUS plan cards,
  "Skip this offer". Billing is a stub by design (wired in a later wave).
- **Auth** — next-auth v4: Credentials "guest" provider (email-first modal
  with demo Google/Apple/Microsoft buttons) + real Google provider only when
  env vars exist. **Guest mode:** anonymous requests resolve to the seeded
  guest user, so the whole app is browsable logged-out.
- **Onboarding quiz** (`/quiz`) — 6 steps (verbatim use-case options from the
  capture), deterministic username suggestion (hash-derived, e.g.
  `hollowlemur1259`), terms checkbox, claim → pricing special-offer screen →
  "Skip this offer" → `/generate`.
- **Projects (folders)** — REST routes mirroring the captured
  `POST /fnf/folders` body shape (`{name, access_mode, surface,
  workspace_id}`) + accessible/pinned listings, PATCH pin/rename, DELETE.
- **API** — snake_case envelopes matching the live-capture inventory:
  `/api/user`, `/api/user/meta`, `/api/user/personal-promo`,
  `/api/user/free-gens/v2`, `/api/user/username` (+ `-suggest`),
  `/api/user/onboarding`, `/api/contests?size=`, `/api/generations`,
  `/api/folders/*`.
- **Data model** — User, Project, Generation (wave-1 model + queued rows; the
  render pipeline itself is wave 2), Contest, CreditTxn (wallet ledger).
- **Community** (`/community`) — contests grid from the seeded capture data.

## Evidence provenance

Shapes, labels, and copy mirror the live-app capture of 2026-10-17 (84-endpoint
API inventory + authenticated DOM dumps): endpoint field names
(`access_mode`, `recent_jobs_count`, `start_at`, `free_gens_remaining`, …),
composer chrome ("BRING YOUR STORIES TO LIFE", chip labels, `0/50` references
counter, GENERATE with embedded cost), the folders POST body, the contests
response shape (incl. the `higgsfield-global-film-festival` record), and the
onboarding quiz options. Credit pricing constants reproduce the captured
"GENERATE 80" default. No third-party credentials, tokens, or network calls
are included anywhere in this tree.

## Wave roadmap

1. **Wave 1 (this)** — shell, auth, composer, projects, credits/paywall.
2. Wave 2 — generation pipeline (job queue, atomic credit spend, My
   generations gallery, community feed).
3. Wave 3 — wider product surface (Ads/Marketing Studios, model catalog,
   contests detail).
4. Wave 4 — hardening (rate limits, retries, observability, deployment).
