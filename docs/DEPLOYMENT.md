# DEPLOYMENT — HF Studio on Vercel + Neon (HF-W6 runbook)

The operative deployment runbook since the wave-6 Postgres/Neon port. It supersedes the
deploy-path portions of `docs/DEPLOY.md` (wave-4 H5), which predate the provider swap —
where the two disagree, **this file wins**. Zero secrets live in this document or in the
repo: every value below marked `<password>` / `<…>` is fetched once from the Neon console
and vaulted (see the rotation warning).

## 1. Architecture

| Tier | Choice |
|---|---|
| App | Next.js 16 App Router (repo `github.com/payswapdotorg/higgsfield`), deployed on **Vercel** |
| Database | **Postgres on Neon** — project **higgsfield**, id **`lingering-forest-48017163`**, region **`aws-us-east-1`**, **Postgres 17** |
| Region pairing | Neon `aws-us-east-1` is co-located with Vercel's default functions region **`iad1`** (us-east-1) — keep both in us-east-1 or you pay cross-region RTT on every statement |
| Compute endpoint | `ep-holy-forest-b7gz9l6h` (direct host) / `ep-holy-forest-b7gz9l6h-pooler.c-13.us-east-1.aws.neon.tech` (pooled host) |
| Package manager | **bun** (`bun.lock` is committed → Vercel detects it and runs `bun install`) |

The app is a single Next.js project — no mini-services, no WebSocket servers. The only
in-process background component is the generation worker (§5), which is request-driven by
design and needs no external daemon on Vercel.

## 2. Environment variables

Exact names, as read by the code:

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **YES** | — | Postgres connection string. **Pooled** (`…-pooler.…`) host at runtime; **direct** host only for schema/seed commands from a shell (see below). |
| `HF_AUTH_SECRET` | no | `"hf-studio-local-dev-secret"` (constant at `src/lib/jwt.ts:7`) | Session-token **HMAC secret** (HS256 sign/verify of the session JWT). Sessions work unset, but **set a strong random value in production** (e.g. `openssl rand -hex 32`). Rotating it invalidates every outstanding session cookie (7-day TTL). |
| `MOCK_ADAPTER_MS` | no | `1200` | Mock model-adapter base latency in ms (±20% seeded jitter). The **deployment recipe uses `50`** for snappy demo UX (also the e2e-prescribed value). |
| `MOCK_FAILURE_PCT` | no | `0` | Seeded probabilistic *retryable* adapter-failure roll (%) — deterministic per job seed. Keep `0` in production. |
| `MOCK_CHALLENGE_PCT` | no | `0` | Seeded DataDome-modeled 429 challenge rate (%) on job POSTs — exercises the client's challenge/retry path. Keep `0` in production. |
| `JOBS_RATE_LIMIT_PER_MIN` | no | `30` (`0` disables) | Per-user fixed-window (60 s) limiter on `POST /api/jobs/{model}` → 429 + `Retry-After` + the §1a challenge body. In-memory per server process — on serverless the effective limit scales with concurrent warm instances (clone-side hardening, disclosed). |

### Influencer generation engines (wave 7 / wave 7.1 — Task 85)

The AI Influencer studio routes through an env-gated provider layer
(`src/server/influencer/`); unset ⇒ `mock` (the test battery default).

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `HF_IMAGE_PROVIDER` | no | `mock` | Influencer image engine: `mock` \| `openrouter` \| `cloudflare` \| `zai`. **Production value: `cloudflare`** — the credit-free Workers AI engine (Task 85) that replaced the 402-blocked OpenRouter route. A non-mock pick without its keys falls back to `mock` with an `[f-influencer]` warn. |
| `HF_VIDEO_PROVIDER` | no | `mock` | Influencer motion engine: `mock` \| `dashscope` (wan2.2-i2v — works everywhere incl. Vercel) \| `zai` (sandbox-only). **Production value: `dashscope`.** |
| `OPENROUTER_API_KEY` | no (since Task 85) | — | OpenRouter API key — the PREVIOUS image engine. **Optional now**: OpenRouter image models answer HTTP 402 without a ≥ $1.00 balance the account cannot hold. Keep only if you switch `HF_IMAGE_PROVIDER=openrouter` after adding credits. |
| `DASHSCOPE_API_KEY` | for `HF_VIDEO_PROVIDER=dashscope` | — | Alibaba DashScope **intl** key (the China endpoint rejects this key class). |
| `CLOUDFLARE_API_TOKEN` | for `HF_IMAGE_PROVIDER=cloudflare` | — | Cloudflare API token, used with the account id below. |
| `CLOUDFLARE_ACCOUNT_ID` | for `HF_IMAGE_PROVIDER=cloudflare` | — | Cloudflare account id (the REST run path is `/accounts/{id}/ai/run/{model}`). |
| `HF_CF_IMAGE_MODEL` | no | `@cf/black-forest-labs/flux-2-klein-9b` | Primary Cloudflare image model — the multipart route that consumes the identity-reference `image` form part (multi-reference editing). |
| `HF_CF_IMAGE_FALLBACK_MODEL` | no | `@cf/bytedance/stable-diffusion-xl-lightning` | One-shot prompt-only fallback when the primary attempt fails (`none` disables). |

**Free-neuron budget** (Workers AI free allocation on the user's account:
10,000 neurons/day — station-measured 2026-10-18):

| Model | Neurons/image | Images/day within the free allocation |
|---|---|---|
| `@cf/black-forest-labs/flux-2-klein-9b` (primary) | ~909 | **≈ 10/day** |
| `@cf/black-forest-labs/flux-1-schnell` | 172.8 | ≈ 57/day |
| `@cf/bytedance/stable-diffusion-xl-lightning` | 0 (beta, price 0) | unlimited / free |

**SDXL auto-fallback behavior:** when the primary model attempt fails with any
provider-classified error (the typical case: the daily klein neuron quota is
exhausted after ~10 images), the provider automatically retries ONCE with the
free `stable-diffusion-xl-lightning` fallback (prompt-only, portrait 1024×1024 /
full-body 768×1152) so the studio degrades instead of hard-failing; the asset's
`meta.fallbackUsed` records it. Set `HF_CF_IMAGE_FALLBACK_MODEL=none` to disable.
Measured engine facts (latencies, response shapes, the dead DashScope t2i
probes): `docs/ai-influencer/IMAGE_ROUTE_BENCHMARK.md`.

(`MOCK_FAILURE_PCT` / `MOCK_CHALLENGE_PCT` and the `[fail]` / `[fail-once]` /
`[fail-terminal]` prompt tokens exist to demonstrate the wave-4 retry patterns
deterministically; they are test/demo levers, not product behavior.)

### `DATABASE_URL` — pooled vs direct

- **Runtime (Vercel project env var)** — use Neon's **pooled** connection string (the
  `-pooler` host), which is what serverless functions should always use:

  ```
  postgresql://neondb_owner:<password>@ep-holy-forest-b7gz9l6h-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require
  ```

- **Schema/seed commands only** (`prisma db push`, `bun run db:seed` from a shell on any
  machine) — use the **direct** (non-pooler) URL, host `ep-holy-forest-b7gz9l6h.c-13.us-east-1.aws.neon.tech`,
  same path/credentials. DDL and the seed's upserts should not go through the PgBouncer pool.

- **TLS**: keep `sslmode=require`. If a fetched URI carries `channel_binding=require`,
  **drop that parameter** — the Prisma query engine's Rust TLS stack does not support
  channel binding and fails the handshake with it present.

- **Prisma provider is `postgresql`** (`prisma/schema.prisma`) — every environment, local
  dev included, needs a Postgres `DATABASE_URL`. A `file:` URL no longer boots the app.

## 3. Build & deploy mechanics on Vercel

1. Import `github.com/payswapdotorg/higgsfield` in Vercel; framework preset **Next.js**,
   root directory = repo root. No custom build settings are required — the repo carries
   everything:
   - **Install**: Vercel detects `bun.lock` → `bun install`.
   - **`postinstall` → `prisma generate`** (root `package.json`): the Prisma client for
     `provider = "postgresql"` is generated before the build. This is REQUIRED on Vercel:
     bun may skip dependency-level postinstall hooks, but the root package's own
     postinstall always runs.
   - **Build command**: `bun run build` — which is a **plain `next build`** since wave 6.
2. `output: "standalone"` is **gated OFF** on Vercel: `next.config.ts` only enables it when
   `HF_STANDALONE=1`, which is the *local self-hosting* recipe (§7). Leave `HF_STANDALONE`
   unset in the Vercel project — the platform handles packaging.
3. `outputFileTracingIncludes` (`"/**"` → `./node_modules/.prisma/**/*`) carries the
   generated Prisma client **and its native query engine** into the serverless function
   bundles. They load through dynamic `require`s that Next's file tracer cannot see;
   without this rule the bundle omits them and **every DB call fails at cold start**.
4. Set the §2 env vars on the Vercel project (Production + Preview), then deploy.
5. Post-deploy smoke check: `GET /api/health` → `200 {"status":"ok","db":true,…}`
   (returns `503` when the DB check fails). Point uptime monitoring at it.

## 4. One-time database setup (schema + seed)

From any machine with the repo and bun (Neon DB must exist first — it does:
`lingering-forest-48017163`):

```bash
git clone https://github.com/payswapdotorg/higgsfield && cd higgsfield
bun install                                              # also runs prisma generate
DATABASE_URL='<direct-url>' bun run db:push              # apply the schema (idempotent)
DATABASE_URL='<direct-url>' bun run db:seed              # idempotent upsert seed
```

- `db:push` applies `prisma/schema.prisma` to the database (no migration history is kept
  in this repo — `prisma db push` is the schema mechanism).
- `db:seed` is an **idempotent upsert seed**: every row is written by a stable key, so
  re-running never duplicates and resets fixtures to canonical values. Contents:
  **10 users** (demo creator + 8 community creators + the captured-operator fixture),
  **15 generations**, **12 feed publications**, **3 contests**, and the demo creator with
  **1,000 wallet credits + 10 daily credits** (plus a `model:face_swap` pool and a
  5-generation `nano_banana_2` touring grant). Station-verified full count:
  10 users / 1 settings row / 15 gens / 3 pools / 1 grant / 12 pubs / 3 contests.

### ⚠ Password-rotation warning — read before touching the Neon API

**Neon's `GET /v2/projects/{id}/connection_uri` API rotates the role password on every
call.** The last fetch wins and every previously fetched password dies *instantly*. So:

- Fetch the connection URI **once**, vault the password, and **never re-fetch it while
  any deployment uses it** (a re-fetch silently kills the Vercel deployment's DB access —
  this exact incident happened once during wave 6: the first stored password died to a
  re-fetch; the current one is vaulted).
- If you must rotate, do it deliberately: rotate → immediately update the Vercel env var
  and the vault in the same change → redeploy.

## 5. Serverless job-pipeline semantics

The generation worker is **in-process** (`src/server/worker.ts`, the "f-worker"): it
dequeues `queued → processing → done/failed` jobs via CAS-guarded `updateMany` claims,
with one automatic retry for retryable adapter failures (`maxAttempts = 2`).

- `ensureWorker()` is called inside **`GET /api/jobs/accessible`** and
  **`POST /api/jobs/[model]`** — the worker (re)starts per invocation, guarded on
  `globalThis` so a warm instance keeps exactly one tick loop.
- Vercel freezes the function between requests; on thaw the pending 200 ms tick timer
  fires essentially immediately, and it keeps ticking for the life of the invocation —
  **queued jobs advance on every client poll** even though the platform freezes the
  lambda in between.
- The tick loop calls `timer.unref()` — it **never holds an invocation open** (the
  request response is the only thing keeping the function alive).
- The client polls `GET /api/jobs/accessible` every 2 s (backoff `1.15^n`, capped 10 s).
  With `MOCK_ADAPTER_MS=50` (±20% jitter → 40–60 ms) a job completes **within 1–2 client
  polls**, so the UX is near-instant on the demo deployment.
- Honest scope (unchanged from wave 4): jobs only advance while a function is warm and
  being polled. The worker sits behind the pluggable `ModelAdapter` seam precisely so a
  durable external queue can replace it later without touching the job/credits contract.

## 6. Sandbox-only notes (NOT needed on Vercel/production)

These apply **only to the development sandbox this program runs in**. Production needs
none of it.

1. **IPv6-only Prisma engine resolution.** This station resolves Neon hostnames
   IPv6-only through Prisma's Rust DNS resolver (hickory, compiled into
   `libquery_engine`), and the sandbox has **no IPv6 egress** — every engine connection
   dies `P1001 "Can't reach database server"` while plain IPv4 TCP+TLS works.
   `scripts/neon-sandbox-run.sh` resolves the Neon hosts (the `DATABASE_URL` host + its
   `-pooler` twin) to IPv4 and bind-mounts an `/etc/hosts` shim inside `unshare -rm`, so
   prisma/verify commands (and their children: dev servers, test runners, dfork'd
   daemons) can reach Neon. **Vercel and any normal network need none of this.**
2. **Ambient `DATABASE_URL` hijack.** The sandbox shells export an ambient
   `DATABASE_URL` pointing at another project's SQLite file. Always set `DATABASE_URL`
   explicitly on every command; since wave 6, `scripts/verify.mjs` passes an externally
   set value through (it no longer masks the ambient one), so a bare invocation fails
   loudly on provider mismatch instead of silently targeting the wrong DB.
3. **The Neon password-rotation behavior** (§4 warning) — discovered here, applies
   everywhere: `GET /v2/projects/{id}/connection_uri` rotates the role password on every
   call; fetch once, vault, never re-fetch while a deployment uses it.
4. **Test timeouts against remote Postgres.** `bun test`'s default **5 s per-test
   timeout** flakes against remote PG (~200 ms RTT per statement — a jobs POST renders in
   ~2 s). Timed-out tests leave zombie poll loops that race the next file's user cleanup
   → FK 500 cascades (SQLite's single-writer lock had serialized this race away).
   `scripts/verify.mjs` therefore runs the three test files **sequentially** with
   `--timeout 30000` and aggregates the per-file counts. No assertion was weakened.

## 7. Local self-hosting recipe (standalone server)

Replaces the Task-70-era recipe (which used the unconditional standalone output). Since
wave 6 the standalone output is gated on `HF_STANDALONE=1`:

```bash
HF_STANDALONE=1 bun run build:standalone
# = next build (with output:"standalone") + copy .next/static + public into .next/standalone/

python3 scripts/dfork_launch.py prod-3111.log "$PWD" \
    DATABASE_URL='<postgres-url>' PORT=3111 NODE_ENV=production -- \
    node .next/standalone/server.js
```

- `scripts/dfork_launch.py` (Task 70) is the double-fork daemon launcher used in this
  program's agent-shell environment, where the shell reaps spawned process trees at call
  end — the grandchild ends at PPID=1 and survives. On a normal server, `nohup`/systemd
  is fine.
- **`HF_DIST_DIR` escape hatch**: when building *beside a live standalone server* (which
  serves lazily-loaded route chunks from `.next/standalone`), set
  `HF_DIST_DIR=.next-<scratch>` so the new build cannot wipe `.next` out from under the
  running server. Scratch dirs match the gitignored `.next-*` pattern (commit `bb07dc3`)
  and are also eslint-ignored (`.next*/**`).
- Postgres is required here too (the datasource provider is `postgresql`).
