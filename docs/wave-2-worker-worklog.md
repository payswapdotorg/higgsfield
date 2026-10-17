# HF-W2 Worklog — Higgsfield clone, wave 2 (generation pipeline + My generations + community feed)

Program law reminders for all agents:
- Every file change MUST go through file tools (write_file/edit). No bash-side heredoc/python file writes.
- No Math.random / wall-clock-driven output variation in shipped app code. Deterministic seeded PRNG only (mulberry32).
- No secrets, tokens, or real network credentials in any artifact.
- Subagents: read this file BEFORE working, append your section AFTER (append-only, start with `---`).

## Base-state finding (IMPORTANT DISCLOSURE)

Work order HF-W2 §2 says: "Base: station merge of wave-1 (…branch from `main` post-merge)".
Actual workspace state at pickup (verified by `git log`, `git status`):
- `main` = `a0a360f "Initial commit"` containing ONLY `.env`, `.gitignore`, `download/README.md`.
- Working tree = unmodified Next.js 16 + Tailwind 4 + shadcn/ui scaffold (default `src/app/page.tsx`, demo
  Prisma schema with User/Post, empty `mini-services/`).
- NO wave-1 code exists in the repo or on disk. No `evidence/` directory exists either — the order's §1
  inline evidence is the only evidence base available, and the order states it is fully self-contained.

Resolution (consistent with §0 "the order is fully self-contained"): wave-2 is built directly on the
scaffold, self-contained, and the missing wave-1 base + missing evidence files are disclosed in the final
report (DISCLOSURES). Wave-1 stand-ins that wave-2 depends on (app shell, wallet chip, UPGRADE REQUIRED
modal, auth session) are built as part of this wave and marked as such.

- Base commit on `main`: scaffold committed as `chore: bootstrap workspace as wave-2 base`.
- Branch: `hf/wave-2-pipeline` from that base. ≤10 clean commits, all committed by the TL (subagents do NOT commit).

## Stack (fixed by §2)

Next.js 16 App Router (Turbopack dev on :3000), TypeScript strict, Tailwind 4, shadcn/ui (New York),
Prisma + SQLite (`db/custom.db`, `DATABASE_URL` in `.env`), TanStack Query v5, Zustand, sonner toasts.

## Determinism law interpretation (stated openly)

- Generation OUTPUTS are fully deterministic: fixture selection, success/failure injection, and jitter all
  derive from `mulberry32(job.seed)`. `job.seed` is derived deterministically (FNV-1a hash of prompt +
  per-user in-DB sequence). No `Math.random` anywhere in shipped code (verified by grep in gates).
- Record bookkeeping fields (`startedAt`, `completedAt`, `deletedAt`, `publishedAt`, ledger `createdAt`)
  use DB-level defaults (`@default(now())`) or server-side `new Date()` — they never influence outputs.
- Failure injection: prompt containing the exact token `[fail]` forces a deterministic failure;
  `MOCK_FAILURE_PCT` env (default 0) gives a seeded probabilistic failure rate.
- `MOCK_ADAPTER_MS` env (default 1200) sets the mock adapter's base resolve delay (±20% seeded jitter).
  E2E runs with `MOCK_ADAPTER_MS=50`.
- `MOCK_CHALLENGE_PCT` env (default 0) injects the DataDome-style 429 "challenge" on POST /api/jobs.

## Plan (Task IDs)

- 1 (TL): worklog init, base commit, branch. — DONE
- 2 (TL): Prisma schema + idempotent seed + db:push ×2.
- 3 (TL): core libs (catalog, jwt/session, api-client, seeded rng, credits engine, worker + mock adapter).
- 4 (TL): all API routes (auth, user family, jobs family, folders, trash, notices, community, publish).
- 5 (TL): app shell + studio `/` + shared components/hooks/store.
- 5-a (subagent): 15 fixture images via image-generation CLI → public/fixtures/gen-01..15.png.
- 6-a (subagent): My generations pages (/generate/all, /generate/folder/[folderId], /generate/trash).
- 6-b (subagent): community page (+tabs) + pricing stub.
- 7 (TL): quality gates (lint/tsc/build/db:push/seed idempotency).
- 8 (TL): API tests + E2E (N=50ms server run), ledger exact.
- 9 (TL): agent-browser visual verification + fixes.
- 10 (TL): README, MANIFEST, bundle, delivery, final report.

## STATUS LOG

- Tasks 1–5 (TL) DONE: commits 64db351(base) → 47c1a25(db) → 89f0954(core+api) → f23bc95(app shell + studio).
  Pipeline verified live: POST §1a body → queued → worker → done (fixture asset) / failed ([fail] prompt);
  free-gens burn before wallet (5→3, wallet unchanged); publish → feed; trash count; contests; trending.

## API CONTRACT (verified live against the dev server — build against THIS)

All private APIs require the session cookie (POST /api/auth/login sets it). 401 body is exactly
`{"detail":"Invalid or expired token"}`. Data payloads are snake_case.

### Auth
- POST /api/auth/login {email, username?} → {user:{id,email,username,display_name,plan_type,created_at}} + Set-Cookie
- GET /api/auth/session → {user:{…}} | 401
- POST /api/auth/refresh → {ok:true} + rotated cookie
- POST /api/auth/logout → {ok:true}

### Jobs pipeline
- POST /api/jobs/{model}?folder_id=<optional> — body §1a verbatim:
  `{params:{prompt, aspect_ratio("3:4"|"16:9"|"1:1"), resolution("1k"|"2k"), batch_size, is_storyboard,
  is_zoom_control, use_unlim, width, height, input_images:[]}, use_unlim:false}` (strict; unknown keys → 400).
  Models: `nano-banana-2` (2cr, image, batch≤4), `cinema-studio-4` (80cr, video), `wan-2-2-animate-faceswap` (30cr, video).
  → {job} with status `queued`. 402 on insufficient credits, 404 unknown model, 429 = seeded challenge.
- GET /api/jobs/accessible?folder_id=&trash=1&job_set_type=&limit=&offset= → {jobs:[JobJson], has_more}
- GET /api/jobs/{jobId} → {job}; DELETE /api/jobs/{jobId} → soft-delete {job}; DELETE …?purge=1 → {ok:true,purged:true}
- POST /api/jobs/{jobId}/restore → {job}; POST /api/jobs/{jobId}/publish → {publication:{id,generation_id,author_username,thumbnail_url,views,likes,published_at}} (409 if already published/not done)

### JobJson (from GET /api/jobs/accessible)
`{id, user_id, folder_id, model_version, model_label, job_set_type, kind("image"|"video"), prompt,
aspect_ratio, resolution, width, height, batch_size, input_images, workspace_id,
status("queued"|"processing"|"done"|"failed"), seed, cost, credits_spent:[{pool,amount}], asset_url,
error, notices:[{variant,badge:{label,tooltip}}], published_at, deleted_at, created_at, updated_at}`

### Folders
- GET /api/folders → {folders:[{id,name,recent_jobs_count,created_at}]}
- POST /api/folders {name} → {folder:{…}} (409 on duplicate name)
- GET /api/folders/{id} → {folder:{…}}; DELETE /api/folders/{id} → {ok:true} (jobs → trash)

### Trash
- GET /api/trash/library/count → {count}

### User family
- GET /api/user/wallet → §1c wallet shape (credits_balance = wallet pool)
- GET /api/user/free-gens/v2 → §1c touring shape + additive `remaining`
- GET /api/user/features → §1c verbatim
- GET /api/user → §1c trimmed user shape

### Community (PUBLIC — no auth needed)
- GET /api/community/generations/feed?limit=&offset= → {items:[{id,thumbnail_url,views,likes,published_at,author_username,author_avatar,generation:{id,prompt,model_version,model_label,job_set_type,kind,aspect_ratio,width,height}}], has_more}
- GET /api/community/trending?limit=&sort=most_viewed → {items:[…]} (views desc)
- GET /api/community/discovery/creators → {items:[{username,display_name,avatar_url,publications,total_views,total_likes}]}
- GET /api/community/discovery/header → {title,subtitle,tabs:[…]}
- GET /api/community/contests → {items:[{id,slug,title,description,start_at,end_at,status,preview_image,preview_video,logo_url,redirect_url}]}

### Frontend building blocks ALREADY EXISTING (use them, don't rebuild)
- `src/lib/api.ts` — `api<T>(path, {method, body})` client wrapper (401-retry + challenge toast built in)
- `src/lib/catalog.ts` — `MODEL_CATALOG`, `ASPECT_PRESETS`, `presetFor`, `noticesForJobSetType`, `PRICING_CONFIG`
- `src/hooks/use-session.ts` — `useSession()`, `useLogin()`, `useLogout()`
- `src/hooks/use-jobs.ts` — `useJobs({folderId?, trash?, limit?, offset?})` (polling w/ 2s→1.15^n→10s cap, stops on terminal)
- `src/hooks/use-folders.ts` — `useFolders()`, `useCreateFolder()`, `useDeleteFolder()`
- `src/hooks/use-trash-count.ts` — `useTrashCount()`, `useInvalidateJobQueries()`
- `src/hooks/use-free-gens.ts`, `src/hooks/use-wallet.ts`
- `src/components/app-shell.tsx` — layout renders it (sidebar+topbar) on EVERY page already
- `src/components/session-gate.tsx` — wrap private page content: `<SessionGate>{children}</SessionGate>`
- `src/components/generations/job-card.tsx` — `<JobCard job={JobJson} showActions?/>` (status chip, cost badge,
  notices badge, video badge, menu: publish/retry/trash) — DO NOT modify, reuse
- `src/store/ui.ts` — `useUiStore` (upgrade modal); `src/store/studio.ts` — studio form state
- Theme: dark only, accent = `var(--signal)` orange (class `text-[var(--signal)]`), NO blue/indigo.
- Long lists: `max-h-*` + `overflow-y-auto` + `scrollbar-slim` class.

---
Task ID: 7-12 (TL closeout)
Agent: TL
Task: quality gates, tests/E2E receipts, browser verification, delivery artifacts

Work Log:
- Fixed shared-file issues flagged by agents: credits.ts `userId` shorthand (2nd occurrence, pool CAS branch —
  tsc catch), app-shell setState-in-effect lint error + `trashData?.count` narrowing, job-card unused
  eslint directive. Excluded scaffold-only folders (examples/, skills/, mini-services/, hf-delivery/)
  from tsconfig so the app tree typechecks clean.
- Gates: `bun run lint` → 0 errors; `bunx tsc --noEmit` → EXIT 0; `bun run build` → EXIT 0
  (standalone server.js produced); `bun run db:push` ×2 idempotent; `bun run db:seed` ×2 idempotent
  (identical row counts).
- Test receipts: `bun test tests/api.test.ts` → 19/19 pass (98 expect calls) — §1a shape parity,
  preset-driven w/h, strict-schema rejections, 401 verbatim body, concurrent ×2 atomic spend
  (one 200 + one 402, wallet 0, ledger exact), status machine walk (done + [fail] failed),
  wan2_2 notice badge, free-gens burn order (grant→split→exhausted), 402 upgrade gate, feed
  pagination, trash count/restore/purge, apiFetch 401-retry + 429/403 challenge retry units.
- E2E receipt at MOCK_ADAPTER_MS=50 against the PRODUCTION standalone build: full loop
  (fresh user + §1c grant → create folder → §1a POST → poll → done in folder list → asset served →
  publish → feed contains → ledger exact: 1 entry free_gens -2, wallet untouched) — 1/1 pass.
  NOTE: API tests run against the dev server mid-development intermittently hit SQLite lock
  contention from HMR-stale worker modules; a clean dev-server restart → 19/19. All formal
  receipts were captured against the single-process production server (no HMR).
- Browser verification (agent-browser): studio sign-in → generate (polling → done, FREE badge),
  wallet chip, notices badge on wan model chip + Chef card, My generations (folder cards w/
  recent_jobs_count, new-folder dialog, folder delete AlertDialog), folder page, trash page,
  community (feed cards, 5 tabs, contests, creators), pricing, publish-to-community via card
  menu → appears in feed, mobile viewport (hamburger, responsive grids), images all loaded
  (naturalWidth>0), zero console/page errors.
- Delivery: README (scope + provenance + disclosures), MANIFEST (changed paths + sha256 +
  TREE-SELF-CHECK), git bundle at hf-delivery/hf-w2/hf-w2.bundle.
- Final sweep: patched the scaffold shadcn sidebar's Math.random (deterministic width cycle —
  the ONLY Math.random in shipped code, from the base scaffold, not wave-2 logic), added
  bun-types triple-slash references to the test files so root `tsc --noEmit` covers them,
  nullable-type test fixes. Gates re-run after the sweep: lint 0, tsc EXIT 0, api 19/19
  (99 expects), e2e 1/1. Bundle + MANIFEST rebuilt from the final HEAD.

Stage Summary:
- Branch hf/wave-2-pipeline: 7 commits over the scaffold base 64db351. All §3 items delivered.
- Disclosures recorded in README §Disclosures: missing wave-1 base (built self-contained),
  missing evidence/ files (used inline §1 only), JPEG-bytes-in-.png fixture caveat, placeholder
  catalog/pricing values beyond evidence anchors, bookkeeping-timestamps determinism note,
  single-slug /api/jobs route semantics.


---

Task ID: 5-a
Agent: fixtures-generator
Task: Generate 15 AI fixture images (gen-01..gen-15.png) into public/fixtures/ via the z-ai CLI — the deterministic mock-adapter assets for the AI generation studio demo.

Work Log:
- Read worklog.md first (program law); confirmed public/fixtures/ existed and was empty before starting.
- Ran `z-ai image -p "<prompt>" -o "/home/z/my-project/public/fixtures/gen-NN.png" -s <size>` for all 15 specs verbatim, executed in 5 batches of 3 (300s timeout per batch). All 15 runs exited 0 on the first attempt — zero retries, zero failures.
- Sizes generated exactly per spec: 768x1344 portrait → gen-01, 02, 04, 05, 07, 09, 11, 12, 13 (9 files); 1024x1024 square → gen-03, 10, 14 (3 files); 1344x768 landscape → gen-06, 08, 15 (3 files).
- Verification (`ls -la public/fixtures/`): exactly 15 files gen-01.png … gen-15.png, every one non-zero (86 KB–190 KB, ~2.2 MB total).
- Verification (`file`): every file reports the exact requested pixel dimensions (768x1344 / 1024x1024 / 1344x768).
- DISCLOSURE (encoding): `file` identifies the bytes as JPEG (JFIF standard 1.01, components 3) despite the `.png` extension — that is simply how the z-ai CLI encodes its output. Files were kept byte-for-byte as written by the CLI because it is the only sanctioned image-binary writer (program law §2; Write/Edit tools are text-only, bash-side conversion is forbidden). Impact: none for browser rendering (browsers sniff image bytes) and none for next/image (sharp detects the real format regardless of extension); flagged here in case anything downstream ever validates PNG magic bytes strictly.
- No files outside public/fixtures/ were created or modified apart from this worklog append; no git commits; dev server untouched.

Stage Summary:
- 15/15 deterministic fixture assets in place at public/fixtures/gen-01.png … gen-15.png with exact filenames, exact specified dimensions, and non-zero sizes — task 5-a DONE with no failures or retries.
- Mock adapter / seed can now resolve asset_url to /fixtures/gen-NN.png as planned (9 portrait 768x1344, 3 square 1024x1024, 3 landscape 1344x768).
- One caveat surfaced for the TL: fixture bytes are JPEG-encoded under .png names (CLI output encoding); safe for browser and next-image use, but should be known if strict PNG magic-byte validation is ever added.

---
Task ID: 6-a
Agent: my-generations-ui
Task: "My generations" surfaces — /generate/all overview, /generate/folder/[folderId], /generate/trash (built strictly against the worklog API contract + existing hooks/components).

Work Log:
- Read the API contract + existing blocks (job-card, session-gate, use-jobs/use-folders/use-trash-count, api wrapper, app-shell) before writing anything; did NOT touch any shared file.
- NEW `src/components/generations/folder-card.tsx`: reusable FolderCard — cover = most recent done job's `asset_url` passed in by the caller (dashed Folder-icon placeholder when none), name + `recent_jobs_count` chip ("N generations"), hover/focus-revealed top-right dropdown ("Delete folder") → controlled AlertDialog confirm ("Delete folder? Its generations move to trash…") → `useDeleteFolder()` with busy spinner; menu is a sibling of the card `<Link>` (z-10, absolute) so menu clicks never navigate the link.
- NEW `src/app/generate/all/page.tsx`: SessionGate-wrapped overview. Header "My generations" + "New folder" Button → Dialog (single Input + Create; `useCreateFolder`, 409 duplicate-name surfaces the API detail via `toast.error(err.message)`, busy loader, disabled-while-creating onOpenChange guard). Folders section (grid-cols-2 sm:3 lg:4; hidden when empty) derives covers from the SAME `useJobs({limit:60})` query via `jobs.find(j => j.folder_id === f.id && j.status === 'done' && j.asset_url)`; >8 folders → container gets `max-h-96 overflow-y-auto scrollbar-slim pr-1`. "All generations" grid of `<JobCard job={job} />`, skeleton pulse tiles (aspect-[3/4], 8×, role=status) while loading, empty state with signal-orange link "Create your first generation →" to "/".
- NEW `src/app/generate/folder/[folderId]/page.tsx`: 'use client', `useParams()` for folderId, SessionGate. Breadcrumb (shadcn Breadcrumb): "My generations" → folder name (truncated). Folder detail via `useQuery(["folder", id], api GET /api/folders/{id}, retry:false)` → not-found state ("Folder not found" + back link). Header: name + "N generations" + ghost destructive "Delete folder" → AlertDialog confirm → `useDeleteFolder()` → `router.push("/generate/all")`. Jobs via `useJobs({folderId, limit:60})`; skeletons while loading; "This folder is empty" + create link when empty.
- NEW `src/app/generate/trash/page.tsx`: SessionGate; header "Trash" + count Badge from `useTrashCount()`. `useJobs({trash:true, limit:60})` grid; per-card local `TrashJobCard` = `<JobCard showActions={false} />` + action row: "Restore" (secondary → POST /api/jobs/{id}/restore → `useInvalidateJobQueries()` → `toast.success("Restored")`) and "Delete forever" (destructive → AlertDialog → DELETE /api/jobs/{id}?purge=1 → invalidate → toast); shared busy state disables both buttons + dialog stays open until settle. Empty state: Trash2 icon + "Trash is empty". Loading: tile+actionbar skeletons.
- Consistency: rounded-xl border-border bg-card cards, `hover:border-foreground/20`, signal-orange accent for primary links, semantic `<section aria-label>`/`<header>`, aria-labels on all icon buttons, sr-only-friendly `role="status"` loading groups, mobile-first responsive grids (2 cols on mobile). No new npm packages, no layout.tsx, no footer.
- Verification: `bun run lint` → 0 problems in my 4 files (removed an unused `@next/next/no-img-element` disable directive in folder-card — the rule is off in this config; job-card.tsx carries the same benign warning but is off-limits). `bunx tsc --noEmit` → 0 errors in my files. curl: /generate/all → 200, /generate/trash → 200, /generate/folder/nonexistent-id → 200, dev.log clean (compiles, no 500s). SSR renders the SessionGate loading shell as designed; content hydrates client-side (same as studio `/`).
- NOTED for TL (files I don't own, not edited): (1) lint ERROR `react-hooks/set-state-in-effect` at src/components/app-shell.tsx:135 (`useEffect(() => setMobileOpen(false), [pathname])`) + tsc ERROR TS18048 'trashData' possibly undefined at app-shell.tsx:93 (`{trashData.count}` inside `(trashData?.count ?? 0) > 0` guard — needs optional chain); (2) tsc error .next/dev/types/validator.ts referencing '/community' (route not created yet — 6-b's scope); (3) tsc error src/server/credits.ts:105 TS18004 'userId' shorthand; (4) examples/ + skills/ tsc noise (socket.io-client etc., pre-existing sandbox fixtures).

Stage Summary:
- All three "My generations" surfaces shipped: /generate/all (folders + full library + new-folder dialog), /generate/folder/[folderId] (breadcrumb, detail fetch, delete→redirect), /generate/trash (restore / delete-forever) — strictly inside the file boundary (4 new files, 0 shared files touched).
- Fully wired to the existing contract: useJobs/useFolders/useCreateFolder/useDeleteFolder/useTrashCount/useInvalidateJobQueries, `api()` wrapper (401-refresh + challenge toasts built in), JobCard reuse (showActions={false} in trash), sonner feedback, Loader2 busy states.
- My files are lint-clean and tsc-clean; routes verified 200 against the live dev server; demo data path checked end-to-end (demo login → folders API → seeded folder/jobs shape matches JobJson fields used for cover derivation).


---
Task ID: 6-b
Agent: community-ui
Task: /community (tabbed discovery feed via ?tab=, mirroring the /(public)/community/_tabs/* family) + /pricing stub (PUBLIC, no SessionGate).

Work Log:
- Read worklog API CONTRACT + existing blocks first; verified all five community API response shapes live before building.
- Created `src/components/community/types.ts` — shared snake_case response types (FeedItem/FeedResponse, ContestItem, CreatorItem, CommunityHeader, CommunityTab).
- Created `src/components/community/format.ts` — `formatCompact` (12.8k / 2.5M) + `shortAgo` ("3d ago") built on date-fns `formatDistanceToNowStrict` (no Math.random anywhere; deterministic skeleton aspect arrays too).
- Created `src/components/community/feed-card.tsx` — Higgsfield-style card: plain `<img>` natural-aspect `w-full h-auto rounded-xl`, hover overlay bottom gradient `from-black/80` with author chip (Avatar + initials fallback), Eye/Heart compact counts, relative age, VIDEO badge (Play icon, top-left) for kind==="video"; non-navigating (cursor-default) per wave-3 scope.
- Created `src/components/community/generations-tab.tsx` — masonry `columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5`, cards `mb-4 break-inside-avoid`; pagination via `useInfiniteQuery` (queryKey exactly `["community-feed"]`, limit=24, offset = accumulated items length while `has_more`) with "Load more" button; pulse skeletons of varying heights; empty + error states with retry.
- Created `src/components/community/contests-tab.tsx` — grid `sm:grid-cols-2 lg:grid-cols-3`, aspect-video preview, green-dot "Open" status badge, title, line-clamp-2 description, `format("MMM d, yyyy")` date range, disabled "Opens in wave 3" button with explanatory `title` (kept on a wrapper span so the tooltip still fires on disabled).
- Created `src/components/community/creators-tab.tsx` — grid `sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (task's literal "lg:grid-cols-3 lg:grid-cols-4" would self-conflict; interpreted as lg:3 → xl:4), Avatar initials fallback, display_name/@username, publications + compact views stats, Follow (secondary) → toast.success("Following @user (demo)").
- Created `src/components/community/wave-three-stub.tsx` — centered empty state (Film / FolderGit2 icons) reused by originals + projects tabs ("… ship in Wave 3", subtext: route family mirrors the live manifest).
- Created `src/components/community/community-content.tsx` — header via useQuery `["community-header"]`, hardcoded five-tab pill bar (Link to `/community?tab=…`, role=tablist/tab + aria-selected + aria-current, active pill = `bg-[var(--signal)]`), horizontally scrollable (`overflow-x-auto scrollbar-slim whitespace-nowrap`), tab panel section.
- Created `src/app/community/page.tsx` — 'use client'; page renders `<Suspense fallback={skeleton}>` around CommunityContent (which reads `useSearchParams()`) so the static prerender succeeds.
- Created `src/app/pricing/page.tsx` — PUBLIC stub; PRICING_CONFIG (v45.0.0 badge), wallet summary card when signed in (useWallet(!!user) → "Your balance: N credits" + free-gens remaining via useFreeGens), plans grid `sm:grid-cols-2 max-w-3xl` with Check-icon features, Free → disabled "Current plan", Pro → "Upgrade" (signal-orange) → toast.info("Billing flows ship in Wave 3 — Pro values are placeholder demo data"); evidence footnote included.
- Lint: task-order note — the order said to add `{/* eslint-disable-next-line @next/next/no-img-element */}` before `<img>`, but the project flat config sets that rule "off", so the directives came back as "unused eslint-disable directive" WARNINGS in my files; replaced them with plain explanatory comments → my files are lint-clean (0 errors, 0 warnings).
- Verification: `bun run lint` → 0 problems in my files (remaining: app-shell.tsx error + job-card.tsx warning, both outside my boundary — see below). `bunx tsc --noEmit` → 0 errors in my files. curl: /community → 200, /community?tab=contests → 200, /pricing → 200 (plus ?tab=creators and ?tab=bogus fallback → 200). dev.log shows clean compiles, no runtime errors. Seeded data confirmed live (13 feed items incl. demo_creator publish, 3 contests, 8 creators).

SHARED-FILE OBSERVATIONS (NOT edited — outside my file boundary, for TL attention):
- `src/components/app-shell.tsx:135` — eslint ERROR `react-hooks/set-state-in-effect` (setState in effect closing the mobile Sheet) and tsc TS18048 `'trashData' is possibly 'undefined'` at :91.
- `src/components/generations/job-card.tsx:117` — unused eslint-disable directive warning (`@next/next/no-img-element` is off in the config; directive can be dropped).
- `src/server/credits.ts:105` — tsc TS18004 (`userId` shorthand has no value in scope) — same ReferenceError that 500s POST /api/jobs in dev.log until fixed.

Stage Summary:
- /community live with five tabs (generations masonry feed + Load more, contests, creators, originals/projects wave-3 stubs), public APIs only, query keys `["community-feed"|"community-contests"|"community-creators"|"community-header"]`.
- /pricing live as a public stub driven by PRICING_CONFIG with conditional wallet/free-gens summary; all billing CTAs toast the wave-3 notice.
- 9 new files, all inside the allowed boundary (`src/app/community/page.tsx`, `src/app/pricing/page.tsx`, `src/components/community/*`); no other file touched; lint/tsc clean for my files; all route curls 200.

