# ARCHITECTURE — HF Studio (higgsfield product clone)

Stack: **Next.js 16 App Router** (Turbopack dev) · **TypeScript 5** (strict) · **Tailwind CSS 4**
+ **shadcn/ui** (New York) + lucide icons · **Prisma 6 + SQLite** (WAL) · **TanStack Query**
(server state) · **Zustand** (client state) · session-cookie auth stand-in for Clerk
(disclosed clone-side choice: the live product's Clerk OAuth rollout was not reproducible
offline; `src/lib/auth.ts` + `src/lib/jwt.ts` implement the cookie session the §1d
stale-token/refresh behaviors were tested against).

## Route map (32 pages + API route handlers)

| Group | Routes |
|---|---|
| Core studio | `/` (Cinema Studio composer), `/generate/{all,folder/[folderId],trash}` |
| Community | `/community?tab=generations\|contests\|creators\|originals\|projects` |
| Catalog | `/explore` (model registry: vendor → models, generate-able deep links) |
| Studios | `/ads-studio{,/all,/ad-multiplier,/brand-research/[brandId],/b/[brandId]}`, `/marketing-studio`, `/ai-influencer-studio` |
| Tools | `/effects{,/[slug]}` (45 effects), `/canvas{,/[id],/templates/[templateId],/[id]/embed}`, `/edit{,/[projectId],/avatar/[category],/canvas/[imageId]}`, `/audio`, `/assets` |
| Platform | `/api-docs`, `/mcp{,/[slug]}`, `/academy` |
| Contests | `/contests/[slug]{,/submissions}` |
| Billing stub | `/pricing` |

API route handlers (`src/app/api/**`, snake_case evidence shapes): auth (`login, logout,
session, refresh`), jobs (`[model]` POST create / GET / DELETE by job id; `accessible`;
`[id]/restore`; `[id]/publish`), folders, trash count, user (`/wallet`, `/features`,
`/free-gens/v2`), notices, community (feed, trending, discovery/creators, discovery/header,
contests + `[slug]`), health.

The live product's route tree (364 keys, `evidence/rea-2026-10-17/route-preload-manifest.json`)
maps onto this scope through the wave 1–3 curation: **40 routes implemented, 291 deferred in
16 documented groups** — `scripts/route-parity.mjs` is the gate, `docs/route-parity-report.md`
the record.

## Generation pipeline (with the wave-4 retry path)

```
 client (studio composer, §1a body verbatim)
   │  POST /api/jobs/{model}?folder_id=…          [H3 limiter: 30 POSTs/user/min → 429
   │                                               + Retry-After + §1a challenge body]
   ▼
 requireUser (session cookie) ── strict zod validation (§1a, exact field names)
   │
   ▼
 ONE interactive Prisma transaction:
   1. create Generation row (status=queued, seed=fnv1a(jobId:model:prompt), cost)
   2. spendCredits: burn-order plan → guarded CAS debits + CreditLedger rows
      (insufficient → InsufficientCreditsError → terminal 402 — job never created)
   ▼
 queue (status=queued) ── in-process f-worker (src/server/worker.ts)
   │   tick every 200 ms · CAS claim (updateMany where status=queued → processing,
   │   no interactive transaction) · tick errors back off 2^n s (cap 60 s)
   ▼
 ModelAdapter.run(job)  (src/server/adapters/* — pluggable; mock by default)
   │  MOCK_ADAPTER_MS ±20% seeded jitter · fixture chosen by mulberry32(seed)
   │
   ├─ ok ──────────────► CAS write status=done, assetUrl, completedAt
   │
   ├─ retryable failure, attempt < 2 ──► CAS write status=queued, attempt=2   ◄─ H2 retry path
   │                                     (ledger/spend untouched — the cost was already
   │                                      paid at POST time; disclosed clone-side choice)
   │                                      └──► next tick re-claims → attempt 2 runs
   │
   └─ non-retryable failure, or attempt = 2 ──► CAS write status=failed, error, completedAt
                                              (terminal; maxAttempts = 2 caps the loop)
   All worker state writes are CAS-guarded on the claim state (status=processing):
   a row purged mid-flight resolves count=0 — logged, no exception, no doomed follow-up write.
   ▼
 client polls GET /api/jobs/{id} (TanStack Query, 2 s · 1.15^n backoff · stops on terminal)
   → done: asset card (/fixtures/gen-NN.png) → My generations → optional publish → community feed
```

SQLite hardening (H1): `PRAGMA journal_mode=WAL` (persistent, de-conflicts the dev server and
the test runner's separate PrismaClient processes), `busy_timeout=5000`, `synchronous=NORMAL`
(`src/lib/db.ts`, once per process, non-fatal per statement). Station-log evidence: the
pre-fix shape hot-looped P1008 socket-timeout ticks under concurrent access (1,073 consecutive
errors in one wedge; battery degraded 20/20 → 0/22).

## Credits / ledger burn order

`computeSpendPlan` (`src/server/credits.ts`) plans the debit for a job's `cost`
(`MODEL_CATALOG[slug].creditCost × batch_size`) in a fixed order:

1. **free-gens grant** for the matching `jobSetType` ( touring grant, §1c) —
   `FreeGensGrant.used` increments under a CAS guard (`used ≤ amount - take`);
2. **`model:<jobSetType>` pool**;
3. **`daily` pool**;
4. **`wallet`**.

Every debit writes a `CreditLedger` row (pool, jobId, delta, balanceAfter, reason:
`free_generations` | `generation`). All debits are guarded compare-and-sets executed inside
the same interactive transaction that creates the job row — concurrent submissions cannot
double-spend (covered by the concurrent ×2 test: one 200 + one 402, wallet exactly 0).

## Evidence provenance system

- **Sources** (`evidence/rea-2026-10-17/`): the REA survey of the live authenticated product —
  `net-capture-2026-10-17.jsonl` (2,682 rows), `api-endpoint-inventory.json` (73 endpoints),
  `api-bodies-digest.json` (verbatim bodies), `surfaces/inspect-*.json` (17 surface DOM/a11y
  captures, `normalized_result.accessibility.nodes` = node_id/role/name trees),
  `route-preload-manifest.json` (the 364-key live route tree), bundle analyses.
- **Citation conventions**: UI structures cite `// ev: inspect-<surface>.json §nodes` (with
  node ids); API shapes cite the wave order §1 bodies (§1a job POST, §1b jobs list, §1c
  wallet/free-gens, §1d auth retry, §1e notices/contests, §1f route-family mapping, §1g
  community inventory). Wave-2/3 built from the inline §1 bodies; wave 3 added per-surface
  spec extraction.
- **Additive-key discipline**: clone-side fields absent from evidence are labeled additive in
  code comments and worklogs (free-gens `remaining`; job `attempt`).
- **Known-bad specs** (captured 404s) are excluded by name: `inspect-projects.json`,
  `inspect-settings.json`, `inspect-video.json`.
- **Honest-scope rule**: uncaptured flows render disclosed scoped stubs (disabled + visible
  note) — never fake calls; unwired catalog models render inert with a marker.

## Station / worker governance (program summary)

Workers implement; the TL station verifies and merges (the station writes no product code).
One wave = one packet = one branch = one station-verified merge. Every worker delivery runs
the verification battery (lint 0 · tsc 0 · routes 200 with evidence headings in SSR HTML ·
api/e2e/hardening tests green); the station re-runs everything clean-room before merge and
pushes. Delivery records live in `docs/wave-*-worker-worklog.md` (each with a DISCLOSURES
section); the program-level log is the shared TL worklog. Anti-fabrication laws: FILE-TOOL
LAW (all repo file writes via file tools — bash heredocs forbidden), evidence-first, file
boundaries, determinism (no `Math.random` — `src/lib/seeded-rng.ts` instead), no new packages
without order, incremental commits, no push/self-merge by workers.

## Wave-4 hardening summary

| Item | What | Where |
|---|---|---|
| H1 SQLite contention | WAL/busy_timeout/synchronous pragmas · tick backoff · transaction-free CAS claim | `src/lib/db.ts`, `src/server/worker.ts` (worker 61, commit 7de7161) |
| H2 job retries | one automatic re-enqueue for retryable causes (maxAttempts 2) · CAS terminal writes | `src/server/worker.ts`, adapters, `attempt` column + additive job key |
| H3 rate limiting | per-user fixed window (30/min default) on job POSTs → 429 + Retry-After + §1a challenge body | `src/server/rate-limit.ts`, jobs route |
| H4 health | `GET /api/health` (status/uptime/db/queue/version) · `[f-worker]` log prefix | `src/app/api/health/route.ts`, worker |
| H6 verify battery | zero-dep PASS/FAIL runner: lint · tsc · build · parity · clean-server tests | `scripts/verify.mjs`, `docs/verify-report.md` |

## Deferred backlog

291 live routes in 16 priority-ordered groups (settings/billing family, profile pages,
originals/projects content, posts/publications detail, contests submission flow, mobile app
tree, supercomputer, enterprise, …) — the full list with per-group reasons is
`docs/route-parity-report.md`; the wave-4+ program consumes it group by group.
