# Wave-3C worker worklog — platform pages + contests + route parity (hf/wave-3c-platform)

> **Implementation by worker 58 (5 commits: cba7fa4, 40a8a45, 1c56f78, a5f166e,
> 0c07a02); completion (route-parity exit gate C6 + delivery records) by
> worker 59 after worker 58's session hit the deadline following the last
> code commit.** The station had already verified the implementation green
> before worker 59 started; worker 59's scope was the missing C6 gate, the
> gap it found, and these records.

Order: `docs/HF-PROGRAM/HF-WAVE3-PACKET.md` → Sub-order 3C — platform pages
(`/api`, `/mcp`, `/academy`), `/contests/[slug]` detail, community "projects"
tab fill, Platform nav, and the route-parity exit gate. WORKER LAWS binding
(FILE-TOOL §10b, evidence-first, file boundary, no new packages, determinism,
verification battery, no push / no self-merge).

## Work log

### C1 — `/api-docs` Open Platform page (worker 58, commit cba7fa4)

- Files: `src/app/api-docs/page.tsx` (27 lines) +
  `src/components/platform/api-platform-landing.tsx` (567 lines); 594
  insertions total, 2 files.
- Public page (no SessionGate) built from
  `evidence/rea-2026-10-17/surfaces/inspect-api.json` (2577 a11y nodes; root
  10705 "Open Higgsfield AI | Official Higgsfield API Platform"):
  - cashback banner (11099–11107: 'ENDS SEP 30 23:59 UTC', 'UP TO $200,000
    FREE', heading 'GET 100% CASHBACK ON API SPENDINGS');
  - platform chrome rendered as an in-page navigation column (live sidebar
    10707 'Primary navigation' with Dashboard/Explore models/Quick start/
    Documentation/Pricing UP TO 75% OFF/Playground/API keys/Cashback/
    Analytics/Billing; top links Contact sales/Status/Pricing/Log in);
  - featured strip (region 10763 'Featured models', 8 featured cards);
  - model catalog — 'Show all Image models' 11364/11365 + group 11374,
    'Show all Video models' 11630/11631 + group 11640, tabs 'All models'/
    'Image'/'Video' 11127–11135, searchbox 10696, Filter 11142;
  - Workflows region 12002 'Workflows Launch ads and campaigns' + group 12011.
- Card data imported from the wave-3A `src/lib/model-registry.ts` (same
  evidence base; per-entry citations there) — no duplication of the registry.
- **ROUTE RENAME (disclosed):** live `/api` → clone `/api-docs` because
  `src/app/api/` is this Next.js build's API route-handler namespace
  (auth/jobs/folders/… route.ts files); a page at `src/app/api/page.tsx`
  would collide with the handler tree. Nav labels it "API".
- Docs-app rail entries whose surfaces were NOT captured render as visibly
  scoped disabled stubs (no fake links); live paged horizontal carousels
  render as flat grids with a Show all / Show previous toggle (collapsed =
  6 cards, clone-side count — disclosed).

### C2 — `/mcp` + `/mcp/[slug]` (worker 58, commits 40a8a45 + 1c56f78)

- Commit 40a8a45 added the route files `src/app/mcp/page.tsx` +
  `src/app/mcp/[slug]/page.tsx` (103 insertions); the landing body
  `src/components/platform/mcp-landing.tsx` (458 lines) landed with commit
  1c56f78 (see C3) — the final tree is consistent (station verified HEAD).
- Landing built from `surfaces/inspect-mcp.json` (1476 a11y nodes; root 7138
  "Higgsfield MCP | AI Image & Video Generation for Any Agent"):
  - hero region 7236 + heading 7261 'GENERATE IMAGES & VIDEOS IN CHATGPT WITH
    HIGGSFIELD';
  - install tabs 7237–7257 (ChatGPT Plugin / Claude / Claude Code / Telegram
    / CLI / Other) with the captured panel (7268 'Install Higgsfield
    plugin', 7271 'How to connect?', 7274 'Copy connector URL', 7276
    'https://mcp.higgsfield.ai/mcp');
  - demo slides region 7291 (tabs 7279/7283/7287 Generate video / image /
    Edit a photo; panel 7294 'Generate a cinematic video', '@Higgsfield'
    7297, prompt 7298, 'Try in ChatGPT' 7299, 'Copy prompt' 7302, 'Unmute
    video' 7292);
  - skill presets region 7277 (heading 7420 'Discover what you can create',
    filter group 8972 with 9 filter buttons 7426–7450, 7 preset cards
    7457–7556 with slugs/blurbs/category chips);
  - model marquee + the shared AI-NATIVE CREATIVE SUITE site footer (see C3).
- `/mcp/[slug]` is a routed placeholder: the live `mcp_/$slug` doc tree and
  sibling action-redirects (`mcp-credits`, `mcp-pricing`) carry no captured
  surface, so the page renders the captured slug verbatim + a visible
  demo-scope note; unknown slugs do NOT 404 (the live route accepts
  arbitrary slugs).
- Route truth cited in-file: manifest keys `/(public)/mcp`, `/(public)/mcp_/$slug`,
  `/(public)/mcp_/(bundles)/$id`, `/(action-redirects)/mcp-credits{,/$id}`,
  `/(action-redirects)/mcp-pricing{,/$id}`.

### C3 — `/academy` + shared site footer (worker 58, commit 1c56f78)

- Files: `src/app/academy/page.tsx` (23) +
  `src/components/platform/academy-landing.tsx` (646) +
  `src/components/platform/mcp-landing.tsx` (458) +
  `src/components/platform/site-footer.tsx` (180); 1307 insertions, 4 files.
- Landing built from `surfaces/inspect-academy.json` (1152 a11y nodes; root
  "Academy | Higgsfield"): hero 'LEARN AI VIDEO FROM ZERO.' 23997 with
  subtitle '7 lessons. 90 minutes. You'll make your first video in the first
  lesson.' 24000 + 'Join 100,000+ creators' 24026–24028; WHAT YOU'LL MAKE.
  region 24029 (tabs Locations/Video/Characters/Product, before/after pairs
  with 'Before the course'/'After the course' labels); START CREATING WITH
  AI (NO EXPERIENCE NEEDED stepper, WE PICK THE MODELS FOR YOU, LEARN THE AI
  BASICS); WHAT YOU GET. region 24107 (LEARN FROM TOP AI FILMMAKERS, 7 VIDEO
  LESSONS, A PDF GUIDE FOR EVERY LESSON, THE LATEST AI KNOWLEDGE, lesson
  card 'Your First Video' + 'You are here', HOMEWORK, CERTIFICATE); TWO WAYS
  TO SPEND THE NEXT 90 MINUTES. region 24168 ('Nothing' vs 'RECOMMENDED /
  Your own film' cards); FAQ accordion; WANT MORE closing section.
- `site-footer.tsx`: the "AI-NATIVE CREATIVE SUITE" sitemap footer captured
  twice with identical structure (inspect-mcp.json sectionfooter 7602,
  heading 7603, columns 7606–7797, socials 7813–7825, address 7810, ©
  7830–7833; inspect-academy.json heading 24460 + columns 24463–24664).
  Link policy (disclosed): live footer hrefs were not captured — labels link
  ONLY to clone surfaces that actually exist; every other entry renders as
  inert text.
- Academy doc-tree children (`/academy/_catalog/*`, `/academy/courses/*`)
  uncaptured → deferred (now recorded in docs/route-parity-report.md).

### C4 — `/contests/[slug]` detail + digest-shaped Contest model (worker 58, commit a5f166e)

- Files: `prisma/schema.prisma` (+44/-2 — Contest extension),
  `prisma/seed.ts` (148 changed — the 3 digest contests seeded verbatim),
  `src/app/contests/[slug]/page.tsx` (305),
  `src/app/api/community/contests/[slug]/route.ts` (24, new),
  `src/app/api/community/contests/route.ts` (+22 additive),
  `src/components/community/contests-tab.tsx` (+23),
  `src/components/community/types.ts` (+41), `src/lib/contests.ts` (69, new);
  594 insertions / 82 deletions, 8 files.
- Prisma `Contest` extended with the live contests-body keys
  (`api-bodies-digest.json` → contests items): `prizePool`, `submissionsCount`,
  `winner` (JSON `{id, username, avatar_url}`), `someContestants` (JSON
  array), `judges` (JSON array), `isTrending` — JSON strings because SQLite
  has no list columns; `src/lib/contests.ts` maps rows to the verbatim body
  shape; the list API change is additive (wave-2 keys untouched).
- Detail page (public, force-dynamic, `notFound()` for unknown slugs) from
  `surfaces/inspect-contests.json` (839 nodes): heading 6893, card fields
  'Prize pool' 6909 + '$1,000,000' 6912, 'In Higgsfield credits pool' 6929,
  'Contest has ended' 6925, 'Winners announced' 6940/6983, 'View submissions'
  6918, 'Projects submitted' 6992 + '+8,752' 6995, contestant avatars
  6993/6994; digest winner/some_contestants/judges rendered (winner username
  'mrabujoe'; judges Buralqy / PBC Worldwide / Secret Level / Rourke / PJ
  Ace / Jama Jurabaev on the captured contest).
- Contests tab cards gained prize-pool lines and a real 'View details' link
  (ev 6936/6922) replacing the wave-2 disabled "Opens in wave 3" button.
- Seed: digest preview_image/logo_url are live CDN assets → mapped to local
  fixtures (disclosed).

### C5 — community projects tab + Platform nav (worker 58, commit 0c07a02)

- Files: `src/components/community/projects-tab.tsx` (150, new),
  `src/components/community/community-content.tsx` (+21/-9 — the wave-2
  "Projects ship in Wave 3" stub replaced),
  `src/components/app-shell.tsx` (+27 — the only shared-file edit, allowed);
  189 insertions / 9 deletions, 3 files.
- Projects tab renders the captured OPEN PROJECTS section
  (`surfaces/inspect-community.json` region 3653: heading 3655, subtitle
  3659 'Standout projects making waves around the web', filter group 3660
  with Popular / Global Film Festival / Higgsfield Originals, 8 project
  cards 3673–3783 with titles/authors/like counts, 'Explore all projects'
  3810) as a **static evidence-based view** — the live feed is an
  editorially curated showcase not served by any clone API (folders are
  private containers; publications are per-generation shots). Filter chips
  inert (semantics uncaptured); View/Like are uncaptured fnf flows →
  visibly scoped.
- app-shell "Platform" nav group (Braces API → /api-docs, Plug MCP,
  GraduationCap Academy, Trophy Contests → /community?tab=contests), desktop
  sidebar + mobile Sheet; citations: 'MCP' 7159/23915/6797, 'API'
  7162/23918/6800, 'Academy New' 7177/23933/6815, standalone 'Contests'
  7193/23949/6831. The grouping under a "Platform" heading mirrors the
  Studios/Tools layout convention (the live sidebar is flat — disclosed);
  the 'New' promo badge is a live promo state, not rendered.

### C6 — route-parity exit gate + gap fix (worker 59, this completion)

- **Script:** `scripts/route-parity.mjs` (zero-dep node:fs/node:path;
  `bun scripts/route-parity.mjs`):
  1. walks `src/app` for `page.tsx` (32 pages; `[x]`→`:x`, `[...x]`→`*`,
     route-group dirs stripped, `src/app/api` subtree excluded);
  2. flattens `route-preload-manifest.json` (364 keys → 330 normalized live
     routes; group parens and leading-`_` pathless segments stripped,
     trailing-`_` route-id quirk de-underscored — `mcp_/$slug` →
     `/mcp/:slug` per the established 3C interpretation — `$x`→`:x`, bare
     `$`→`*`, trailing slashes dropped);
  3. diffs against a 40-entry curated wave 1–3 scope with an explicit ALIAS
     map for disclosed clone-side conventions (`/api`→`/api-docs` off-manifest
     rename, `/asset`→`/assets`, generate-tree flattening, community
     query-param tabs, effects slug + collection fold, `/explore` public
     choice);
  4. groups every remaining live route into 16 DEFERRED groups with one-line
     reasons (auth-provider, supercomputer, flow-tree, settings-account,
     profile-pages, academy-children, mobile-shell, per-model-community,
     billing-checkout, onboarding-start, redirect-probe-debug,
     studio-backlog, generate-extras, marketing-static, module-extras,
     uncaptured-detail) — UNGROUPED and curation errors are hard failures so
     nothing can silently disappear;
  5. exits 0 iff MISSING is empty and the curation is sound.
- **Gate run 1 (before fix):** 31 app pages · 39 IMPLEMENTED ·
  **MISSING 1** — `/contests/:contestSlug/submissions` → expected app route
  `/contests/:slug/submissions` (the packet's 3C order: "with submissions
  route shell"; worker 58's detail page carried the disclosure in-page but
  the route did not exist) · EXTRA 0 · DEFERRED 291/16 · exit 1.
- **Gap fix:** created
  `src/app/contests/[slug]/submissions/page.tsx` — routed shell (public,
  force-dynamic, `notFound()` for unknown slugs) citing manifest key
  `/(public)/contests/$contestSlug/submissions/` and evidence nodes
  'View submissions' 6918 / 'Projects submitted' 6992; renders the contest
  header + the real `submissions_count` + the visible uncaptured-gallery
  disclosure; the submission-detail permalink is deferred. Plus one surgical
  edit to `src/app/contests/[slug]/page.tsx`: the disabled 'View
  submissions' button (scoped because the route did not exist) now links to
  the shell, with the comment/disclosure text updated.
- **Gate run 2 (final):** 32 app pages · 40 curated · **IMPLEMENTED 40 ·
  MISSING 0 · EXTRA 0 · DEFERRED 291 in 16 groups · curation errors 0 ·
  ungrouped 0 → exit 0.**
- **Report:** `docs/route-parity-report.md` (summary counts, the full
  IMPLEMENTED table with alias notes, the normalization conventions, all 16
  DEFERRED groups with members, run date 2026-10-17).

## Verification

Station clean-room verification of worker 58's five commits (per the
wave-3C dispatch record, run before worker 59 started):

- `bun run lint` → 0 · `bunx tsc --noEmit` → 0
- all routes 200, including contest detail for the three seeded slugs
  (`higgsfield-global-film-festival`, `higgsfield-seedance-2-contest`,
  `make-your-action-scene`)
- SSR evidence greps confirmed the key captured headings
- test battery 20/20 (tests/api.test.ts 19 + tests/e2e.test.ts 1)

Worker 59 completion verification (after the C6 gap fix):

- `bun scripts/route-parity.mjs` → **exit 0** (IMPLEMENTED 40 / MISSING 0 /
  EXTRA 0 / DEFERRED 291 in 16 groups / curation errors 0 / ungrouped 0)
- `bun run lint` → 0 · `bunx tsc --noEmit` → 0
- New-route curls: `/contests/{higgsfield-global-film-festival,
  higgsfield-seedance-2-contest, make-your-action-scene}/submissions` → 200
  with SSR carrying "Submissions", "N projects submitted" (8,752 for
  make-your-action-scene — the real digest count) and the demo-scope
  disclosure; `/contests/unknown-xyz/submissions` → 404 (`notFound()`)
- 22-route regression sweep over the wave-3 surface + `/`, `/community`,
  `/community?tab=projects`, `/generate/*` → all 200
- Clean-server test battery (`pkill -f "next dev -p 3111"` → relaunch →
  `TEST_BASE_URL=http://localhost:3111 bun test tests/api.test.ts
  tests/e2e.test.ts`): **20 pass / 0 fail / 121 expects**

## Disclosures

1. **`/api` → `/api-docs` rename** (C1): the live Open Platform page sits at
   `/api`; `src/app/api/` is this build's API route-handler namespace, so
   the page lives at `/api-docs` (nav label "API"). The live route is absent
   from the preload manifest — ground truth is `surfaces/inspect-api.json`.
2. **Digest-shaped Contest extension** (C4): prisma fields
   prize_pool/submissions_count/winner/some_contestants/judges/is_trending
   mirror the live contests-body verbatim; JSON strings on SQLite (no list
   columns); the seed carries the digest's 3 contests verbatim with
   preview/logo mapped to local fixtures (live CDN assets).
3. **Projects tab = static evidence view** (C5): the captured OPEN PROJECTS
   cards render verbatim (title/author/likes); no clone API serves that
   shape; filter chips inert; View/Like visibly scoped; visible disclosure
   on the tab.
4. **`/mcp/[slug]` placeholders** (C2): doc bodies for the `mcp_/$slug` tree
   (and `mcp_/bundles/$id`) were never captured → routed placeholder renders
   the slug verbatim + demo-scope note; unknown slugs do not 404.
   `mcp-credits` / `mcp-pricing` action-redirects intentionally not built.
5. **Contest submissions gallery uncaptured** (C4→C6): only
   `submissions_count` is real; the C6 shell at
   `/contests/[slug]/submissions` renders the count + disclosure; the
   submission-detail permalink is deferred; no submission cards are invented.
6. **Contest detail status chips** (C4): digest statuses map onto captured
   labels ('Winners announced' when a winner exists, else 'Contest has
   ended'); the live 'Jury review' phase chip is a live-UI phase absent from
   the digest → not rendered; prize formatting uses the live '$1,000,000'
   comma style.
7. **/api-docs chrome adaptations** (C1): live docs sidebar rendered as an
   in-page nav column; uncaptured rail entries (Dashboard/Quick start/
   Documentation/Playground/API keys/Cashback/Analytics/Billing/Contact
   sales/Status) are scoped disabled stubs; paged carousels render as flat
   grids with a Show all toggle (collapsed = 6 cards, clone-side count).
8. **Site footer link policy** (C3): live footer hrefs uncaptured — labels
   link only to clone surfaces that exist; other entries inert text.
9. **Platform nav grouping** (C5): "Platform" heading groups API/MCP/Academy/
   Contests mirroring the Studios/Tools convention (live sidebar is flat);
   Contests entry targets `/community?tab=contests` (no standalone clone
   index); 'Academy New' promo badge not rendered.
10. **C6 gate interpretation choices** (worker 59): the curated scope + ALIAS
    map encode the program's established clone-side conventions; the
    interpretive aliases (`/effects/use/:slug` ↔ `/effects/:slug`,
    `/collection/effects` → `/effects`, generate-tree flattening, community
    query tabs, `/explore` public choice) are disclosed in
    docs/route-parity-report.md; live `/verify/:serial` lands in the
    uncaptured-detail deferred group (first-match-wins ordering).
11. **Academy children deferred** (C3): `/academy/_catalog/*` and
    `/academy/courses/*` were not captured → not built (recorded in the
    parity report's deferred groups).
12. Determinism respected throughout (no `Math.random`); no new npm packages;
    the only shared-file edit was app-shell.tsx exactly as the order allows.

## Stage summary

- Modules delivered (worker 58): `/api-docs` open-platform page (cashback
  banner, featured strip, full model catalog + workflows off the 3A
  registry), `/mcp` landing + `/mcp/[slug]` routed placeholder, `/academy`
  course landing + shared AI-NATIVE CREATIVE SUITE site footer,
  `/contests/[slug]` detail with the digest-shaped Contest model + detail
  API + tab-link enabling, community projects tab (OPEN PROJECTS static
  evidence view), Platform nav group.
- Completion (worker 59): the C6 route-parity exit gate
  (`scripts/route-parity.mjs`) found exactly one gap — the contest
  submissions route shell ordered by the packet — fixed with a minimal,
  evidence-cited shell page + detail-page link; final gate run exit 0 with
  40 implemented / 0 missing / 0 extra / 291 deferred in 16 groups, full
  report committed to `docs/route-parity-report.md`.
- Verification: station numbers (lint 0 / tsc 0 / routes 200 / SSR greps /
  battery 20/20) + worker 59 re-verification after the gap fix (parity
  exit 0, lint 0, tsc 0, new-route curls 200 + 404 guard, 22-route sweep,
  clean-server battery 20 pass / 0 fail / 121 expects).
- Wave 3 is now complete (3A studios + 3B creative tools + 3C platform &
  parity). Remaining for wave 4: hardening (SQLite WAL/busy_timeout or
  f-worker backoff, rate limiting, observability, deploy prep) and the 291
  deferred live routes, prioritized by the parity report's groups.
