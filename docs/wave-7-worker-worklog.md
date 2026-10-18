# Wave-7 worker worklog — AI Influencer functional parity (HF-W7)

Branch `hf/wave-7-influencer` · delivered 2026-10-18 · **14 worker commits**
(`30d0a90` → `836a034`, +5,589 / −259 across 41 files) + **this records worker**
(Task 83 — this worklog + the README wave-7 state section). Wave 7 was the
multi-worker wave of the program: **W7-A** (reference spec set, batch 1 — commit
`30d0ccb`), **W7-B** (backend: option library → adapter selection, commits 1–5,
plus the characters API + spec-set batch 2 written but uncommitted at its death —
the **7th deadline-eaten occurrence** in program history after waves 3A/3B/3C/5/6
and W7-A), **W7-B2** (dispatched to finish: committed the recovered characters API
+ batch-2 docs + the ops probes, commits 7–9, wrote the test battery, then ALSO
died mid-verification — the program's 8th), **W7-B3** (Task 80: the validateSpec
explicit-default fix + the battery commits, 10–11), **W7-C** (Task 81: the studio
frontend, 12–13), **W7-C2** (Task 82: the motion-stage mock-asset poster, 14), and
the station (Tasks 77–78: mission intake, live engine probes, verification, worker
re-dispatches). Station doctrine held every time: the state check found the code
complete, nothing was lost, and this worker reconstructs the delivery record; every
load-bearing claim below was re-verified against the committed code, the commit
messages and the per-task records in the shared worklog in this session.

Scope per the wave-7 dispatch (the user's functional-parity mandate): **AI
Influencer functional parity** — a real 19-setting character builder with
persistence, the two-job character-sheet pipeline (portrait + full-body at the
captured 1.125-credit cost), motion presets → wan2.2 image-to-video jobs, a
pluggable provider layer (mock / openrouter / dashscope / zai, env-gated), the
full test battery, and the studio frontend fully wired. **Doctrine shift
(disclosed):** published-spec curated options are now permitted with `spec:`
provenance tags distinct from captured evidence (`ev:`) — the wave-3A
"Any-only honest shell" is superseded for this surface by the user's mandate.
No app page was added or removed: route parity is **unchanged at 62 / 0 / 0**
(269 deferred in 14 groups) and the battery is **47 / 47** (23 api + 1 e2e +
4 hardening + **19 influencer**).

## C1 — influencer option library (commit 30d0a90)

- `src/lib/influencer-options.ts` (new, 428 lines) — the 19 settings, motion
  presets and the seeded randomizer. **Character type** is the only control whose
  option set was captured: `CHARACTER_TYPE_OPTIONS` = the 9 ev: group-2104
  buttons (nodes 142–166: Average, Bold, Extreme, Insect, Frog, Cat, Dog, Rodent,
  Bird — default "Average", the captured default state). The **other 18 settings**
  (Gender, Build, Hairstyle, Hair Color, Style, Ethnicity, Age, Skin color,
  Height, Proportions, Head shape, Neck, Eye shape, Eye color, Features, Facial
  hair, Distinctive features, Accessories) were captured as heading+collapse
  pairs only (nodes 169–289) — their option sets live in closed dropdowns in the
  live app, so each ships a **`spec:` curated list of 4–10 human-plausible
  options** plus the documented unset value **"Any"** (the live app's unset
  affordance).
- `INFLUENCER_SETTINGS` (19 entries in panel order, each with the ev: heading
  label, options, default) · `SettingKey` union (the snake_case API payload
  names) · `defaultSpec()` · `validateSpec()` (unknown keys AND unknown values →
  clear 400 messages; missing keys fall back to defaults) · `randomizeSpec(seed)`
  — determinism law: all variation derives from `fnv1a → mulberry32`
  (`src/lib/seeded-rng.ts`), no `Math.random`; the curated 18 roll options ∪
  "Any", Character type always rolls the 9 ev: options.
- `MOTION_PRESETS` — 8 curated presets (confident walk, head-turn smile, dance
  groove, wave greeting, fashion pose, hair flip, product showcase, cinematic
  slow-motion turn), each `{id, label, prompt}` + `findMotionPreset()`. Hero copy
  ev: 322/326 confirms presets exist; the reference list itself was NOT captured
  (spec: — see DISCLOSURE 2).

## C2 — schema: Character model + Float credit columns (commit 3093d40)

- `prisma/schema.prisma` (+53/−5). New **`Character`** model: `id` cuid, `userId`
  (cascade delete), `name`, `spec` (JSON-in-a-TEXT-column — the repo convention
  that predates wave 6), `referenceImage` String?, timestamps, `@@index([userId])`.
  No asset columns by design: portrait/full-body assets resolve through the
  linked done Generation rows so the job pipeline stays the single asset truth.
- **`Generation.characterId`** — additive nullable column, deliberately NO FK:
  hard-deleting a character leaves its generations in place with a dangling id
  (`jobToJson` unaffected; asset resolution treats dangling as "no character");
  `@@index([characterId])`.
- **Credit amount columns widened Int → Float** on `Generation.cost`,
  `CreditPool.balance`, `CreditLedger.delta`, `CreditLedger.balanceAfter`,
  `FreeGensGrant.used` (`FreeGensGrant.amount` stays Int — grants are only ever
  integral). Rationale (schema block comment): the captured evidence cost is
  **1.125 credits per generate (ev: node 2252)**, split as two 0.5625-cost jobs —
  values Int cannot represent, and Prisma **silently truncates 0.5625 to 0** on
  an Int field (empirically verified by `scripts/ops/probe-int.ts`, C9). The
  widening is **lossless**: every existing value is integral and stays bit-exact
  in float64, so all existing integer assertions hold unchanged; `db push`
  applies it as ALTER COLUMN TYPE. Mirrors the live product, whose credit costs
  are demonstrably fractional.
- Applied to the live Neon DB **additively** (the DB also backs the Vercel
  deployment — the Task 77-78 additive-only discipline), through
  `scripts/neon-sandbox-run.sh` with the vaulted direct URL.

## C3 — deterministic spec→prompt builder (commit 8f61d9b)

- `src/server/influencer/prompt.ts` (new, 99 lines) — pure string functions over
  the option-library spec (no I/O, no randomness). `PHRASE_BUILDERS` maps each of
  the 19 settings to a phrase template; `describeCharacter()` joins every
  non-"Any" setting's phrase in canonical panel order. `buildPortraitPrompt()`
  ("Close-up portrait photograph of a …") and `buildFullBodyPrompt()` ("Full-body
  photograph … standing composition with the whole figure visible head to toe")
  add the photographic suffix (spec: clone-side phrasing — the live product's
  influencer prompts were NOT captured).
- `buildMotionPrompt()` = the preset's action prompt + the **identity-continuity
  clause** ("The same person as in the provided image, consistent identity and
  outfit") + the outfit re-described from the spec (`outfitClause`).
- Determinism law: the prompt is **pre-rendered at POST time and stored on the
  Generation row**; the influencer adapter reads the stored prompt verbatim, so
  worker retries render identically.

## C4 — provider layer: contracts + 4 engines, env-gated (commit a5f7999)

- 6 new files under `src/server/influencer/` (679 insertions), encoding the
  Task 77–78 live-probe facts (all numbers measured, banked in
  `docs/ai-influencer/*_BENCHMARK.md`).
- **`types.ts`** — the contracts: `InfluencerImageProvider`
  (`generatePortrait` / `generateFullBody`), `InfluencerMotionProvider`
  (`animate`), `InfluencerAsset`, `InfluencerProviderError` carrying an explicit
  `retryable` classification. `retryableForStatus()`: 402/403 (billing /
  region-gate / forbidden) and 400/401/404/422 (malformed / auth-config) →
  **non-retryable**; 429/5xx/anything-else → retryable. Providers THROW; the
  adapter maps onto the worker's `AdapterResult` so the proven CAS/retry/
  terminal machinery works unchanged.
- **`mock-provider.ts`** — deterministic, tests/demo only: resolves after
  `MOCK_ADAPTER_MS` (default 1200) with ±20% seeded jitter from `req.seed`, and
  returns a tiny valid SVG data URI visibly labeled **"hf-mock
  portrait|fullbody|motion" + the seed** so determinism is assertable.
- **`openrouter-provider.ts`** — the Vercel-prod image engine: POST
  `openrouter.ai/api/v1/chat/completions` with an image-output chat model
  (default `google/gemini-2.5-flash-image`, `HF_OPENROUTER_IMAGE_MODEL`), image
  at `choices[0].message.images[0].image_url.url` (data:…base64), reference image
  prepended as a multimodal input with an explicit identity clause. The sandbox's
  403 "not available in your region" geo-gate maps to a clean **non-retryable**
  error, never a crash.
- **`dashscope-provider.ts`** — the motion engine: **intl** base hardcoded
  (`dashscope-intl.aliyuncs.com`; the China endpoint rejects this key class),
  submit `POST /api/v1/services/aigc/video-generation/video-synthesis` with
  header **`X-DashScope-Async: enable`**, poll `GET /api/v1/tasks/{id}` every 3 s
  (FAILED → non-retryable; 10-minute overall timeout → retryable), default model
  `wan2.2-i2v-flash` (`HF_DASHSCOPE_VIDEO_MODEL`), size from the probe-verified
  whitelist (default `832*480`, landscape, matching the 16:9 job aspect — the
  job row itself records the clone-side 1200×672 §1a-style dimensions).
- **`zai-provider.ts`** — the sandbox/local engine for BOTH image and video:
  `z-ai-web-dev-sdk` is imported **dynamically inside the call paths** so merely
  importing the factory never pulls the SDK into a serverless bundle and a
  missing ambient config surfaces as a clean classified error. Ambient
  `/etc/.z-ai-config` machine auth; sandbox-only (private-IP baseUrl).
- **`index.ts`** — the env-gated factory: `HF_IMAGE_PROVIDER = mock |
  openrouter | zai`, `HF_VIDEO_PROVIDER = mock | dashscope | zai`, **both
  default mock** so the battery stays deterministic. A non-mock selection
  without its required key **falls back to mock with a `[f-influencer]` warn** —
  deployments can run image-only or video-only real engines (disclosed
  clone-side choice over hard-failing the whole studio — see DISCLOSURE 10).

## C5 — worker adapter selection per jobSetType (commit 6a5cd5f)

- `src/server/adapters/influencer-adapter.ts` (new, 96 lines) +
  `src/server/worker.ts` (+25/−5). The worker's static single-adapter map became
  **`adapterForJob(job)`**: the three influencer jobSetTypes
  (`influencer_portrait`, `influencer_fullbody`, `influencer_motion`) route to
  `influencerAdapter`; every other jobSetType keeps the proven `mockAdapter`.
  Both implement the same `ModelAdapter` contract, so the CAS/retry/terminal
  machinery below the selection is untouched (wave-4/5 laws preserved).
- The adapter reads everything from the job row (the dispatch contract):
  pre-rendered `prompt`, `inputImages[0]` as the identity reference (uploaded
  face ref for sheet jobs, the character's done portrait asset for motion),
  `seed` for mock determinism. `InfluencerProviderError.retryable` maps onto
  `AdapterResult`; an unexpected crash is treated as **non-retryable** (the same
  request would crash identically — retrying would only churn the paid slot);
  a motion job without a reference portrait is a non-retryable contract
  violation.

## C6 — reference spec set, batch 1 (commit 30d0ccb)

- `docs/ai-influencer/` — 9 files, 696 insertions: **README, REFERENCE_SCOPE,
  FEATURE_INVENTORY, BEHAVIOR_SPEC, STATE_TRANSITIONS,
  REVERSE_ENGINEERING_EVIDENCE, API_CONTRACTS, ACCEPTANCE_CRITERIA,
  OPEN_QUESTIONS**. This is the W7-A deliverable (the `docs(w7a)` tag): the
  reference-surface analysis, the evidence index (what the REA capture actually
  holds for this surface — 813 a11y nodes, the 19 settings headings, the hero
  copy, the 1.125-credit generic), the parity matrix, the behavior/state
  specifications the implementation then followed, the clone-side API contracts
  (explicitly marked as contracts, NOT recovered reference APIs), the G1–G8
  acceptance gate, and the open-questions register.

## C7 — characters API: CRUD + atomic pipelines (commit 4014dd0)

- 5 files, 810 insertions — W7-B's uncommitted work, committed by W7-B2 after the
  station's state check found it code-complete (tsc 0 / eslint 0).
- **`/api/characters`** — GET list (owner-scoped, asset-resolved) + POST create:
  strict zod `{name?, spec}` (unknown top-level fields → 400), `name` defaults
  to "Influencer" (spec: — not a captured control), spec validated by
  `validateSpec`, H3 limiter on the mutating POST (wave-4 semantics — attempts
  count).
- **`/api/characters/[id]`** — GET detail `{character, jobs}` (linked
  generations newest-first; calls `ensureWorker()` so client polling of this
  route advances the queue — the serverless thaw law, same as
  `/api/jobs/accessible`) + PATCH `{name?, spec?, reference_image?}` (spec
  fully re-validated; reference must be a `data:image/…` URI under the **~4MB
  decoded cap** — prefix + base64 charset + decoded-size checks; explicit null
  clears) + DELETE (hard delete; generations keep their dangling characterId).
- **`/api/characters/[id]/generate`** — the two-job character-sheet pipeline:
  honest pre-check → terminal **402 `{detail, needed: 1.125, available}`** where
  availability is the **union across both jobSetTypes** (their grants/model
  pools differ; daily/wallet are shared, hence the subtract-shared
  `unionAvailableCredits`); then ONE interactive transaction creating BOTH jobs
  (portrait 1:1 1024×1024, full-body 2:3 896×1344, each `cost: 0.5625`) with
  their `spendCredits` calls — if the second spend fails the whole transaction
  rolls back: **no jobs, no burn**. Prompts pre-rendered
  (`buildPortraitPrompt` / `buildFullBodyPrompt`), seeds
  `fnv1a(character.id + updatedAt + role)` (re-generating after a spec edit
  rolls fresh seeds), reference image rides in `input_images`, response
  `{jobs: [portrait, full-body]}`.
- **`/api/characters/[id]/motion`** — the video pipeline: **portrait-preconditioned**
  (no done portrait → 400, telling the client to generate the sheet first — the
  portrait is the i2v identity input), strict `{preset_id}` body, **5-credit burn
  atomic with job creation** (same §1a law; 402 shape identical), model_version
  `wan2.2-i2v-flash`, 16:9 1200×672, prompt `buildMotionPrompt(preset, spec)`,
  seed `fnv1a(character.id + updatedAt + preset.id)`, `ensureWorker()` after the
  burn.
- **`src/lib/character-shape.ts`** — the snake_case `CharacterJson` mapper, the
  shared constants (`INFLUENCER_GENERATE_COST_TOTAL = 1.125` ev: node 2252,
  `INFLUENCER_SHEET_COST = 0.5625` spec:, `INFLUENCER_MOTION_COST = 5` spec:,
  aspect/size mappings), `resolveCharacterAssets` (latest done portrait /
  full-body per character through the characterId index — dangling ids resolve
  to null) and `parseSpecJson` (defensive; stale rows fall back to defaults).

## C8 — reference spec set, batch 2 (commit 52b4a40)

- 9 more files in `docs/ai-influencer/`, 749 insertions: **ARCHITECTURE,
  ARCHITECTURE_DECISIONS** (the ADRs — provider seam, Float widening, no-FK
  characterId, prompt pre-rendering), **IDENTITY_EVALUATION** (the evaluation
  protocol; all scores honestly null — no eval infrastructure in wave 7),
  **IMAGE_ROUTE_BENCHMARK + VIDEO_ROUTE_BENCHMARK** (the Task 77–78 measured
  engine facts: every number live-measured or explicit null), **KNOWN_LIMITATIONS,
  LICENSE_REVIEW** (license separation), **OPEN_SOURCE_CATALOG +
  research-catalog.csv**. Also W7-B's uncommitted work, committed by W7-B2.

## C9 — ops probes (commit 26f5bd3)

- `scripts/ops/probe-int.ts` — the **pre-widening Int-column probe** (its `as
  never` cast forces `cost: 0.5625` past the still-Int generated client types):
  the empirical evidence behind C2's widening. Minor wording discrepancy banked:
  the commit title summarizes it as "Int-rejection" while the schema comment
  records "silently truncates 0.5625 to 0" — either way 0.5625 does not survive
  an Int column, which is the fact that motivated the Float widening.
- `scripts/ops/probe-float.ts` — the **Float roundtrip verification** (run against
  the widened schema — it already writes `characterId`, a C2 column): `cost
  0.5625` roundtrips exact, wallet `930 − 0.5625 → 929.4375` exact, restore
  exact.
- `scripts/ops/zai-video-probe.mjs` — the zai SDK image-to-video probe
  (`video.generations.create` + `async.result.query` poll), banked from the
  Task 77–78 engine matrix.

## C10 — validateSpec explicit-default fix (commit da9787d)

- `src/lib/influencer-options.ts` (+10/−2). **This was a REAL product bug the
  station's verification exposed** (the 12/14 run's two failures): `validateSpec`
  rejected explicit default values — an explicit `"Any"` for any curated setting
  returned 400, **violating the function's own docstring contract** ("curated
  settings accept 'Any' or one of their spec: options"), which meant
  `defaultSpec()` / `randomizeSpec()` output — the Randomize button's exact
  payload — could not round-trip through POST/PATCH.
- W7-B3's fix: the allowed set is **options ∪ {default}** via a two-branch
  ternary (Character type's default "Average" already sits in its options —
  behavior byte-identical there). The 400 message now lists the full allowed set
  (`allowed.join(", ")`), so curated settings' errors read "allowed: Any,
  Female, Male, …". Recorded deviation from the task sketch: its
  `|| setting.default === value` clause was traced as a logic bug (gender +
  value="Any" collapsed the allowed set back to options-only) and dropped — the
  committed ternary implements the sketch's own stated intent.

## C11 — the influencer test battery (commit cb5112f)

- `tests/influencer.test.ts` (new, 505 lines, 14 tests) + `scripts/verify.mjs`
  battery registration (`FILES` array + header docs — the fourth sequential test
  file, keeping the wave-6 sequential/30 s-timeout discipline). W7-B2 wrote the
  battery; it sat untracked through that worker's death; W7-B3 committed it
  (Task 80).
- Coverage (all mock-provider, per the test header's own disclosure): characters
  CRUD (9 tests — full-valid-19-key-spec create with snake_case echo, bare body
  → default name + default spec, unknown key/value → 400, strict body shape,
  owner-scoped list + cross-user 404, PATCH full-replace + revalidation,
  reference_image prefix/size/null validation, DELETE → 404), the generate
  pipeline (2 — `{jobs:[2]}` shapes with deterministic prompts and the exact
  1.125 burn reaching done through the character-detail poll route; 402 with
  full atomicity: no rows, no burn), the motion pipeline (3 — sheet-first
  precondition 400; after a done sheet: video job, wan2.2-i2v-flash, portrait as
  input_images[0], exact 5-credit burn, done; unknown preset_id / camelCase
  body → 400).

## C12 — the influencer studio frontend (commit 833606e)

- `character-builder.tsx` (231 → 349 lines) + `influencer-studio.tsx`
  (233 → 1,050 lines); 1,163 insertions / 246 deletions. W7-C (Task 81) rewrote
  the wave-3A honest shell into the real surface, preserving every evidence
  citation (headers carry the full ev:/spec: provenance).
- **The builder**: 19 controlled settings from `INFLUENCER_SETTINGS` (Character
  type as the ev: pill group; the 18 curated as Selects with "Any" + their
  options — demo-scope notes removed from the controls, one spec: provenance
  line kept in the header comment); name field; real **"Upload your photo"**
  (ev: 129/132) — hidden file input → FileReader → data:image URI preview +
  remove, >4MB client-side rejection with toast, one-line uncaptured-flow
  disclosure; **Randomize** (ev: 295) = `randomizeSpec(tick)` full-spec
  deterministic roll; **Generate** (ev: 297) with the ev: 1.125-credit badge,
  disabled in flight.
- **The studio shell**: creation-mode tabs (ev: tablist 2078 Create Influencer /
  Motion); preset-source filters (ev: tablist 329/333/337 — "AI Influencers"
  lists the user's own character library via GET /api/characters with portrait
  thumb / select / delete-confirm; Higgsfield Presets + Community Trends render
  honest "not captured" one-liners); character sheet (portrait 1:1 + full-body
  2:3 from the detail route, skeletons while queued/processing, failed → retry
  re-POST); Motion tab = MOTION_PRESETS gradient tiles → POST motion (5 credits)
  → 16:9 video stage + portrait-precondition empty state; History tab (ev:
  tablist 303) = the active character's linked jobs newest-first with status
  badges; wallet chip (`useWallet` — burns reflect live via query
  invalidation); character-detail polling following the use-jobs law (2 s
  interval, 1.15^n backoff cap 10 s, stop when no queued/processing jobs) on
  GET /api/characters/{id}; sr-only aria-live status; AlertDialog delete
  confirm; 402 → toast with needed/available + UpgradeModal.
- Disclosed generate sequence: POST /api/characters accepts `{name?, spec}`
  STRICT — the reference image rides in through the follow-up PATCH
  (create → PATCH spec+reference → POST generate; existing character → PATCH +
  generate).

## C13 — E2E battery extension (commit 754dad1)

- `tests/influencer.test.ts` +195 lines, describe("studio E2E (W7-C)") — 5 more
  tests (19 total): the Generate button's payload law (randomizeSpec output
  POSTs + PATCHes cleanly — 19-key echo, full replace); the upload flow (create
  → PATCH reference → generate; the reference rides into BOTH jobs'
  input_images); the sheet flow (portrait/full_body asset URLs resolve in BOTH
  the detail route and the library route, decoded mock-provider shape markers
  "hf-mock portrait/fullbody"); the motion flow after a done sheet (video job
  done, hf-mock motion asset, exact wallet **20 − 1.125 − 5 = 13.875**); DELETE
  → library empty.

## C14 — motion-stage mock-asset poster (commit 836a034)

- `influencer-studio.tsx` (+28/−10), W7-C2 (Task 82), from the station's browser
  finding: the mock provider resolves `kind:"video"` jobs to an SVG data URI,
  which `<video>` cannot play (the native "Unable to play media" UI). The
  done-branch now renders `data:image/` assets as a **labeled poster `<img>`**
  (same absolute-fill geometry, one-line caption bar "spec: mock provider asset
  — production (DashScope wan2.2) renders a real MP4 video"); every other source
  (http(s)…mp4, data:video/…) keeps the exact original `<video controls
  autoplay loop muted playsInline>` element. Figure/aria/figcaption structure
  byte-identical; no other component touched.

## Station verification record

- **Worker history (the deadline-eaten chain).** W7-A (spec-set batch 1) and
  W7-B (option library → adapter selection, commits 1–5) both died on context
  deadlines — W7-B AFTER also writing the characters API + batch-2 docs
  uncommitted (**7th deadline-eaten occurrence**; waves 3A/3B/3C/5/6 + W7-A
  before it). The station's state check found the tree **code complete (tsc 0 /
  eslint 0)**; W7-B2 was dispatched to finish — committed the recovered work +
  the ops probes (7–9) and wrote the battery, then **ALSO died mid-verification**
  (the program's 8th). The station completed the verification itself:
  **12/14 pass**, and the 2 failures exposed the REAL product bug of C10
  (validateSpec rejected explicit "Any" values — randomizeSpec/defaultSpec
  output couldn't round-trip). W7-B3 (Task 80) fixed it (commit 10) and
  committed the battery (11) → **14/14**. W7-C (Task 81) built the frontend
  (12–13) → **19/19**. W7-C2 (Task 82) polished the motion stage (14).
- **The :3111 stale-worker incident.** The stale wave-6 standalone prod server
  (pid 24512, port 3111) shared the Neon DB, and its OLD worker — which routes
  EVERY job through the generic mockAdapter (fixture vocabulary
  `/fixtures/gen-N.png`, `mock-adapter.ts:66-69`) — **won CAS claims on
  freshly-queued influencer jobs**, resolving them to fixture-path assets
  instead of the influencer mock SVGs. First surfaced in Task 80's post-fix run
  (13/14) and Task 81's first E2E run (16/19); both workers neutralized it for
  their runs with the SIGSTOP-freeze / SIGCONT-resume workaround (no kill —
  :3111 was the station's standing deployment-check server). The station killed
  24512 before its own verify pass. **Lesson banked: long-lived old-code servers
  on a shared DB steal jobs from new-code servers — CAS claims have no
  code-version awareness.**
- **Station verify** (branch tip, after 836a034): `bun scripts/verify.mjs`
  against Neon — **PASS 5/5: lint 0 · tsc 0 · build exit 0 · route-parity
  62 / 0 / 0 · battery 47 pass / 0 fail** (23 api + 1 e2e + 4 hardening + 19
  influencer — file counts re-verified in this records session: 23/1/4/19).
- **Station browser golden path** (agent-browser on :3113): the studio renders
  all 19 controls live; Randomize rolls a full spec; Generate burns **1.125 →
  wallet 930 → 928.875 EXACT**; the portrait+full-body sheet renders (mock SVG
  fixtures); the Motion tab lists the presets; Animate burns **5 → 928.875 →
  923.875 EXACT**; the motion job reaches done and the video stage renders the
  mock poster with its spec: caption; **zero page errors** (only the
  pre-existing benign dev-mode React list-key warning, documented since
  Task 65).
- **Engine facts** (Task 77–78 probes, documented in
  `docs/ai-influencer/IMAGE_ROUTE_BENCHMARK.md` + `VIDEO_ROUTE_BENCHMARK.md`):
  DashScope intl wan2.2 5 s clips ≈ **30–43 s wall** (real MP4s measured:
  t2v-plus 30 s, i2v-flash 43 s); **zai SDK image 63 s** (63,228 ms, real
  JPEG); **OpenRouter image models 403 geo-gated FROM THE SANDBOX** (all 12
  image-output models — Vercel us-east-1 egress expected fine, **to verify
  post-deploy**); **z-ai-web-dev-sdk is sandbox-only** (private-IP baseUrl,
  ambient machine auth).

## Records phase (this worker, Task 83)

- Wrote this worklog (per-commit record for all 14 commits, the station
  verification record, the disclosures) and appended the README **Wave 7 — AI
  Influencer** state section, following the wave-5/wave-6 records pattern.
- Re-verified in this session, against the committed tree: the 14-commit
  diffstat (+5,589/−259, 41 files), the option library's 19 settings + ev/spec
  provenance tags, the schema's widened columns + Character model, the provider
  factory's env gates + defaults, the worker's per-jobSetType adapter
  selection, the characters API's union pre-check + atomic transaction + motion
  precondition (read in full), the validateSpec fix, the battery's 19 test
  names + its header disclosures, the verify.mjs registration diff, the
  frontend's evidence-citation headers + the poster fallback, the benchmark
  docs' measured numbers, and the per-file test counts (23/1/4/19 = 47).
- No source, schema, seed, script, test or config file was touched by this
  worker — documentation only. `dev-3111.log` / `prod-3111.log` /
  `next-env.d.ts` left untracked (never-commit files).

## DISCLOSURES

1. **The 18 curated option lists are `spec:`** — only Character type's 9 options
   are ev: (group 2104, nodes 142–166). The other 18 settings were captured as
   heading+collapse pairs only; their option sets live in closed dropdowns in
   the live app and are curated here under the wave-7 published-spec doctrine
   (the user's functional-parity mandate superseding the wave-3A Any-only
   honest shell for this surface). Every option list carries the tag at its
   definition site in `src/lib/influencer-options.ts`.
2. **The motion preset library and the 5-credit motion cost are `spec:`** — the
   hero copy (ev: 322/326) confirms presets exist and the credit badge 2252
   gives the sheet cost only; the reference preset list and motion pricing were
   never captured. 8 presets curated; `INFLUENCER_MOTION_COST = 5` marked
   spec: in `character-shape.ts`.
3. **The reference-upload flow is `spec:`** — ev: 129 "Optional" + 132 "Upload
   your photo" are the captured affordances; the flow itself (client FileReader
   → data:image URI, ~4MB decoded cap enforced on BOTH sides, the
   POST-then-PATCH sequence that carries the image into job input_images) is
   clone-side, disclosed in the builder header + the PATCH route.
4. **The name field is `spec:`** — a backend `{name?}` affordance (default
   "Influencer", 1–80 chars); not a captured control.
5. **The fractional credit cost 1.125 is ev: (node 2252); the 0.5625 split is
   `spec:`** — the evidence gives one number for the Generate action; the
   two-job split (and every other sheet constant: aspects, sizes,
   model_versions) is clone-side, tagged in `character-shape.ts`.
6. **The Int→Float widening rationale and scope** — five credit amount columns
   widened (`Generation.cost`, `CreditPool.balance`, `CreditLedger.delta`,
   `CreditLedger.balanceAfter`, `FreeGensGrant.used`; `FreeGensGrant.amount`
   deliberately stays Int). The widening exists because Prisma silently
   truncates 0.5625 on Int columns (probe-verified, `scripts/ops/probe-int.ts`)
   and is lossless (all prior values integral → bit-exact in float64; existing
   integer assertions unchanged). Mirrors the live product's fractional costs.
   Applied as ALTER COLUMN TYPE via additive-only `db push` on the shared Neon
   DB.
7. **Identity consistency is prompt-level only** — the identity-continuity
   clause in the motion prompt + the reference image riding `input_images` +
   the openrouter/zai identity-conditioned image calls. There is **no VACE
   engine** (`wanx2.1-vace` / `wan2.2-animate` are NOT on the DashScope intl
   gateway — probe-verified), so character replacement is
   disclosed-unavailable and pose-replication fidelity is bounded by
   i2v-flash quality. `IDENTITY_EVALUATION.md`'s scores are all honestly null —
   no eval infrastructure shipped in wave 7.
8. **The H3 rate limiter is untested-over-HTTP in this battery** — the
   influencer test header discloses it: a fixed 60 s window is not
   deterministically pinnable over HTTP; wave-4's hardening tests own limiter
   semantics. The limiter IS wired on all three mutating character routes
   (POST /api/characters, generate, motion) with the same 30/min default.
9. **Real-provider tests are absent by design** — the battery runs mock
   providers (the env-gated factory's default) so it stays deterministic and
   never touches a paid API. Real-engine evidence lives in the scripts/ops
   probes and the two benchmark docs, not in tests.
10. **Provider env gates default to mock, and a missing key degrades to mock
    with a warn** — `HF_IMAGE_PROVIDER` / `HF_VIDEO_PROVIDER` (mock |
    openrouter | zai / mock | dashscope | zai). A deployment that selects a
    real engine without its key silently runs that pipeline on mock (the
    `[f-influencer]` console.warn is the tell) — a disclosed clone-side choice
    over hard-failing the studio; supports image-only/video-only real-engine
    splits.
11. **The 291-route deferred backlog is unchanged** — parity stays **62 / 0 / 0
    with 269 routes deferred in 14 groups**; wave 7 added no app pages (the
    /api/characters* API routes are API surface, not page-parity entries).
    `/ai-influencer-studio` itself was already implemented in wave 3A.
12. **Zero TL product-code commits** — the station's wave-7 work was
    verification, worker dispatch, and the live engine probes only; the
    dead-worker commit completions were worker-dispatched (W7-B3), and this
    records commit is documentation-only. Unlike wave 6 there was not even a
    station acceptance-infra commit — the wave-6 verification mechanics
    (sequential battery, eslint ignores) carried over unmodified.
13. **The stale-:3111 contamination hazard is banked** — a long-lived old-code
    server on the shared Neon DB steals queued jobs from new-code servers
    (CAS claims have no code-version awareness). It produced fixture-path
    assets (`/fixtures/gen-N.png`) on influencer jobs in two worker battery
    runs before the station killed pid 24512. Any future shared-DB battery run
    must ensure no old-code server is live.
14. **The frontend's clone-side placements are disclosed in its headers** —
    creation-mode tabs render workspace-level (ev: tablist 2078 exists, but the
    live DOM nests the tabs in the settings panel; the Motion tab here is a
    workspace view); the preset-article gallery slot (ev: 341–395) is taken by
    the user's own character library; polling follows the use-jobs law but
    polls the character detail route (the thaw route).
15. **The mock motion "video" is an SVG data URI, not a playable MP4** — by
    design (deterministic tests); the motion stage renders it as a labeled
    poster (C14) and production DashScope MP4s keep the `<video>` element.
    Related production caveat, disclosed in KNOWN_LIMITATIONS.md /
    OPEN_QUESTIONS Q4: DashScope output URLs are OSS-signed with ~24 h expiry —
    long-term asset persistence (copying assets into our own storage) is an
    open question, not implemented.
16. **`docs/DEPLOYMENT.md`'s env-var table predates wave 7** — it carries the
    wave-6 set (DATABASE_URL, HF_AUTH_SECRET, MOCK_*, JOBS_RATE_LIMIT_PER_MIN)
    and does not yet list `HF_IMAGE_PROVIDER` / `HF_VIDEO_PROVIDER` /
    `OPENROUTER_API_KEY` / `DASHSCOPE_API_KEY`. This records worker's
    documentation-only mandate covers only this worklog + the README, so the
    runbook was NOT amended; the provider env-gate notes live here (C4 +
    DISCLOSURE 10) and in `docs/ai-influencer/API_CONTRACTS.md` §7. **Flagged
    for the station's deploy-env step**: set the two provider vars + keys on
    Vercel when the real engines are wanted (default stays mock otherwise).
17. **The OpenRouter image route is geo-gated from THIS sandbox's egress only**
    — all 12 image-output models 403 "not available in your region" from the
    sandbox; Vercel us-east-1 egress is expected to pass. Verification is
    explicitly pending post-deploy (IMAGE_ROUTE_BENCHMARK.md "Not yet
    measured" list).
18. **No push, no merge** — branch `hf/wave-7-influencer` left at this docs
    commit for station certification and merge (commits `30d0a90` → `3093d40`
    → `8f61d9b` → `a5f7999` → `6a5cd5f` → `30d0ccb` → `4014dd0` → `52b4a40` →
    `26f5bd3` → `da9787d` → `cb5112f` → `833606e` → `754dad1` → `836a034` +
    this records/docs commit). This records worker wrote documentation only.
