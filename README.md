# HF Studio — clean-room Higgsfield product clone (Wave 2)

Wave 2 of the clean-room product clone: the **generation pipeline**, **My generations**, and the
**community feed**, built on a Next.js 16 / TypeScript / Tailwind 4 / shadcn/ui / Prisma + SQLite
stack with TanStack Query and Zustand.

## What runs here

| Surface | Route | Notes |
|---|---|---|
| Studio (create) | `/` | Model picker, prompt, aspect presets, resolution, batch, folder, `Generate {cost}` button (§1a) |
| My generations | `/generate/all`, `/generate/folder/[folderId]`, `/generate/trash` | Folder cards with `recent_jobs_count`, status-chip result cards, soft-delete trash with count |
| Community | `/community` (`?tab=generations\|contests\|creators\|originals\|projects`) | Public feed read-model, trending, creators, contests |
| Pricing stub | `/pricing` | Plans from `PRICING_CONFIG` (wave-3 scope marker) |

Demo sign-in: **Continue as demo creator** (seeded user with 1,000 wallet credits, 10 daily credits,
a 2-credit `model:face_swap` pool and a 5-generation `nano_banana_2` touring grant — §1c anchors).

## Generation pipeline (wave-2 core)

- `POST /api/jobs/{model}` validates the §1a request body **verbatim** (strict zod schema — exact
  field names, unknown keys rejected). Aspect presets drive width/height server-side:
  `3:4 → 896×1200`, `16:9 → 1200×672`, `1:1 → 1024×1024` @1k (doubled @2k).
- Cost comes from the `MODEL_CATALOG` constant (`nano-banana-2` = 2, `cinema-studio-4` = 80 — both
  §1a evidence anchors; `wan-2-2-animate-faceswap` = 30, a disclosed clone-side choice).
- Credits are spent **atomically with job creation** in one Prisma interactive transaction. Every
  debit is a guarded compare-and-set (`updateMany` + balance condition), so concurrent submissions
  cannot double-spend (covered by the concurrent ×2 test).
- Burn order: **free-gens grant for the matching jobSetType → `model:<jobSetType>` → `daily` →
  `wallet`** (§3.4 pins free-gens before wallet). Every debit writes a `CreditLedger` row.
- An in-process worker (pluggable `ModelAdapter`) dequeues `queued → processing → done/failed`.
  The mock adapter resolves after N ms (`MOCK_ADAPTER_MS`, default 1200, ±20% seeded jitter) with a
  fixture asset chosen deterministically from the job seed (mulberry32 — no `Math.random` anywhere).
  Failure injection: prompt containing `[fail]` forces failure; `MOCK_FAILURE_PCT` sets a seeded
  rate. `MOCK_CHALLENGE_PCT` injects DataDome-modeled 429 challenges (§1a).
- Client polling: TanStack Query, 2 s interval, `1.15^n` backoff capped at 10 s, stops on terminal
  states (§3.2).
- `apiFetch` wrapper (§1d): one transparent retry after `POST /api/auth/refresh` on 401; on 429/403
  challenge → toast **“Something went wrong, please try again”** + one automatic retry (§1a).
- Notices: `GET /api/notices?lang=en` returns the §1e body; jobs on `wan2_2_animate_faceswap`
  carry the “Temporary Issues” warning badge (model chip + result cards).
- Free-gens: `GET /api/user/free-gens/v2` returns the §1c touring shape (amount 5,
  `nano_banana_2`, claimed flag; `remaining` is an additive key). All pools empty → 402 → the
  **UPGRADE REQUIRED** modal.

## API surface (evidence-shaped, snake_case)

`/api/auth/{login,logout,session,refresh}` · `/api/jobs/{model}` (POST create; GET/DELETE by job id;
`?purge=1` hard delete) · `/api/jobs/accessible` (`{"jobs":[…],"has_more":bool}`) ·
`/api/jobs/{id}/restore` · `/api/jobs/{id}/publish` · `/api/folders` (+`/[id]`) ·
`/api/trash/library/count` · `/api/user` · `/api/user/wallet` · `/api/user/free-gens/v2` ·
`/api/user/features` · `/api/notices` · `/api/community/generations/feed` · `/api/community/trending`
· `/api/community/discovery/creators` · `/api/community/discovery/header` · `/api/community/contests`.

401 body is exactly `{"detail":"Invalid or expired token"}` (§1d).

## Data model (Prisma + SQLite)

`User`, `Folder` (“Project” in product language), `Generation` (the job: `modelVersion`,
`jobSetType`, width/height, `batchSize`, `inputImages` JSON, `workspaceId`, `folderId`,
`publishedAt`, `notices` JSON, soft-delete `deletedAt`), `CreditPool` (`wallet|daily|model:<slug>`),
`CreditLedger`, `FreeGensGrant`, `FeedPublication`, `Contest`.

Seed (`bun run db:seed`) is idempotent (upserts keyed by stable ids): demo user + pools + grant,
1 folder with 3 done generations (one carrying the §1e notice), 8 creator users, 12 feed
publications, 3 contests.

## Commands

```bash
bun run dev        # dev server on :3000 (Turbopack)
bun run db:push    # idempotent schema push (run twice for the receipt)
bun run db:seed    # idempotent seed
bun run lint       # eslint — 0 errors
bunx tsc --noEmit  # EXIT 0
bun run build      # production build (standalone)
bun test tests/api.test.ts   # 19 API tests (needs a running server on :3000)
bun test tests/e2e.test.ts   # full local loop (run with MOCK_ADAPTER_MS=50 on the server)
```

E2E-at-50ms receipt recipe: stop dev, `bun run build`, then
`DATABASE_URL=file:… MOCK_ADAPTER_MS=50 PORT=3000 HOSTNAME=0.0.0.0 node .next/standalone/server.js`,
then run both test files against it.

## Wave-2 scope & provenance

Built strictly from the HF-W2 order's **inline §1 evidence** (live-captured 2026-10-17): the §1a
generation POST body (verbatim field names, credit cost on the GENERATE button), §1b jobs-list
shape, §1c wallet/user/touring/features bodies, §1d stale-token retry behavior, §1e
notices/contests field names, §1f route family mapping (`/_private/generate/…` → `/generate/…`,
`/(public)/community/_tabs/*` → `?tab=…`), §1g community endpoint inventory.

### Disclosures (clone-side choices & wave-1 stand-ins)

1. The claimed wave-1 base merge was **absent** from the workspace (`main` = scaffold initial
   commit). Wave 2 is self-contained; the wave-1 stand-ins it needed (app shell, wallet chip,
   UPGRADE REQUIRED modal, auth session) were built as part of this wave.
2. The `evidence/rea-2026-10-17/…` files referenced by the order were not present; only the inline
   §1 bodies were used.
3. Fixture images are AI-generated demo assets (`public/fixtures/gen-01..15.png`; bytes are
   JPEG-encoded by the generator CLI despite the `.png` extension — browsers sniff the format).
   Community feed values (views/likes/dates), contest values, and creator usernames are seeded
   demo data — field names are verbatim §1e.
4. `MODEL_CATALOG` slugs/costs beyond the evidence anchors (`nano-banana-2` = 2,
   `cinema-studio-4` = 80) and the pricing page's Pro tier values are disclosed placeholder demo
   values (the pricing digest body was not in the workspace).
5. Determinism law: all generation outputs derive from `mulberry32(job.seed)` (no `Math.random`
   in shipped code; verified by grep). Record bookkeeping fields (`startedAt/completedAt/
   deletedAt/publishedAt`, ledger `createdAt`) use DB-level defaults / server-side `Date` — they
   never influence outputs.
6. The `/api/jobs/{segment}` route uses one dynamic slug (Next.js forbids two slug names per path
   level): POST treats it as a model slug (§1a parity), other verbs as a job id. Folder
   association rides on `?folder_id=` so the §1a body stays verbatim.

## Wave 3+ (not in scope here)

The remaining route-manifest surface (364 routes): settings/billing family, profile pages,
originals/projects content, posts/publications detail, contests submission flow.
