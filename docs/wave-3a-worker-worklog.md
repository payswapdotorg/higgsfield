# HF wave-3A worker worklog — studios family + model catalog surface

Worker: 53 (wave-3a-worker, full-stack-developer). Branch: `hf/wave-3a-studios`
(from `main` @ fae197f). Order: HF-WAVE3-PACKET.md sub-order 3A. All file writes
went through the Write/Edit/MultiEdit tools (FILE-TOOL LAW §10b respected — zero
bash-side file writes into the repo; python was used only for evidence extraction
to stdout / /tmp).

## Modules delivered

### A1. `/explore` — the model catalog surface (public, no SessionGate)

- `src/lib/model-registry.ts` — `MODEL_REGISTRY` (vendor → `RegistryModel[]`),
  plus `IMAGE_MODELS`, `VIDEO_MODELS`, `WORKFLOWS`, `modelHue()` (deterministic
  fnv1a-based hue for card visuals; no Math.random). Extracted from
  `evidence/rea-2026-10-17/surfaces/inspect-api.json` (root "Open Higgsfield AI |
  Official Higgsfield API Platform", 2577 a11y nodes):
  - Image models group **node 11374** → 9 model cards (Marketing Studio Image,
    AI Influencer, Grok Imagine 2.0, Soul 2, Ideogram 4.0, Recraft 4.1, Soul
    Standard, Qwen Image 3, Z-Image Turbo) + 4 workflow cards.
  - Video models group **node 11640** → 14 model cards (Seedance 2.5, Genjutsu,
    Kling 3.0, MiniMax H3, Wan 3.0 Prime, Seedance 2.0, Cinema Studio 4.0,
    Wan 3.0, LTX 2.5 Fast/Pro, Grok Imagine Video 1.5, Wan 2.7, Happy Horse
    1.1/1.0) + 1 Genjutsu transfer-motion workflow card.
  - Every entry carries an `// ev:` comment citing its card nodes (link/heading/
    blurb/price/badges). Blurbs + price notes + "N modes" counts + "Higgsfield
    Exclusive" badges are verbatim evidence text.
  - Cross-check against `api-bodies-digest.json` user body per-model credit
    pools (`soul_credits`, `wan2_5_video_credits`, `qwen_camera_control_credits`,
    …) noted in the file header.
  - `catalogId` cross-reference into `MODEL_CATALOG`: only "higgsfield / Cinema
    Studio 4.0" (node 11799/11801) maps (`cinema-studio-4`).
- `src/app/explore/page.tsx` (server; metadata title from the evidence string
  'Explore models', node 10719) + `src/components/studios/explore-models.tsx`
  (client): hero, "Image models" / "Video models" sections (group names 11374 /
  11640; subtitles StaticText 11369 'Explore the latest in text-to-image
  generation' and 11635 'Turn prompts, stills and storyboards into moving
  footage'), the "Show all Image models" / "Show all Video models" toggle
  pattern (nodes 11364/11630 + paging buttons 11370-11372/11636-11638), a
  "Workflows" section (heading 12003, group 12011), vendor-grouped cards.
  Generate-able card (Cinema Studio 4.0) links to `/` with the MODEL_CATALOG
  credit cost surfaced; studio-surface models link to their clone routes
  (/marketing-studio, /ai-influencer-studio, /ads-studio); everything else is an
  inert catalog card with a visible "catalog entry only" state.

### A2. `/ads-studio` family (private, StudioGate-wrapped)

- `src/components/studios/studio-gate.tsx` — the private-route gate (see
  Disclosures #1 for the one deviation from session-gate.tsx).
- `src/app/ads-studio/page.tsx` +
  `src/components/studios/ads-studio-landing.tsx`: hero (StaticText 11858 'ADS
  STUDIO' + heading 11859 'EVERYTHING YOU NEED TO CREATE ADS THAT CONVERT',
  two lines per LineBreak 13087); "Start with tools" grid (heading 11893; tool
  cards 11895-11898 'Create performing static ads' / 'On-brand ads for every
  product at scale' / CTA 'Create ads', and 11899-11902 'Ad multiplier' /
  'Recreate ad with your products, characters' / CTA 'Try ad multiplier');
  "HOW IT WORKS" stepper (heading 11904; Previous/Next step buttons 11914/11924;
  step buttons 11916-11922) whose step-1 panel is the brand-kit section (heading
  11910 'YOUR BRAND KIT IS CREATED FROM YOUR WEBSITE' + paragraph 11913).
- `src/app/ads-studio/all/page.tsx` +
  `src/components/studios/ads-all-projects.tsx`: lists ALL folders via the
  existing folders API with a visible disclosed note — checked first: the clone
  folder model has **no surface field** (`GET /api/folders` returns id / name /
  recent_jobs_count / created_at), so no ads-surface filter is possible or
  faked. Heading 'All projects' per the studio-family evidence string
  (inspect-marketing-studio.json node 2916).
- `src/app/ads-studio/ad-multiplier/page.tsx`,
  `src/app/ads-studio/brand-research/[brandId]/page.tsx`,
  `src/app/ads-studio/b/[brandId]/page.tsx` — routed placeholders
  (`src/components/studios/tool-placeholder.tsx`) citing their
  route-preload-manifest.json keys with visible demo-scope notes; brandId
  params displayed verbatim.

### A3. `/marketing-studio` (private, StudioGate)

- `src/app/marketing-studio/page.tsx` (title from RootWebArea 2887
  'Marketing Studio • Higgsfield') +
  `src/components/studios/marketing-studio-landing.tsx`: eyebrow 2925
  'MARKETING STUDIO'; hero heading 2958 'TURN ANY PRODUCT INTO READY TO POST
  CONTENT' (lines 2959/2960); 7 category chips (buttons 2927-2953: UGC / Product
  shot / Motion / Ads / Posters / Marketplace / TikTok) as client filter state;
  composer with Generation mode tabs (5456 'Image mode' / 5461 'Video mode'),
  prompt textbox 5475 'Describe what you want to create...', Choose style
  popover with the single captured option 'Closeup' (5496), Aspect ratio button
  (5498 'Aspect ratio: 3:4'), batch 1/4 with decrease/increase (5504/5508/5509),
  Add Avatar / Add Product (5522/5532, visibly scoped), GENERATE 3.5 (5538 —
  visibly scoped) with an honest CTA into the wave-2 pipeline ("Continue in
  Cinema Studio" → `/`); 'Explore templates' region (2961) as a disclosed empty
  state.

### A4. `/ai-influencer-studio` (private, StudioGate)

- `src/app/ai-influencer-studio/page.tsx` (title from RootWebArea 1 'AI
  Influencer | Higgsfield') +
  `src/components/studios/influencer/influencer-studio.tsx` (workspace) +
  `src/components/studios/influencer/character-builder.tsx` (settings panel):
  - Workspace: Page view tabs Explore/History (304/307); hero 322 'YOUR
    INFLUENCER, YOUR VIRAL HIT' + paragraph 326 verbatim; Preset source tabs
    (329 'AI Influencers' / 333 'Higgsfield Presets' / 337 'Community Trends');
    10 preset articles in evidence order (38, 52, 35, 50, 18, 36, 41, 43, 10,
    47 — nodes 341-395) with 'View character sheet' + 'Recreate' buttons
    (visibly scoped).
  - Settings (complementary 116): 'Create your own character with' (120) +
    'AI INFLUENCER' (121); Creation mode tabs (124/126); Optional 'Upload your
    photo' (129/132, scoped); **Character type with the full captured option
    set** (group 2104: Average / Bold / Extreme / Insect / Frog / Cat / Dog /
    Rodent / Bird — the only control whose options are in evidence); the 18
    remaining controls (Gender, Build, Hairstyle, Hair Color, Style, Ethnicity,
    Age, Skin color, Height, Proportions, Head shape, Neck, Eye shape, Eye
    color, Features, Facial hair, Distinctive features, Accessories — heading
    nodes 169-289) rendered as 'Any' selects with a visible not-captured note;
    character summary panel; Randomize (deterministic, fnv1a-seeded); Generate
    with the evidence cost '1.125 credits' (node 2252) — visibly scoped, no
    fake job creation, no API calls.

### A5. Nav extension (`src/components/app-shell.tsx` — the only shared-file edit)

- Sidebar (desktop + mobile Sheet share NavLinks): "Studios" group with Ads
  Studio (Megaphone), Marketing Studio (Newspaper), AI Influencer (UserRound)
  below the core links. Entries are evidence-cited (live nav carries 'Ads
  Studio', 'Marketing Studio', 'AI Influencer' — inspect-ads-studio.json links
  11801/11815/11791; same in the influencer nav).
- Topbar: Explore link → `/explore` (Compass, active-state, aria-current).
  Evidence: 'Explore' is the first entry of the live product nav
  (inspect-ads-studio.json node 11764; inspect-ai-influencer-studio.json node
  27). `inspect-cinema-studio.json` does not exist in the survey (see
  Disclosures #8).
- The existing `link()` helper, active-state logic, prefix-matching and a11y
  conventions were preserved.

## Verification battery (all green, run at delivery time)

```
bun run lint                                        → 0 problems
bunx tsc --noEmit                                   → 0 errors
curl routes (all → 200):
  /explore /ads-studio /ads-studio/all /ads-studio/ad-multiplier
  /ads-studio/brand-research/demo-brand /ads-studio/b/demo-brand
  /marketing-studio /ai-influencer-studio
unregressed (all → 200): / /community /pricing /generate/all
SSR HTML greps (evidence headings present):
  /explore        → 'Explore models', 'Image models', 'Video models',
                    'Show all Image models', 'Show all Video models',
                    'bytedance', 'Seedance 2.5', 'Cinema Studio 4.0',
                    'Workflows', 'Product shots'
  /ads-studio     → 'HOW IT WORKS', 'ADS STUDIO', 'EVERYTHING YOU NEED',
                    'TO CREATE ADS THAT CONVERT', 'Start with tools',
                    'Create performing static ads', 'Ad multiplier',
                    'YOUR BRAND KIT IS CREATED FROM YOUR WEBSITE',
                    'Previous step', 'Next step', 'Try ad multiplier'
  /marketing-studio → 'MARKETING STUDIO', 'TURN ANY PRODUCT',
                    'INTO READY TO POST CONTENT', all 7 category chips,
                    'Image mode', 'Video mode', 'Describe what you want to
                    create', 'Closeup', 'GENERATE', 'Explore templates',
                    'Add Avatar', 'Add Product'
  /ai-influencer-studio → 'YOUR INFLUENCER', 'YOUR VIRAL HIT', all 19
                    control labels, all 9 Character type options,
                    'Randomize', '1.125 credits', 'AI Influencer 38',
                    'View character sheet', 'Recreate', 'Higgsfield
                    Presets', 'Community Trends', 'History'
  / (nav)         → href="/explore" + 'Studios', 'Ads Studio',
                    'Marketing Studio', 'AI Influencer'
TEST_BASE_URL=http://localhost:3111 bun test tests/api.test.ts tests/e2e.test.ts
                                       → 20 pass / 0 fail (19 api + 1 e2e)
dev server log                        → all new routes compiled + rendered 200,
                                          no errors attributable to this branch
```

## DISCLOSURES (every stub / clone-side invention)

1. **StudioGate renders children while the session query is loading.** The
   packet ordered SessionGate-wrapping "like /generate/all" AND SSR greps of
   evidence headings; the stock SessionGate renders a spinner during SSR which
   makes the greps impossible. `studio-gate.tsx` copies the session-gate.tsx
   sign-in card exactly but renders children during `isLoading` (the SSR
   state). Data queries in gated pages are `enabled: !!session?.user` (the
   existing studio convention), so no 401 toast storms. Signed-out visitors see
   the sign-in card after hydration.
2. **`/_private/explore` surface not captured** — the /explore page renders the
   model catalog from the platform-page capture (inspect-api.json) per the
   packet's A1 instruction. Hero title 'Explore models' comes from the evidence
   sidebar link (node 10719); the hero subtitle line is clone-side copy.
3. **Show-all toggle adaptation** — the live surface is a horizontal paged
   carousel ('Show more/previous' buttons); the clone renders vertical
   vendor-grouped grids with a Show all / Show previous toggle per section.
   Collapsed state = first 4 vendor groups (clone-side count). "Vendor-grouped
   cards" is the packet's instruction; the live cards are flat with the vendor
   prefix in the card title.
4. **Card hrefs are clone-side mappings** (live hrefs not captured — the DOM
   spec carries attribute names only, no values). Mapped only to clone surfaces
   that exist: Cinema Studio 4.0 → `/` (plain link — the studio composer takes
   NO model param today, checked; a visible page note says so), Marketing
   Studio Image → `/marketing-studio`, AI Influencer →
   `/ai-influencer-studio`, Ads Studio + Product shots / Graphic ads /
   Marketplace design workflows → `/ads-studio`. All other models: inert cards
   ("Catalog entry only — not yet wired in this clone").
5. **MODEL_CATALOG ↔ registry cross-ref is partial by evidence**: only
   cinema-studio-4 matches a registry card. `nano-banana-2` and
   `wan-2-2-animate-faceswap` have no card on the captured platform page
   (studio catalog vs platform catalog are different surfaces in the live
   product) — noted in model-registry.ts header.
6. **Ads Studio "brand-kit section"** = the HOW IT WORKS step-1 panel (evidence
   node 11910 is the only 'YOUR BRAND KIT IS CREATED FROM YOUR WEBSITE'
   occurrence); rendered once as the default step, not duplicated as a separate
   section. Steps 2-4 panel texts were not captured → visible demo-scope notes.
7. **"Create ads" CTA disabled + note** (uncaptured fnf flow). "Try ad
   multiplier" links to the real /ads-studio/ad-multiplier placeholder. The
   "All projects" header link on /ads-studio is a clone-side convenience
   (label evidence: marketing-studio node 2916). Tool-card media = deterministic
   gradient tiles (live cards autoplay videos — Video nodes 11734/11735).
8. **Explore topbar citation gap**: `inspect-cinema-studio.json` does not exist
   in the evidence survey (the packet's conditional could not be evaluated).
   The Explore nav entry is still evidence-backed via the ads-studio +
   ai-influencer nav captures (nodes 11764 / 27). The "Studios" nav GROUP
   heading is the packet-ordered clone-side layout choice (the live sidebar is
   a flat list).
9. **/ads-studio/all lists all folders** — the clone folder model has no
   ads-surface field (verified in src/app/api/folders/route.ts + Prisma schema);
   a visible disclosed note says exactly this.
10. **Marketing Studio scope**: only the 'Closeup' style option is evidence →
    the style picker carries exactly that option plus a note (no invented
    styles). The aspect-ratio button cycles the studio's supported ratios
    (3:4/16:9/1:1 — clone affordance; evidence shows 3:4 only). GENERATE 3.5 /
    Add Avatar / Add Product are visibly scoped; the honest generation CTA is
    the "Continue in Cinema Studio" link into the wave-2 pipeline. Video mode
    tab shows a disclosed not-captured panel. The 'Explore templates' region
    renders a disclosed empty state (no template cards captured).
11. **AI Influencer option sets**: ONLY Character type has a captured option
    set (group 2104). The other 18 controls render as 'Any' selects with a
    visible note — no option values were invented. Preset card tiles are
    deterministic gradients (live images are uncaptured CDN assets). 'View
    character sheet' / 'Recreate' / 'Upload your photo' / 'Motion' tab /
    'History' tab / 'Higgsfield Presets' / 'Community Trends' are all visibly
    scoped disclosed stubs. Generate shows the evidence cost (1.125 credits)
    but creates no job and calls no API.
12. **Metadata titles** are set from evidence RootWebArea names where captured
    (Ads Studio / Marketing Studio • Higgsfield / AI Influencer | Higgsfield);
    /explore's title is clone-composed around the 'Explore models' evidence
    string. Existing routes were left untouched.
13. **No new API routes, no Prisma changes, no new npm packages.** All state is
    client-side (useState); determinism law respected (fnv1a-seeded hues and
    Randomize; zero Math.random).

## Files created / modified

Created: `src/lib/model-registry.ts`; `src/app/explore/page.tsx`;
`src/app/ads-studio/page.tsx`; `src/app/ads-studio/all/page.tsx`;
`src/app/ads-studio/ad-multiplier/page.tsx`;
`src/app/ads-studio/brand-research/[brandId]/page.tsx`;
`src/app/ads-studio/b/[brandId]/page.tsx`;
`src/app/marketing-studio/page.tsx`; `src/app/ai-influencer-studio/page.tsx`;
`src/components/studios/studio-gate.tsx`;
`src/components/studios/explore-models.tsx`;
`src/components/studios/ads-studio-landing.tsx`;
`src/components/studios/ads-all-projects.tsx`;
`src/components/studios/tool-placeholder.tsx`;
`src/components/studios/marketing-studio-landing.tsx`;
`src/components/studios/influencer/influencer-studio.tsx`;
`src/components/studios/influencer/character-builder.tsx`;
`docs/wave-3a-worker-worklog.md` (this file).

Modified: `src/components/app-shell.tsx` (A5 only — Studios group + topbar
Explore, per the packet's shared-file allowance).

## Breakage outside boundary

None observed. The dev-server log shows pre-existing prisma P2025 noise from
the test suite's delete/purge race (also present at baseline; tests pass).
