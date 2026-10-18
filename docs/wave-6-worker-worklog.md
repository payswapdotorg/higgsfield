# Wave-6 worker worklog — Postgres/Neon port + Vercel deploy-readiness (HF-W6)

Branch `hf/wave-6-postgres` · delivered 2026-10-18 · **wave-6 worker** (8 commits,
`f88352a` → `bb07dc3`) + **station acceptance commit** (`ea105a8`) + **this records
worker** (Task 74 — DEPLOYMENT.md runbook, this worklog, the README state section). The
first wave-6 worker's session was cut by its context deadline **mid-verification**: the
code was complete and committed (all 8 commits) and `prisma db push` had already been
applied to Neon, but the records phase was eaten — the **5th deadline-eaten-records
occurrence in program history** (waves 3A/3B/3C/5 before it). Station doctrine held: the
state check found the code complete, the station finished acceptance itself, and this
worker reconstructs the delivery record; every claim below was re-verified against the
committed code and commit messages in this session.

Scope per the Task-73 dispatch (wave-6 order): **postgres/Neon port + Vercel
deploy-readiness — infrastructure-only, zero route/behavior change.** No route was added,
removed or reshaped: route parity is **unchanged at 62 / 0 / 0** (269 deferred in 14
groups) and the battery is **28/28** (23 api + 4 hardening + 1 e2e). Unlike waves 1–5
this wave built no product surface — it moved the persistence substrate
(SQLite → Postgres/Neon) and made the build deployable on Vercel.

## C1 — schema provider swap (commit f88352a)

- `prisma/schema.prisma`: datasource `provider = "sqlite"` → **`postgresql"`** (Neon).
  Infrastructure-only: every existing column type (String/Int/Boolean/DateTime) is
  PG-compatible as-is — no model shape changed.
- **JSON-in-String columns deliberately kept as `String`** — `badges`, `inputImages`,
  `creditSpend`, `winner`, `someContestants`, `judges`, `unlimitedSettings`, `notices`.
  They are JSON serialized into TEXT columns by application code, a convention that
  predates the port (SQLite has no list columns); NOT converting them to Prisma
  `Json`/`jsonb` minimizes the diff and preserves behavior byte-for-byte (schema
  doc-comment documents the convention — see DISCLOSURE 4).
- Station later applied the provider swap to the live Neon DB: `prisma db push` ran clean
  ("already in sync" — the dead worker had applied it before its deadline).

## C2 — SQLite pragma gating (commit 8afc70e)

- `src/lib/db.ts`: the wave-4 H1 pragma block (`journal_mode=WAL` / `busy_timeout=5000` /
  `synchronous=NORMAL`) now runs **only when `DATABASE_URL` starts with `file:`**. On the
  Postgres datasource those pragmas are invalid SQL that previously failed into the
  non-fatal warn path **3× per cold start** — semantically wrong plus log noise on every
  serverless invocation. PG boots with zero pragma warns now.
- The WAL/busy_timeout rationale does not transfer anyway — Postgres has MVCC and its own
  lock manager (disclosed in the db.ts doc comment).

## C3 — package.json deploy scripts (commit d3ee82b)

- `postinstall: "prisma generate"` — REQUIRED on Vercel: bun install may skip
  dependency-level postinstalls, but the ROOT package's postinstall always runs, so the
  Prisma client (`provider = "postgresql"` since C1) is generated before the build.
- `build: "next build"` — a plain build; this is the Vercel build command. The
  standalone-copy step moved out of `build`.
- `build:standalone: "next build && cp -r .next/static .next/standalone/.next/ && cp -r
  public .next/standalone/"` — the LOCAL dfork prod-server recipe (Task 70), invoked as
  `HF_STANDALONE=1 bun run build:standalone` so the C4 gate engages.

## C4 — next.config: standalone gate + serverless tracing (commit c3bf799)

- `output: "standalone"` now applies **only when `HF_STANDALONE=1`** — the local
  self-hosting recipe (Task 70 dfork server). Vercel builds get the default output (the
  platform handles packaging).
- `outputFileTracingIncludes: { "/**": ["./node_modules/.prisma/**/*"] }` — carries the
  Prisma client + native query engine into the serverless bundles. They load through
  dynamic requires Next's tracer cannot see; without this rule the Vercel function bundle
  omits them and every DB call fails at cold start.
- `HF_DIST_DIR` (optional) relocates the build directory — the escape hatch for building
  beside a LIVE standalone server that serves lazily-loaded route chunks from
  `.next/standalone` (a plain `next build` clears `.next`).

## C5 — verify.mjs: Neon-capable + honest port check (commit 77bac55)

- `DATABASE_URL` **passthrough**: an externally-set value is used verbatim, falling back
  to `file:../db/hf.db` only when unset — the station can run the whole battery against
  Neon. Disclosed consequence: the sandbox's ambient `DATABASE_URL` (another project's
  SQLite — the wave-4 hijack) is **no longer masked**; a bare invocation fails loudly on
  provider mismatch. Always invoke with an explicit `DATABASE_URL`.
- `VERIFY_PORT` (default 3111): the battery dev-server port is relocatable.
- New `portOccupied()` pre-check: when the battery port already answers `/api/health`
  (e.g. the station's standalone prod server on :3111), the battery **FAILS honestly**
  instead of silently grading against the squatter's responses — a spawned dev server
  could not own the port and `waitForServer` would have false-greened on the squatter.
- Build row updated: `bun run build` is a plain `next build` on wave-6 (the
  standalone-copy failure branch no longer exists; that step moved to
  `build:standalone`).

## C6 — sandbox-only Neon reachability shim (commit 6ef0282)

- `scripts/neon-sandbox-run.sh` (executable, committed in-tree): this sandbox resolves
  Neon hostnames **IPv6-only through Prisma's Rust DNS resolver** (hickory, compiled into
  `libquery_engine`) and has **no IPv6 egress** — every engine connection died
  `P1001 "Can't reach database server"` while plain IPv4 TCP+TLS worked and glibc
  clients (node pg) connected fine. The engine's resolver consults `/etc/hosts` before
  DNS, and `unshare -rm` permits a hosts bind-mount without real root. The script
  resolves the Neon hostnames (DATABASE_URL host + its `-pooler` twin) to IPv4 and runs
  the wrapped command inside the namespace; children (dev servers, test runners, dfork'd
  daemons) inherit it, so a whole verify.mjs battery runs against Neon.
- Full rationale lives in the script header. **Sandbox-only tooling, same doctrine as
  `scripts/dfork_launch.py` (Task 70) — Vercel/production needs none of it** (see
  DISCLOSURE 7).

## C7 — next.config comment fix (commit 1a7b956)

- The C4 doc comment contained the literal `outputFileTracingIncludes` glob text
  (`.prisma/**/*`); the trailing `*/` inside it **closed the block comment early**,
  leaving the rest of the comment as code and breaking `next.config.ts` parsing
  (`next dev` failed to load the config). Reworded to describe the glob in prose; the
  config value itself unchanged.

## C8 — gitignore scratch build dirs (commit bb07dc3)

- `/.next-*/` added to `.gitignore`: the `HF_DIST_DIR` escape-hatch output (scratch build
  dirs like the dead worker's `.next-w6`) must never land in git.

## Station acceptance commit (ea105a8 — station, acceptance-infra only)

Two fixes surfaced by the first Neon verify run, both **acceptance infrastructure — no
product code touched** (root-cause analysis in the commit message):

- **eslint was linting the dead worker's `.next-w6` scratch dir** — 2,271 files → 7,459
  phantom problems. `.gitignore` already had `.next-*` (C8) but `eslint.config.mjs` only
  ignored `.next/**`; the ignore became **`.next*/**`**.
- **bun test's 5 s default per-test timeout flakes against remote Postgres** (~200 ms
  RTT per statement → a jobs POST renders ~2 s). Timed-out tests leave zombie poll loops
  that race the next file's user cleanup → **FK 500 cascade** (6 captured in the first
  parallel run). verify.mjs now runs the three test files **sequentially** (one
  `bun test` invocation each) with `--timeout 30000` — no assertion weakened, `waitFor`
  deadlines inside the tests unchanged. Count parsing now **aggregates across the
  per-file summaries** and the `Ran N tests? across M files?` regex tolerates bun's
  singular **"1 test across 1 file"** line (previously uncounted — see DISCLOSURE 6).
- Commit footer: *verify.mjs against Neon: PASS 5/5 (lint 0 · tsc 0 · build · parity
  62/0/0 · battery 28/28)*.

## Station verification record (Task-73 station session)

- **Neon project created via the org API key**: project **higgsfield**, id
  **`lingering-forest-48017163`**, region **aws-us-east-1**, **Postgres 17**, compute
  endpoint `ep-holy-forest-b7gz9l6h` (+ its `-pooler` twin) — region co-located with
  Vercel's default `iad1` functions.
- **Password-rotation incident**: Neon's `GET /v2/projects/{id}/connection_uri` API
  rotates the role password on EVERY call — the first stored password died to a re-fetch
  (the deployment's DB access would have broken silently). The current password is
  vaulted; the fetch-once/vault/never-re-fetch rule is now doctrine (DEPLOYMENT.md §4).
- **`db push` clean**: "already in sync" — the dead worker had applied the schema before
  its deadline.
- **`db:seed` clean** (idempotent): **10 users / 1 settings row / 15 generations /
  3 pools / 1 grant / 12 feed publications / 3 contests** (demo creator with 1,000 wallet
  + 10 daily credits).
- **verify.mjs against Neon: PASS 5/5** — lint 0 · tsc 0 · build · route-parity
  **62 / 0 / 0** (unchanged from wave 5) · battery **28 pass / 0 fail** (23 api +
  4 hardening + 1 e2e), run through the sandbox shim (C6) with an explicit
  `DATABASE_URL`.
- The dead worker's **uncommitted build artifacts were reverted** (`next-env.d.ts` /
  `tsconfig.json` regenerated by the stray build; working tree clean at records time
  apart from the intentionally untracked server logs `dev-3111.log` / `prod-3111.log`).

## Records phase (this worker, Task 74)

- Wrote **`docs/DEPLOYMENT.md`** — the Vercel + Neon runbook: architecture (Neon
  `lingering-forest-48017163`, aws-us-east-1 / iad1 pairing), the env-var table with the
  pooled-vs-direct `DATABASE_URL` split (`sslmode=require` kept, `channel_binding=require`
  dropped for Prisma engine compatibility), build/deploy mechanics (bun install → root
  `postinstall prisma generate` → plain `next build`; standalone gated OFF; the
  `outputFileTracingIncludes` rule), the one-time seed procedure + the password-rotation
  warning, the serverless job-pipeline semantics (per-invocation `ensureWorker()`,
  per-poll queue advance, `unref()`), the sandbox-only notes, and the local
  self-hosting recipe replacing the Task-70 one (`HF_STANDALONE=1 bun run
  build:standalone` + dfork launch).
- Wrote this worklog; appended the README **Wave 6 — Postgres/Neon port** state section.
- No source, schema, seed, script or test file was touched by this worker — documentation
  only.

## DISCLOSURES

1. **Neon password-rotation behavior** (applies everywhere, not just the sandbox):
   `GET /v2/projects/{id}/connection_uri` rotates the role password on every call — the
   last fetch wins and prior passwords die instantly. It bit once during wave 6 (the
   first stored password died to a re-fetch); the current password is vaulted. Fetch
   once, vault, never re-fetch while a deployment uses it (DEPLOYMENT.md §4).
2. **The dead worker's uncommitted build artifacts were reverted by the station** —
   `next-env.d.ts` / `tsconfig.json` had been touched by a build after the last commit;
   they were restored/regenerated, so every wave-6 code change is fully described by the
   9 commits (`f88352a` → `ea105a8`). Nothing of the worker's code work was lost.
3. **No product code touched by the station** — the station commit `ea105a8` changed only
   acceptance infrastructure (`eslint.config.mjs` ignore glob + `scripts/verify.mjs`
   battery mechanics). TL product-code commits remain zero for the whole program.
4. **JSON-in-String columns kept as `String`** (badges, inputImages, creditSpend, winner,
   someContestants, judges, unlimitedSettings, notices) — deliberately NOT converted to
   Prisma `Json`/`jsonb` on the port: the convention predates wave 6 (SQLite has no list
   columns), the app code already JSON-(de)serializes at the boundary, and keeping TEXT
   preserves behavior byte-for-byte while minimizing the diff. A native-`Json` migration
   remains a possible future schema change, deliberately not done here.
5. **`HF_AUTH_SECRET` constant fallback documented** — `src/lib/jwt.ts:7` falls back to
   the constant `"hf-studio-local-dev-secret"`, so sessions work with the variable unset
   (this carried over from wave 1, unchanged by wave 6). DEPLOYMENT.md now instructs
   production deployments to set a strong random value. Disclosed, not changed.
6. **The display-quirk fix** — `verify.mjs`'s battery count parsing previously matched a
   single `"N pass\nM fail"` summary; with sequential per-file runs the counts now
   aggregate, and the `Ran N tests? across M files?` regex tolerates bun's singular
   **"1 test across 1 file"** line, which the old `\d+ tests across \d+ files` pattern
   silently dropped (the run itself was unaffected — only the displayed count
   undercounted).
7. **The sandbox shim is sandbox-only** — `scripts/neon-sandbox-run.sh` (IPv6/hosts
   bind-mount inside `unshare -rm`) exists purely because THIS sandbox has no IPv6
   egress while the Prisma engine's hickory resolver lands on AAAA. Vercel/production
   needs none of it; the script header and DEPLOYMENT.md §6 both say so.
8. **The ambient `DATABASE_URL` hijack is no longer masked** — since `77bac55`,
   `verify.mjs` passes an externally-set `DATABASE_URL` through, so the sandbox's ambient
   SQLite value (another project's DB) reaches the tools and fails loudly on provider
   mismatch. Every command in this environment must set `DATABASE_URL` explicitly —
   honest-fail over silent-wrong-DB.
9. **Battery sequencing against remote PG** — sequential test files + `--timeout 30000`
   is an acceptance-infra accommodation for ~200 ms RTT/statement and the zombie-poller
   vs user-cleanup race (FK 500s) that SQLite's single-writer lock had serialized away.
   No assertion was weakened; the `waitFor` deadlines inside the tests are unchanged.
10. **No push, no merge** — branch `hf/wave-6-postgres` left at the docs commit for
    station verification + certified merge (commits `f88352a` → `8afc70e` → `d3ee82b` →
    `c3bf799` → `77bac55` → `6ef0282` → `1a7b956` → `bb07dc3` → station `ea105a8` +
    this records/docs commit). This records worker wrote documentation only.
11. **`docs/DEPLOY.md` (wave-4 H5) is partially superseded** — its "Production path"
    section describes the pre-port SQLite→Postgres swap steps and its Vercel section
    predates the `postinstall`/tracing/standalone-gate mechanics. It is left untouched
    (documentation-only mandate); `docs/DEPLOYMENT.md` states that it supersedes the
    deploy-path portions and wins where they disagree.
