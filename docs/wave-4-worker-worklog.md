# Wave-4 worker worklog — production hardening (H1–H6)

Branch `hf/wave-4-hardening` · delivered 2026-10-17 · worker 61 (H1 + the in-flight start of
H2) + **worker 62 (H2 completion, H3–H6, this record)**. Worker 61's session was cut mid-H2
by its deadline; worker 62 surveyed the uncommitted diff (schema comment + retryable flag on
`AdapterResult` + the first mock-adapter comment), kept the design, and completed the item.

## H1 — SQLite contention fix (worker 61, commit 7de7161) — verified by worker 62

**Before (station-log evidence, tasks 53/55/57/60):** under a long-lived dev server plus a
concurrent test run, the rollback-journal SQLite setup let readers block the single writer
and vice versa; the f-worker's 200 ms tick loop opened an interactive transaction even while
idle and hot-looped failures on lock contention — one wedged run logged **1,073 consecutive
P1008 "Socket timeout" tick errors**, and the battery degraded **20/20 → 0/22** (also seen:
16 pass / 5 fail / 3 err and 12 fail / 10 err first attempts at the station). Only a clean
dev-server restart recovered it.

**Change (worker 61):** `src/lib/db.ts` applies `journal_mode=WAL` (persistent in the DB file
— de-conflicts the server and the test runner's separate PrismaClient processes),
`busy_timeout=5000`, `synchronous=NORMAL` via `$queryRawUnsafe`, once per process
(globalThis-guarded), strictly non-fatal per statement (a `P2010` note documents why
`$executeRawUnsafe` is wrong for these pragmas). `src/server/worker.ts`: tick errors back off
`2^n` seconds capped at 60 s (reset on a clean tick); the claim became a transaction-free CAS
(`findFirst` read-gate + guarded `updateMany queued→processing` — the idle tick no longer
touches the write path at all).

**After (worker 62's verification, this session):**
- **H1 reproduction protocol PASSED** — clean server restart → traffic burst (30 concurrent
  `curl /community`) → **without restarting**, the full battery: **24 pass / 0 fail / 164
  expects** (19 api + 1 e2e + 4 hardening; the original 20-test battery is a subset — zero
  regressions). Server log after the burst+battery: **0 socket timeouts / P1008 / lock /
  "unable to start a transaction" signatures, 0 tick errors**.
- Battery stability across the session: **3 further consecutive 23/23→24/24 runs** after the
  one reproduced flake (below), plus verify.mjs's clean-server 24/24 (twice).

## H2 — job retries (worker 62 from worker 61's start, commit f2404cc)

- Design (from worker 61's schema comment): a RETRYABLE cause gets **one** automatic
  re-enqueue — `maxAttempts = 2`, `attempt` 1→2 — the server-side mirror of the client's
  §1d/§1a one-transparent-retry pattern. Non-retryable causes (billing/content class) stay
  terminal; insufficient credits never create a job at all (terminal 402 pre-queue, per the
  existing route design).
- `prisma/schema.prisma`: `attempt Int @default(1)` on Generation (worker 61's in-flight
  edit, design comment preserved). **db:push applied** — to the repo-local `db/hf.db` (adds
  the column; 15 seeded generations backfill to attempt=1 — data preserved) and found
  already applied on the sandbox's ambient-DB copy (see DISCLOSURE 1).
- `src/server/adapters/types.ts`: failure arm of `AdapterResult` carries
  `retryable: boolean`.
- `src/server/adapters/mock-adapter.ts`: deterministic attempt-aware failure tokens —
  `[fail]` (retryable on every attempt — the maxAttempts cap case), `[fail-once]` (retryable
  on attempt 1 only — the retry-then-succeed path), `[fail-terminal]` (non-retryable);
  `MOCK_FAILURE_PCT` stays a seeded retryable roll, identical across a job's attempts.
  `[fail]`/`MOCK_FAILURE_PCT` semantics stay coherent with the existing api.test.ts
  expectations (a `[fail]` job still ends terminal `failed`, now after consuming its one
  retry).
- `src/server/worker.ts`: retry wiring — retryable && attempt < 2 → CAS re-enqueue (status
  `queued`, attempt+1, cleared error/timestamps); attempt = 2 or non-retryable → terminal
  `failed`. **Ledger/spend are neither re-executed nor refunded** — the cost was already paid
  atomically at POST time; the retried attempt re-uses the paid slot (DISCLOSURE 2).
- `src/lib/job-shape.ts`: `attempt` exposed as an **additive** API key (not in the §1a
  evidence body — same additive-key precedent as free-gens `remaining`).
- **Worker state writes became CAS-guarded** (`casUpdate` — `updateMany` where
  `status=processing`): a job purged mid-flight (the battery's cleanup deletes users while an
  adapter delay is in flight) resolves count=0 — logged, no P2025 exception, no doomed
  follow-up write. Rationale: the one flake reproduced this session (battery run 1:
  **22/1** — the 402 test got a 500 from a 5.2 s-expired interactive transaction after the
  chain purge→P2025→doomed follow-up update→socket timeout) died exactly on this path; the
  station log documents the same amplifier pre-H1. After the change: 3 consecutive clean
  battery runs + all later runs green (see H1 "after").
- `tests/hardening.test.ts` (new): (a) `[fail-once]` → done with **attempt=2** and exactly
  one ledger row (no double charge — wallet 10→8, single −2 entry); (b) `[fail-terminal]` →
  terminal failed at **attempt=1**; (c) `[fail]` → terminal failed at **attempt=2**, stable
  after 500 ms (no third claim).

## H3 — rate limiting (clone-side, commit 28632c4)

- `src/server/rate-limit.ts` (new): in-memory **fixed 60 s window per user id** on
  authenticated `POST /api/jobs/{model}` — attempts count, not outcomes (the check sits
  after auth, before model lookup/validation). Config `JOBS_RATE_LIMIT_PER_MIN` (default 30,
  0 disables). globalThis-held state (HMR-safe); dead keys swept past 10 k tracked entries;
  `__resetJobsRateLimiterForTests()` exported (DISCLOSURE 4).
- Jobs route: over-limit → **429** with `Retry-After` (seconds to window close) and the
  **§1a `{"detail":"challenge"}` body** — the exact 429 shape the existing
  `src/lib/api-client.ts` challenge path handles (toast + one retry), so zero client
  changes. Labeled clone-side hardening: the live product fronts this class with DataDome
  (out of scope per HF-START-HERE).
- Test (hardening suite): hammer user A with 45 invalid-body POSTs → first 429 at request
  **31** (limit 30 — discovered empirically, not assumed), all subsequent 429s,
  `Retry-After ∈ [1,60]`, body exactly `{"detail":"challenge"}`; user B's valid job creation
  → **200** in the same window (per-user isolation); the created job is drained to a terminal
  state before cleanup. Manual probe recorded: 30×400 → 429s with `retry-after: 60`.

## H4 — health endpoint (commit 5124e2a)

- `src/app/api/health/route.ts` (new): `GET`, no auth, `force-dynamic` →
  `{ status: "ok", uptime_s, db: "ok"|"fail" (SELECT 1 via $queryRaw), queue:
  { queued, processing } (live prisma counts), version }` (version imported from
  package.json). HTTP **503** when the db check fails (DISCLOSURE 5) with `queue` counts
  nulled.
- f-worker lifecycle logs unified on the `[f-worker]` prefix — startup line added to
  `ensureWorker` (`tick=200ms, backoff<=60s, maxAttempts=2`); the one stale
  `[hf-worker] adapter crashed` prefix had already been flipped in the H2 commit (noted).
  Errors stay `console.error`, transitions `console.log`. Minimal changes only.
- Verified: `GET /api/health` → 200 with the full shape; queue counts observed live
  (`{"queued":1}` mid-job, `0/0` after drain); unauthenticated job POST still 401s.

## H5 — docs (commit b88dbb8)

- `README.md` rewritten to wave-3-complete: core + wave-3 surface route tables, route-parity
  numbers (**40 implemented / 291 deferred in 16 groups**, citing
  `docs/route-parity-report.md`), demo sign-in note, wave-4 hardening summary, quickstart
  (`bun install; db:push; db:seed; dev`), the verify script, honest-scope philosophy +
  citation conventions.
- `ARCHITECTURE.md` (new): stack, route map, generation-pipeline ASCII diagram (job create →
  credit spend → queue → worker → adapter → result, **with the H2 retry path**),
  credits/ledger burn order, evidence provenance system, station/worker governance summary,
  deferred backlog pointer.
- `docs/DEPLOY.md` (new): local SQLite as-is; Postgres/Neon provider swap steps (schema
  provider, DATABASE_URL, migrate notes; the `db.ts` pragma guard is SQLite-only and stays
  non-fatal so Postgres is unaffected); Vercel deploy with env var NAMES only (zero secrets);
  honest serverless caveat for the in-process worker.

## H6 — final acceptance battery (commit df6c1a7)

- `scripts/verify.mjs` (new, zero-dep, bun/node): (1) lint (2) tsc (3) `bun run build` —
  dev server stopped first (build/dev share `.next`); a standalone-copy failure is caught,
  its failure line reported, the run continues, the row grades FAIL (no fake passes — in this
  sandbox the build exits 0 including the standalone copy); (4) route-parity gate;
  (5) clean-server battery — pkill :3111 → relaunch → wait 200 on `/api/health` (≤90 s) →
  `bun test` api+e2e+hardening with `TEST_BASE_URL`; (6) **server left running**. Prints a
  PASS/FAIL table, exit 0/1. Writes nothing to the repo.
- Recorded run (docs/verify-report.md): **PASS 5/5, exit 0** — lint 0 · tsc 0 · build exit 0
  · parity 40/0/0 · battery **24 pass / 0 fail**. Post-run health probe + `[f-worker]
  started` line verified in the server log.

## Final verification (all green)

- lint **0** · tsc **0** · route-parity **exit 0 (40/0/0/291-deferred)** · verify.mjs
  **PASS 5/5 exit 0** · battery **24/24 pass, 164 expects** (19 api + 1 e2e — the original
  20-test battery, zero regressions — + 4 hardening) · H1 reproduction protocol: burst →
  battery-without-restart **24/24, 0 wedge signatures in the server log** · 17-route spot
  sweep all 200.

## DISCLOSURES

1. **Database environment finding (important for the station):** this sandbox's shells export
   an ambient `DATABASE_URL` (`file:/home/z/my-project/db/custom.db` — the sandbox console
   project's DB). Because process env outranks the repo `.env`, the historically-running :3111
   dev server and the station's test runs were hitting `custom.db`, NOT the repo-local
   `db/hf.db` the `.env` declares (verified: custom.db had journal_mode=wal + the attempt
   column — i.e. worker 61's H1 pragmas and db:push had landed there; hf.db had neither).
   Worker 62 re-ran `db:push` against the repo-local `db/hf.db` (attempt column added, 15
   seeded generations preserved) and pinned `DATABASE_URL=file:../db/hf.db` explicitly for
   every server launch / test run / verify.mjs child process. The station should either keep
   pinning it or unset the ambient variable; both DB files now carry the wave-4 schema. No
   data was written to `/home/z/my-project` by worker 62 beyond what the standing
   station-battery setup had already been doing (the earlier `db:push` under ambient env
   reported "already in sync" — read-only).
2. **Retry billing choice:** the retried attempt re-uses the credit slot paid at POST time —
   no refund on failure, no re-charge on retry (ledger row count stays 1, asserted in the
   test). A refund-and-recharge loop was rejected: it would let a permanently failing model
   mint free retry churn, and the live product's billing behavior on retries was not
   captured. This is a clone-side choice, disclosed in code comments and here.
3. **CAS terminal writes (rode the H2 commit):** all worker state writes are now guarded
   `updateMany` on the claim state instead of `update`+P2025-throw+doomed-follow-up. Behavior
   for legitimate flows is identical; for purged-mid-flight rows the old path logged an
   "adapter crashed" P2025 + attempted a second failing write (a documented wedge amplifier)
   where the new path logs one "vanished mid-flight" line. The one-line `[hf-worker]`→
   `[f-worker]` prefix flip also rode the H2 commit (H4's consistency item — noted in both
   commit messages).
4. **Rate-limiter test affordances:** state is unreachable from the test process (tests talk
   HTTP), so the module exports `__resetJobsRateLimiterForTests()` for future in-process use
   and the real cross-test isolation is per-user keying (unique users per test; deleted users
   never reuse ids). `JOBS_RATE_LIMIT_PER_MIN=0` disables the limiter wholesale. The hammer
   test discovers the limit empirically instead of hard-coding 30.
5. **Health endpoint semantics:** HTTP 503 + `status:"fail"` when the db check fails (with
   queue counts nulled) — a probe answering 200 over a dead db would be a fake pass; the
   order's JSON shape is honored on the healthy path.
6. **`[fail-once]` / `[fail-terminal]` mock tokens** are new test-facing affordances in the
   mock adapter (disclosed demo tooling, not product evidence); `[fail]` and
   `MOCK_FAILURE_PCT` semantics unchanged and coherent with the pre-existing battery.
7. **verify.mjs env pinning:** the battery server and tests run with explicit
   `DATABASE_URL=file:../db/hf.db` + `MOCK_ADAPTER_MS=50` (the e2e-prescribed recipe) — a
   deliberate, disclosed deviation from the packet's bare relaunch command, required by
   DISCLOSURE 1 and by the hardening suite's timing windows.
8. **Files touched outside the strict H-item names:** `src/server/rate-limit.ts` (new — the
   H3 limiter module), `tests/hardening.test.ts` (new — H2+H3 tests), `src/lib/job-shape.ts`
   (H2 additive key — the shape builder the order names for the check),
   `scripts/verify.mjs` / `docs/verify-report.md` / `README.md` / `ARCHITECTURE.md` /
   `docs/DEPLOY.md` / this worklog (H5/H6/records). No shared app-shell or page files were
   touched; wave-3 surfaces are untouched.
9. **No push, no merge** — branch `hf/wave-4-hardening` left for station verification
   (commits 7de7161 → f2404cc → 28632c4 → 5124e2a → b88dbb8 → df6c1a7 + the worklog commit).
