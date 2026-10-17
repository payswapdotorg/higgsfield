# DEPLOY — HF Studio (higgsfield clone)

## Local (default): SQLite, as-is

The repo ships SQLite-first: `prisma/schema.prisma` declares `provider = "sqlite"` and the
committed `.env` points at the repo-local file.

```bash
bun install
bun run db:push     # create/patch schema (idempotent)
bun run db:seed     # idempotent demo data
bun run dev         # dev server on :3000
```

Production build (standalone output is configured in `next.config.ts`):

```bash
bun run build       # next build + copy static/public into .next/standalone
DATABASE_URL="file:./db/hf.db" MOCK_ADAPTER_MS=50 PORT=3000 HOSTNAME=0.0.0.0 \
  node .next/standalone/server.js
```

> Sandbox note: the standalone-copy step (`cp -r … .next/standalone/…`) can fail in
> restricted sandboxes even when `next build` itself compiled cleanly;
> `scripts/verify.mjs` catches that failure line, reports it, and continues (the wave-2
> honest-build-config note). Do not fake a pass — the report records what actually happened.

Environment variables (names only — set values in your secret store, never in the repo):

| Variable | Purpose | Default |
|---|---|---|
| `DATABASE_URL` | SQLite file path (`file:…`) or Postgres URL after the provider swap | `file:../db/hf.db` (.env) |
| `HF_AUTH_SECRET` | Session-cookie signing secret (`src/lib/jwt.ts`) | dev fallback in code |
| `MOCK_ADAPTER_MS` | Mock model adapter base latency (ms) | 1200 |
| `MOCK_FAILURE_PCT` | Seeded probabilistic adapter failure rate (%) | 0 |
| `MOCK_CHALLENGE_PCT` | Seeded DataDome-modeled 429 challenge rate (%) | 0 |
| `JOBS_RATE_LIMIT_PER_MIN` | Per-user job-creation POSTs per minute (0 disables) | 30 |

## Production path: Postgres / Neon

SQLite is a dev/demo convenience; the production target is Postgres (e.g. Neon). Swap steps:

1. **Schema provider** — in `prisma/schema.prisma` change the datasource block:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   Then `bunx prisma generate`. Note the schema already avoids SQLite-only shapes where
   practical (JSON-in-string columns are used for lists/objects — portable as `TEXT`/`JSONB`
   with the same JSON conventions; review per-column if you want native `Json` types, that is
   a schema edit + `db push`/migrate on your side).
2. **DATABASE_URL** — set a Postgres connection string (Neon: `postgresql://…?sslmode=require`).
3. **Migrations** — the repo uses `prisma db push` (no migration history). For a managed
   production DB either run `bunx prisma migrate dev` to baseline from the schema (creates the
   first migration), or `prisma db push` against a fresh database; then `bun run db:seed`
   (the seed is idempotent and Postgres-compatible).
4. **SQLite pragma guard is a no-op on Postgres** — `src/lib/db.ts` runs its WAL /
   busy_timeout / synchronous pragmas through `$queryRawUnsafe` with a per-statement
   non-fatal catch. On Postgres those statements are invalid SQL and fail into the warn
   path, leaving the client exactly as before; the app is unaffected. It stays non-fatal by
   design so the provider swap needs no code change. If you want silence instead of warns,
   guard the pragma loop on the provider — an optional cleanup, not required.
5. **WAL/busy_timeout rationale does not transfer** — those pragmas are SQLite lock-contention
   medicine (wave-4 H1); Postgres has MVCC and its own lock manager, so nothing is lost.

## Vercel deploy

The app is a standard Next.js 16 App Router project (no mini-services, no WebSocket servers,
no long-lived in-process daemons required for serving — the generation worker is in-process
and starts on first job POST).

1. Import the repo in Vercel; framework preset **Next.js** (build command `bun run build` —
   note the standalone-copy step is for self-hosting only; on Vercel the default
   `next build` output is what runs, so if the copy step complains in CI you may set the
   build command to `next build` alone).
2. Environment variables (Project → Settings → Environment Variables): `DATABASE_URL`
   (Postgres/Neon URL — SQLite-on-serverless is not supported), `HF_AUTH_SECRET`, and
   optionally the `MOCK_*` / `JOBS_RATE_LIMIT_PER_MIN` knobs from the table above.
   ZERO secrets belong in the repo or in this file.
3. Run `prisma generate` (happens automatically via `postinstall` if you add one; otherwise
   add a build step `bunx prisma generate` before `next build`) and apply the schema to your
   database (`prisma db push` or `migrate deploy`) from CI or locally.
4. `GET /api/health` is the uptime probe (`status: ok`, `db`, `queue` counts, `version`) —
   point your monitor at it.

### Known serverless caveat (honest scope)

The in-process job worker (queue drain + retries) runs inside the Next.js server runtime. On
serverless platforms functions are short-lived: queued jobs are only drained while a function
is warm. The architecture keeps the worker behind the pluggable `ModelAdapter` /
`src/server/worker.ts` seam precisely so a durable queue (external worker, cron-driven
`/api` drain route, or a queue service) can replace it without touching the job/credits
contract — that swap is a future work item, not silently claimed as done.
