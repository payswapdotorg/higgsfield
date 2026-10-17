# HF-ROADMAP — wave plan for the higgsfield product clone

Evidence base: `evidence/net-capture-2026-10-17.jsonl` (2,682 request/response
rows, response bodies for JSON APIs), `evidence/api-endpoint-inventory.json`
(73 unique fnf/clerk/serverFn endpoints), `evidence/dom-dumps.md`.

## Wave 1 — Foundation (app shell + auth + composer UI + projects)

Scope:
- Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui scaffold
- Studio shell layout: left sidebar (Home, My generations, My elements, My
  favorites, Community, Projects, New project), top bar (Explore, Pricing,
  account chip), the composer workspace
- The Cinema Studio composer surface: Image/Video/References tabs, prompt
  textarea, Film setup panel (Camera/Color palette/Lighting), settings chips
  (model, 1080p, 16:9, 5s, motion toggle, aspect), GENERATE button with cost
- Auth: NextAuth Google provider + guest mode; user model with username
  (onboarding quiz flow: use-case picker → username claim → terms)
- Projects (folders): CRUD + list + pinned + per-surface, REST routes
  mirroring `POST /fnf/folders` shape (see inventory)
- Credits: wallet model + plan constants + paywall modal component (UPGRADE
  REQUIRED state) — billing NOT wired (stub)

Exit gates: `pnpm build` green, typecheck green, seeded e2e of
create-project → composer renders → prompt persists, storybook-free visual
parity screenshots against the captured DOM dumps.

## Wave 2 — Generation pipeline + My generations + gallery

Scope:
- Generation job model: status machine (queued → processing → done/failed),
  credit cost per model/resolution/duration (the chips), atomic credit spend
- Job queue + worker (in-process first; pluggable adapter), polling client
  (the app polls job status — replicate the interval/backoff), result storage
  (public/ + abstraction for object storage), result cards (video/image)
- My generations view (per-project, per-folder recent_jobs_count)
- Free-gens quota + upgrade-required gating (evidence: fnf/user/free-gens/v2,
  GENERATE 80 cost, paywall modal)
- Community feed read-model: generations feed, trending publications,
  contests list (public data shapes from the capture)

Exit gates: full local loop e2e — create project → prompt → generate (mock
model adapter returns a fixture asset in N ms) → job completes → asset in My
generations + community feed; credit ledger exact; queue survives restart.

## Wave 3 — The wider product surface

Scope (each a route-level module with its own evidence file):
- Ads Studio (`/ads-studio`), Marketing Studio (`/marketing-studio`),
  AI Influencer (`/ai-influencer-studio`), Effects, Canvas, Edit, Originals,
  Assets, Academy (content pages), API/MCP platform pages (docs surface)
- Model catalog surface (Seedance 4K, Nano Banana Pro, Higgsfield Soul,
  WAN 3.0, Genjutsu, Kling — cards + model picker)
- Contests (list + detail from the capture)

Exit gates: per-module e2e + route inventory parity check against the nav map.

## Wave 4+ — production hardening

- Rate limiting, job retries, observability, deployment (Vercel-ready),
  README + ARCHITECTURE docs, the station's final acceptance battery.

## Dispatch law

One wave = one worker order (packet) = one branch = one delivery
(bundle + MANIFEST). The station re-verifies every claim before merge.
