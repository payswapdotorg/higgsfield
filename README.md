# HF Studio — clean-room Higgsfield product clone (Waves 1–3 complete, Wave 4 hardened)

A working clone of the **higgsfield.ai product** (the AI-native creative suite — studios,
generation pipeline, community, platform pages), reverse-engineered from live evidence and
built wave-by-wave: wave 1 (app shell + auth + composer + projects) · wave 2 (generation
pipeline + credits + community feed) · wave 3 (the wider product surface) · wave 4
(production hardening: SQLite contention fix, job retries, rate limiting, health probe,
verify battery). Next.js 16 App Router · TypeScript · Tailwind 4 · shadcn/ui · Prisma +
SQLite · TanStack Query · Zustand.

## What runs here

**Core (waves 1–2):**

| Surface | Route | Notes |
|---|---|---|
| Cinema Studio (create) | `/` | Model picker, prompt, aspect presets, resolution, batch, folder, `Generate {cost}` (§1a) |
| My generations | `/generate/all`, `/generate/folder/[folderId]`, `/generate/trash` | Folder cards with `recent_jobs_count`, status-chip result cards, soft-delete trash |
| Community | `/community` (`?tab=generations\|contests\|creators\|originals\|projects`) | Public feed read-model, trending, creators, contests |
| Pricing | `/pricing` | Plans from `PRICING_CONFIG` |

**Wider surface (wave 3):**

| Family | Routes | Evidence |
|---|---|---|
| Model catalog | `/explore` | Vendor-grouped image/video model cards + workflows (`inspect-api.json`) |
| Studios | `/ads-studio{,/all,/ad-multiplier,/brand-research/[brandId],/b/[brandId]}`, `/marketing-studio`, `/ai-influencer-studio` | Landing structures, tools grids, character builder (18 controls) |
| Creative tools | `/effects` + `/effects/[slug]` (45 named effects), `/canvas{,/[id],/templates/[templateId],/[id]/embed}`, `/edit{,/[projectId],/avatar/[category],/canvas/[imageId]}`, `/audio`, `/assets` | Per-surface `inspect-*.json` captures |
| Platform | `/api-docs` (Open Platform), `/mcp` + `/mcp/[slug]`, `/academy` | `inspect-api.json`, `inspect-mcp.json`, `inspect-academy.json` |
| Contests | `/contests/[slug]` + `/contests/[slug]/submissions` | `inspect-contests.json` + bodies digest |

Route parity (wave-3 exit gate): **40 implemented / 0 missing / 0 extra / 291 live routes
explicitly deferred in 16 documented groups** — see `docs/route-parity-report.md`; the
deferred groups are the prioritized wave-4+ backlog.

Demo sign-in: **Continue as demo creator** (seeded user with 1,000 wallet credits, 10 daily
credits, a `model:face_swap` pool and a 5-generation `nano_banana_2` touring grant — §1c
anchors). The clone's auth is a session-cookie stand-in for Clerk (disclosed clone-side
choice — see ARCHITECTURE.md).

## Generation pipeline (wave-2 core, hardened in wave 4)

- `POST /api/jobs/{model}` validates the §1a request body **verbatim** (strict zod schema —
  exact field names, unknown keys rejected). Aspect presets drive width/height server-side:
  `3:4 → 896×1200`, `16:9 → 1200×672`, `1:1 → 1024×1024` @1k (doubled @2k).
- Cost = `MODEL_CATALOG` creditCost × batch_size; credits are spent **atomically with job
  creation** in one Prisma interactive transaction. Every debit is a guarded
  compare-and-set, so concurrent submissions cannot double-spend.
- Burn order: **free-gens grant → `model:<jobSetType>` → `daily` → `wallet`** (§3.4); every
  debit writes a `CreditLedger` row.
- An in-process worker (pluggable `ModelAdapter`) dequeues `queued → processing →
  done/failed`, claiming jobs with a transaction-free CAS `updateMany`. SQLite hardening:
  WAL journal, 5 s busy_timeout, synchronous=NORMAL (`src/lib/db.ts`), tick-error
  exponential backoff (`src/server/worker.ts`) — the fix for the P1008 socket-timeout storms
  reproduced under concurrent access (see docs/wave-4-worker-worklog.md).
- **Job retries (H2)**: one automatic re-enqueue for retryable adapter failures
  (`maxAttempts = 2`, `attempt` exposed as an additive job key) — the server-side mirror of
  the client's one-transparent-retry. Non-retryable causes (billing/content class) stay
  terminal; insufficient credits never create a job at all (terminal 402 pre-queue).
- **Rate limiting (H3)**: fixed-window limiter, 30 authenticated job-creation POSTs per user
  per minute (`JOBS_RATE_LIMIT_PER_MIN`, 0 = disabled) → 429 with `Retry-After` + the §1a
  challenge body the existing client already handles. Clone-side hardening — the live product
  fronts this with DataDome (out of scope).
- **Health (H4)**: `GET /api/health` → `{ status, uptime_s, db, queue: { queued, processing },
  version }`, no auth; 503 when the db check fails.
- The mock adapter resolves after N ms (`MOCK_ADAPTER_MS`, default 1200, ±20% seeded jitter)
  with a deterministic fixture. Failure injection: `[fail]` (retryable, fails every attempt),
  `[fail-once]` (retryable on attempt 1 only), `[fail-terminal]` (non-retryable),
  `MOCK_FAILURE_PCT` (seeded roll). `MOCK_CHALLENGE_PCT` injects DataDome-modeled 429s.
- Client: TanStack Query polling (2 s interval, `1.15^n` backoff, stops on terminal states);
  `apiFetch` wrapper — 401 → refresh + one retry; 429/403 challenge → toast + one retry.
- Free-gens: `GET /api/user/free-gens/v2` returns the §1c touring shape (`remaining` is an
  additive key). All pools empty → 402 → the UPGRADE REQUIRED modal.

## API surface (evidence-shaped, snake_case)

`/api/auth/{login,logout,session,refresh}` · `/api/jobs/{model}` (POST create; GET/DELETE by
job id; `?purge=1` hard delete) · `/api/jobs/accessible` · `/api/jobs/{id}/restore` ·
`/api/jobs/{id}/publish` · `/api/folders` (+`/[id]`) · `/api/trash/library/count` ·
`/api/user{,/wallet,/features,/free-gens/v2}` · `/api/notices` ·
`/api/community/{generations/feed,trending,discovery/creators,discovery/header,contests}`
(+`/[slug]`) · `/api/health`. 401 body is exactly `{"detail":"Invalid or expired token"}` (§1d).

## Data model (Prisma + SQLite)

`User`, `Folder` (“Project” in product language), `Generation` (the job: model/version,
dimensions, `batchSize`, `status`, `attempt`, `seed`, `cost`, `creditSpend` JSON, notices
JSON, soft-delete), `CreditPool` (`wallet|daily|model:<slug>`), `CreditLedger`,
`FreeGensGrant`, `FeedPublication`, `Contest` (digest-shaped extension). Seed
(`bun run db:seed`) is idempotent: demo user + pools + grant, 8 creators, 15 generations,
12 publications, 3 contests.

## Quickstart

```bash
bun install
bun run db:push     # create/patch the SQLite schema (idempotent)
bun run db:seed     # idempotent demo data
bun run dev         # dev server on :3000
```

Verify battery (wave-4 H6): `bun scripts/verify.mjs` — lint · tsc · build · route-parity ·
clean-server test battery (api + e2e + hardening against a fresh dev server on :3111), prints
a PASS/FAIL table, exits 0/1, leaves the server running. Full output of the last run is
committed as `docs/verify-report.md`.

Individual pieces:

```bash
bun run lint        # eslint — 0 errors
bunx tsc --noEmit   # EXIT 0
bun test tests/api.test.ts tests/e2e.test.ts tests/hardening.test.ts   # needs a live server
```

## Honest-scope philosophy & citation conventions

Every structure claim cites the evidence it was derived from — code comments of the form
`// ev: inspect-<surface>.json §nodes` (node ids from the REA a11y-tree captures in
`evidence/rea-2026-10-17/surfaces/`), plus the wave-order §1 inline bodies for API shapes.
Nothing is invented silently: where the live product calls uncaptured endpoints, the clone
either links into a captured surface, renders a disclosed scoped stub (disabled + visible
demo-scope note), or marks a catalog entry inert. Where a field/key is clone-side (not in
evidence) it is labeled additive (e.g. free-gens `remaining`, the job `attempt` counter).
Known 404 captures (`inspect-projects/settings/video.json`) are never used as ground truth.
Per-wave worker worklogs in `docs/` carry a DISCLOSURES section listing every stub, mapping
and clone-side choice; the station re-verifies each claim before merge. Deferred surfaces
(291 routes) are documented, not faked — see `docs/route-parity-report.md`.

## Scope & provenance

Built strictly from the HF wave orders' evidence base (`evidence/rea-2026-10-17/`: 2,682-row
network capture, 73-endpoint inventory, 17 surface DOM/a11y captures, the 364-key
route-preload manifest). Wave docs: `docs/HF-PROGRAM/` (START-HERE, ROADMAP, WAVE3-PACKET),
per-wave worklogs in `docs/`, architecture in `ARCHITECTURE.md`, deployment in
`docs/DEPLOY.md`.
