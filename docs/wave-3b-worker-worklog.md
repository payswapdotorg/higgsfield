# HF wave-3B worker worklog — creative tools family + community originals decision

> Reconstructed by worker 56 from git history + station verification record
> after worker 55's session deadline; code facts cited from commits,
> verification facts from the station log.

Worker: 55 (wave-3b-worker, full-stack-developer). Branch: `hf/wave-3b-tools`
(from `main` @ e9c78e1). Order: HF-WAVE3-PACKET.md sub-order 3B (creative
tools family). Six commits, a94ccf9 → 7b2e000 (2026-10-17 16:07:19–16:14:31Z),
each one module. The session hit its deadline after the final commit but
BEFORE the delivery records were written — this worklog and the station-log
append were reconstructed post-hoc by worker 56 (doc-gap closure): every code
fact below was re-verified against the tree at 7b2e000 (including re-parsing
the evidence JSONs); verification facts come from the station's record. All
file writes during reconstruction went through the Write/Edit tools
(FILE-TOOL LAW §10b respected).

Branch topology note: the station verified the branch and merged it to main
as a fast-forward (main = hf/wave-3b-tools = 7b2e000) and pushed
(origin/main @ 7b2e000) — worker 55 made no push / no self-merge / no ref
changes outside the branch, per the worker laws.

## Modules delivered

### B1. `/effects` — public catalog + detail pages (a94ccf9)

- `src/lib/effects-catalog.ts` (482 lines) — `EFFECTS_CATALOG`: **45 unique
  named effects** extracted from `inspect-effects.json` (1235 a11y nodes; root
  'Higgsfield Visual Effects — AI Video Effects | Higgsfield'). Header policy
  comment cites: hero heading 19992 'VISUAL EFFECTS' (StaticText 19993);
  quick-nav 19994 'Effects' with ' new' badges on 7 entries (AGAMEMNON 20041,
  FALLEN ANGEL 20046, BULLET TIME 20049, CYCLOPE 20054, PIGEONS 20077,
  PEARL EARRING 20086, SKATEDOG 20093); region 20102 'VFX gallery' → list
  21767 → 50 figure cards in document order. Each live card = 'View {Name}'
  link + '{NAME}' heading + 'Generate' link (e.g. FLOATING FALL: 20105/20106/
  20108). **5 names repeat in the live gallery** (FLOATING FALL 20106/20370,
  CUTOUT, EYES IN, VANISH, INFINITE CLONES) → the catalog keeps ONE entry per
  unique name in first-occurrence order and records every gallery occurrence
  node id in `occurrences`. No per-effect description/blurb/media/href values
  were captured (stated in the header). `EffectEntry` = slug (deterministic
  kebab-case) / name / viewLabel / isNew / occurrences / headingNodeId /
  viewNodeId; `NEW_EFFECTS` filter; `effectHue()` — fnv1a-seeded hue, same
  algorithm as model-registry `modelHue` (no Math.random).
- `src/app/effects/page.tsx` — PUBLIC (no gate; `/(public)/effects` manifest
  family). Hero 'VISUAL EFFECTS' verbatim; the quick-nav rendered as an
  in-page anchor strip (one anchor per unique effect, 'new' badges); a single
  'VFX gallery' section — **no category grouping fabricated** (the capture has
  one flat list); header counter '50 gallery cards · 45 unique effects';
  deterministic gradient tiles; every card links to `/effects/[slug]`.
- `src/app/effects/[slug]/page.tsx` — `generateStaticParams` over the catalog;
  `generateMetadata` per effect; **`notFound()` for unknown slugs**;
  `{effect.viewLabel}` + occurrences note ('Appears 2× in the live VFX
  gallery (figures …)') + 'new' badge; the honest CTA is **'Try in Cinema
  Studio' → `/`** (the wave-2 generation pipeline) honoring the live
  'Generate' affordance; a visibly disclosed demo-scope card (no effect-detail
  surface captured — no description/preview/parameter set invented; the
  effect-application pipeline is not implemented); prev/next catalog nav in
  evidence gallery order.

### B2. `/canvas` family (f31ae1f)

- `src/app/canvas/page.tsx` (StudioGate private) — from `inspect-canvas.json`
  (354 a11y nodes): eyebrow 22491 'HIGGSFIELD CANVAS'; hero heading 22492
  'GENERATE STUNNING MEDIA WITH AI CANVAS' (lines 22493/22494); hero
  paragraphs 22496 'No Boards' + 22498 'Make images, videos, and ideas in one
  place'; button 22500 'Create Canvas' — the canvas-creation flow was NOT
  captured → **disabled + visible scope note + honest 'Continue in Cinema
  Studio' CTA**; the captured canvas-board example text 22487 rendered as a
  verbatim quote block; 'Explore canvas templates' (StaticText 22503) with the
  5 template buttons 23713/23721/23729/23737/23745 (Long Video Example, Simple
  Seedance 2.0, Extend Video, Image Edit, StoryBoard With Elements — names
  verbatim, clone-side slugs) linking to the routed placeholders;
  deterministic tiles (index-based, no Math.random).
- `src/app/canvas/[id]/page.tsx` — routed workspace **shell** (manifest key
  `/_private/canvas/$id`): guard `id === "templates"` → `notFound()` (reserved
  segment); canvas id displayed verbatim; inert deterministic 6-tile board
  preview (hues from `effectHue('canvas-' + id)`); disclosed demo-scope card —
  the workspace surface was not captured (inspect-canvas.json covers the
  landing only), so NO board tools / media layers / collaboration are
  implemented or simulated; Cinema Studio CTA.
- `src/app/canvas/templates/[templateId]/page.tsx` — routed placeholder
  (manifest key `/_private/canvas/templates/$templateId`): `TEMPLATE_IDS`
  maps the 5 captured template slugs → verbatim names + view node ids;
  **unknown template ids render the generic placeholder with the id verbatim**
  (the route exists in the live manifest, so no 404 — only the empty param
  404s); disclosed note either way ('including this template's card' vs 'but
  not a template with this id').
- `src/app/canvas/[id]/embed/page.tsx` — routed embed placeholder (manifest
  key `/_private/canvas/$id/embed`): deliberately sparse standalone-centered
  disclosure (embeds render standalone); id verbatim; link to the workspace
  shell; guards empty id / 'templates' → `notFound()`.

### B3. `/edit` family (c14539d)

- `src/app/edit/page.tsx` (title follows the evidence RootWebArea 'Image Edit
  — Turn Flat Images Into Editable Layers | Higgsfield • Higgsfield') +
  `src/components/tools/edit-landing.tsx` (246 lines, client) — from
  `inspect-edit.json` (455 a11y nodes): eyebrow 18135 'HIGGSFIELD LAYERS';
  hero 18136 'TURN FLAT IMAGES INTO EDITABLE LAYERS.' (lines 18137/18138);
  paragraph 18140 verbatim; button 18141 'Upload Media' — the upload→layers
  flow was NOT captured → disabled + scope note + Cinema Studio CTA;
  **capability carousel**: 5 labelled capability images 18121/18123/18125/
  18127/18129 (RELIGHT, INPAINT, LAYER DECOMPOSITION, EDIT TEXT, EFFECTS —
  labels verbatim in evidence order) + Previous/Next capability buttons
  18130/18132 — interactive client-side carousel with deterministic tiles and
  per-capability node citations; **'My projects'** (sectionheader 18145,
  heading 18146): lists the signed-in user's folders via the EXISTING folders
  API (`useFolders`; cover = latest done generation looked up through
  `useJobs` — same pattern as /ads-studio/all) with the live empty-state text
  18150/18152 shown when no folders exist, and a **visible no-edit-surface
  note** (the clone folder model has no surface field — checked, same as 3A).
- `src/app/edit/[projectId]/page.tsx` — routed placeholder (manifest key
  `/_private/edit/$projectId`); guards `projectId` empty / 'avatar' / 'canvas'
  → `notFound()` (reserved segments for the sibling routes); id verbatim;
  disclosed note — the live 'My projects' list was EMPTY in the capture, so no
  edit-project detail surface exists to copy; nothing faked.
- `src/app/edit/avatar/[category]/page.tsx` (manifest key
  `/_private/edit/avatar/$category`) and `src/app/edit/canvas/[imageId]/
  page.tsx` (manifest key `/_private/edit/canvas/$imageId`) — routed
  placeholders: param verbatim, disclosed demo-scope notes, `notFound()` on
  empty param.

### B4. `/audio` — landing + TTS workspace (911bd26)

- `src/app/audio/page.tsx` (title verbatim from the RootWebArea: 'Higgsfield
  Audio - AI Voice Over & Voice Translation Tool') +
  `src/components/tools/audio-studio.tsx` (408 lines, client) — from
  `inspect-audio.json` (346 a11y nodes):
  - mode tabs 1047 'Text to Speech' / 1049 'Voice Change' / 1051 'Translate'
    — interactive client-side switching; **only the TTS panel structure was
    captured** → Voice Change / Translate render disclosed not-captured panels
    with a 'Back to Text to Speech' button;
  - script textbox 1063 (placeholder verbatim 'Write exactly what the voice
    will read out loud. Type @ to reference attachments', label 1061) with a
    5000-char counter (clone-side clamp);
  - **the honest voice picker** (see DISCLOSURES #7): fieldset 'Pick or clone
    a voice' built ONLY from the captured affordances of paragraph 3174 —
    'Choose a preset' (disclosed empty: preset voice names NOT captured),
    'Clone your own' (upload button 3089 'Upload media Up to 3 Voices/Audios
    or Image', Optional 1059 — inert, flow uncaptured), 'Pick a model' (button
    1065 'Model Seed Audio 1.0' — the ONLY captured model, interactive
    toggle with 'selected' badge). **No voice names are invented.**
  - voice details textbox 929 ('Optional', 0/500 counter nodes 1078-1083,
    clamp 500);
  - batch size 1069 '1/4' with decrease/increase buttons 1070/1075 —
    interactive, clamped to the captured 1..4 range;
  - Generate button 1089 — the audio generation pipeline was NOT captured →
    **disabled + visible demo-scope note + honest 'Continue in Cinema Studio'
    CTA**; no fake job creation, no API calls;
  - 'How it works' step cards verbatim: 3164 'TURN TEXT INTO SPEECH' + 3167
    'Lifelike speech from any script — ready for your projects'; 3171 'Pick or
    clone a voice' + 3174 'Choose a preset, clone your own, or pick a model';
    3179 'Write, describe and generate' + 3182 'Type your script, describe how
    it sounds, and create';
  - panel tabs 3141 'History' / 3146 'How it works' (History = disclosed
    empty state — the pipeline does not exist in this build, so no history can
    exist); Filters button 3154 and 'More about Audio' button 3186 inert
    (targets not captured).

### B5. `/assets` — index over existing generations (6ad226b)

- `src/app/assets/page.tsx` + `src/components/tools/assets-index.tsx` (166
  lines, client) — evidence: 'Assets' is a live topbar entry with a folder
  icon (inspect-effects.json link 19977 'Folder icon Assets'; the same node
  in the canvas/edit/audio captures: 22471 / 18109 / 1037) and the route key
  `/_private/asset` in route-preload-manifest.json — **but the assets-page
  surface itself was NOT captured**. Per the 3B order ("simple assets index
  over existing generations") the page lists this build's done generations
  via the REUSED jobs hook (`useJobs` → GET /api/jobs/accessible — no new API
  routes): filter `status === 'done' && asset_url`. Asset cards: thumbnail
  (asset_url, aspect ratio from job width/height), IMAGE/VIDEO kind chip,
  **model chip (model_label) + status chip** (the order's "model/status
  chips"), and a **folder link** — `/generate/folder/{folder_id}`, with
  folderless generations falling back to `/generate/all` (disclosed
  clone-side fallback); loading skeletons; a visible demo-scope note; empty
  state with an 'Open Cinema Studio' CTA.

### B6. Tools nav group + community originals decision (7b2e000)

- `src/components/app-shell.tsx` (the only shared-file edit) — a **'Tools'
  sidebar group** below Studios, in the desktop sidebar and the mobile Sheet
  (both share NavLinks): Effects (Wand2 → /effects, mega-menu link 19937),
  Canvas (LayoutDashboard, 19963), Edit (Pencil, 19954), Audio (Music,
  19906), Assets (FolderOpen — the live nav renders 'Folder icon Assets',
  19977). The existing `link()` helper / active-state / a11y conventions were
  preserved; the group heading is disclosed in the comment as the
  packet-ordered clone-side layout choice (the live sidebar is a flat list —
  same convention as the 3A 'Studios' group).
- `src/components/community/community-content.tsx` — the B6 exit decision:
  **the community originals tab was NOT upgraded to a publications view.**
  The captured community surface (inspect-community.json, 969 nodes) is the
  live Discovery tab (sections FEATURED CREATORS / Grants / CONTESTS / OPEN
  PROJECTS / SHOTS BY CREATORS / CREATOR PARTNERSHIP PROGRAM / CREATOR HUB /
  DISCORD COMMUNITY) — no originals publications content was captured; the
  live 'Originals' mega-menu entry (inspect-effects.json link 19966) maps to
  the `/(public)/original-series` route family, whose surface was not
  captured; and re-serving the clone's generations feed under 'originals'
  would mislabel content. The tab therefore stays a `WaveThreeStub`, with the
  disclosure upgraded from the old "Originals ship in Wave 3" promise to the
  evidence-based "Originals surface not captured … nothing is invented
  here". (Worker-56 spot-check nit on the inline comment: the capture's
  'Community navigation' node 3435 DOES carry an 'Originals' tab link — 3447,
  alongside Discovery 3437 / Projects 3439 / Shots 3441 / Creators 3443 /
  Contests 3445 — so the comment's phrase "the live community page carries no
  originals tab" overstates; the accurate grounds, also stated in the comment
  and in the user-visible stub text, are that no originals tab CONTENT was
  captured and the originals route-family surface is uncaptured.)

## Verification (station clean-room record)

The station verified `hf/wave-3b-tools` and merged it to main (fast-forward;
main = 7b2e000) and pushed (origin/main @ 7b2e000). Station numbers:

```
bun run lint                          → 0 problems
bunx tsc --noEmit                     → 0 errors
routes                                → 19 OK, including /effects/unknown-xyz
                                        → 404 (unknown effect slugs correctly
                                        notFound())
SSR HTML greps (evidence headings):
  /effects   → 'VISUAL EFFECTS', 'BURNING MAN', 'FLOATING FALL',
               'FROZEN IN MOTION'
  /audio     → 'TURN TEXT INTO SPEECH', 'Pick or clone a voice',
               'Write, describe and generate'
  /edit      → 'TURN FLAT IMAGES INTO EDITABLE LAYERS', 'My projects'
  /canvas    → 'GENERATE STUNNING MEDIA WITH AI CANVAS'
test battery (clean-server run)       → 20 pass / 0 fail
contention                             → SQLite P1008 write timeouts against
                                        the long-lived dev server diagnosed
                                        PRE-EXISTING (the same wave-2
                                        f-worker/test-purge interaction
                                        documented in the 3A record); 3B
                                        touched no server code — frontend-only
                                        branch (0 API routes, 0 Prisma changes)
```

Provenance caveat (worker 56): the station's 3B verification entry was
relayed in the doc-closure dispatch; at closure time the station log
(/home/z/my-project/worklog.md, mtime 15:57Z — before the 3B commits)
still ended at the 3A-era entries, so the numbers above are the dispatch
record of the station's verification, not a locally re-run battery.

## DISCLOSURES (every stub / clone-side invention — re-verified in code by worker 56)

1. **Effect count reconciliation**: the packet said "51 named effects"; the
   capture actually holds **50 quick-nav links / 50 gallery figure cards
   naming 45 unique effects** (5 names repeat: FLOATING FALL, CUTOUT, EYES
   IN, VANISH, INFINITE CLONES — worker 56 re-counted from
   inspect-effects.json). `EFFECTS_CATALOG` keeps one entry per unique name
   (45), first-occurrence order, all occurrence node ids recorded. Citation
   nit found at reconstruction: the `/effects` page comment says the quick-nav
   carries "51 links" — the actual count is 50 (the packet figure
   transcribed); the rendered strip iterates the 45 catalog entries, so only
   the comment number is off, not the behavior.
2. **No per-effect detail surface captured** (cards carry only '{NAME}' +
   'View {Name}' + 'Generate'; the DOM spec carries attribute names only, no
   href values) → `/effects/[slug]` renders the captured facts + a visible
   demo-scope card; no description, preview clip, or parameter set invented;
   the effect-application pipeline is not implemented. The live 'Generate'
   affordance is honored via the honest 'Try in Cinema Studio' → `/` CTA.
   `/effects/[slug]` is a clone-side route shape (live card hrefs uncaptured;
   the manifest carries `/(public)/effects` plus other effect route families
   — `/effects_/$invalidSegment_/`, `/effects_/examples_/$presetSlug`,
   `/viral-effects`, `/(public)/collection/effects` — which are out of 3B
   scope).
3. **Gating**: /effects is PUBLIC (no gate) per the `/(public)/effects`
   manifest family; /canvas, /edit, /audio, /assets are StudioGate-wrapped
   private routes (the 3A studio-gate convention reused — it renders children
   during session-loading so SSR greps work; 3A disclosure #1 inherited).
4. **Uncaptured flows are disabled, not faked**: 'Create Canvas' (canvas
   creation), 'Upload Media' (upload→layers), voice upload/clone, and audio
   Generate are all uncaptured fnf flows → disabled buttons with visible
   scope notes + honest 'Continue in Cinema Studio' CTAs; no fake jobs, no
   API calls from any 3B page.
5. **Canvas workspace is a disclosed shell**: the route exists in the live
   manifest (`/_private/canvas/$id`) but the workspace surface was not
   captured (inspect-canvas.json covers the landing only) → inert
   deterministic board preview, no board tools / media layers /
   collaboration. `/canvas/templates/[templateId]` renders the evidence name
   when the id matches a captured template, else the generic placeholder
   (id verbatim — the route exists live, so unknown ids do NOT 404; only
   empty params and the reserved 'templates' segment 404).
   `/canvas/[id]/embed` is a minimal standalone disclosure (surface
   uncaptured).
6. **/edit 'My projects' lists ALL folders** the signed-in user owns
   (`GET /api/folders` has no surface field — same check as /ads-studio/all)
   with a visible no-edit-surface note; covers are the latest done
   generation (clone-side affordance); the live capture's empty-state text
   (18150/18152) is reproduced when no folders exist. The 3 routed edit
   placeholders display params verbatim with disclosed notes; reserved
   segment guards (id 'templates'; projectId 'avatar'/'canvas') 404 instead
   of shadowing sibling routes.
7. **/audio voice picker — the no-captured-voice-names gap**: NO preset voice
   names exist anywhere in the evidence (the a11y tree carries no
   voice-name nodes; the typeahead listbox 3277 is empty;
   api-bodies-digest.json has zero voice fields — worker 56 re-verified: 0
   occurrences of 'voice' in the digest — so the packet's conditional
   "voices list from api-bodies-digest.json if captured" evaluated to NOT
   captured). The picker renders only the three captured affordances
   (paragraph 3174): preset — disclosed empty; clone — inert upload; model —
   the single captured 'Seed Audio 1.0'. Voice Change / Translate tabs
   render disclosed not-captured panels. History tab, Filters, and 'More
   about Audio' are disclosed empty/inert states.
8. **/assets surface uncaptured** (only the topbar entry + `/_private/asset`
   route key) → a disclosed index over the existing done generations via the
   reused jobs hook; no new API routes, no separate asset store invented;
   folderless generations link to `/generate/all` (clone-side fallback,
   disclosed on the card).
9. **Community originals tab stays a stub** (B6 exit): the evidence does not
   support an originals publications view — the captured community body is
   the Discovery tab; the 'Originals' mega-menu entry maps to the uncaptured
   `/(public)/original-series` family (the manifest also carries
   `/(public)/community/_tabs/originals`, surface uncaptured); re-serving the
   generations feed under 'originals' would mislabel content. Stub text
   upgraded to the evidence-based disclosure. Comment nit per B6 above: the
   live community nav DOES carry an 'Originals' link (node 3447) — the
   content, not the tab link, is what's uncaptured; the user-visible stub
   text is accurate as written.
10. **'Tools' nav group heading** is the packet-ordered clone-side layout
    choice (live sidebar is a flat list; the live mega-menu carries the 5
    entries — citations 19937/19963/19954/19906/19977 in app-shell.tsx).
    Assets renders with a folder icon to match the live 'Folder icon Assets'.
11. **Metadata titles** follow evidence RootWebArea names where captured
    (audio verbatim; edit follows 'Image Edit — Turn Flat Images Into
    Editable Layers'; canvas/effects/assets are clone-composed around
    evidence strings). No existing route content was touched except
    app-shell.tsx (nav) and community-content.tsx (originals stub text).
12. **No new API routes, no Prisma changes, no new npm packages.** All state
    is client-side (useState); determinism law respected (fnv1a-seeded hues
    via effectHue — reused for canvas board tiles; index-based template
    tiles; zero Math.random).

## Files created / modified

Created (16): `src/lib/effects-catalog.ts`; `src/app/effects/page.tsx`;
`src/app/effects/[slug]/page.tsx`; `src/app/canvas/page.tsx`;
`src/app/canvas/[id]/page.tsx`; `src/app/canvas/templates/[templateId]/page.tsx`;
`src/app/canvas/[id]/embed/page.tsx`; `src/app/edit/page.tsx`;
`src/app/edit/[projectId]/page.tsx`; `src/app/edit/avatar/[category]/page.tsx`;
`src/app/edit/canvas/[imageId]/page.tsx`;
`src/components/tools/edit-landing.tsx`; `src/app/audio/page.tsx`;
`src/components/tools/audio-studio.tsx`; `src/app/assets/page.tsx`;
`src/components/tools/assets-index.tsx`;
`docs/wave-3b-worker-worklog.md` (this file — written by worker 56).

Modified (2): `src/components/app-shell.tsx` (B6 Tools nav group — the only
shared-file edit); `src/components/community/community-content.tsx` (B6
originals-tab decision comment + evidence-based stub text).

Totals: 18 files changed, 2348 insertions(+), 3 deletions(-) across the 6
commits a94ccf9 → 7b2e000.

## Breakage outside boundary

1. **SQLite P1008 write contention against the long-lived dev server**
   re-appeared during the station battery — diagnosed pre-existing (the
   wave-2 f-worker vs test-purge interaction documented in the 3A record);
   the clean-server run was green (20 pass / 0 fail). 3B touched no server
   code (frontend-only: 0 API routes, 0 Prisma changes), so no relation.
   Remains a wave-4 hardening item (busy_timeout/WAL or worker backoff).
2. No other breakage observed outside the 3B file set.

## Stage Summary

- Modules delivered: /effects public catalog (45 evidence-cited effects,
  detail pages with notFound guard + 'Try in Cinema Studio' deep link),
  /canvas family (landing + routed workspace shell + templates placeholder +
  embed placeholder), /edit family (HIGGSFIELD LAYERS landing + capability
  carousel + My projects via the folders API + 3 routed placeholders),
  /audio (landing + TTS workspace with the honest no-voice-names picker),
  /assets (index over existing done generations — jobs API reuse,
  model/status chips, folder links), Tools nav group (5 entries), community
  originals tab kept as an evidence-based stub.
- Files: 16 created + 2 modified (app-shell.tsx, community-content.tsx) —
  2348 insertions / 3 deletions over 6 commits; zero new API routes, zero
  Prisma changes, zero new packages; determinism law respected.
- Verification (station): lint 0 · tsc 0 · 19 routes OK incl.
  /effects/unknown-xyz → 404 · SSR evidence greps pass (VISUAL EFFECTS /
  BURNING MAN / FLOATING FALL / FROZEN IN MOTION; TURN TEXT INTO SPEECH /
  Pick or clone a voice / Write, describe and generate; TURN FLAT IMAGES
  INTO EDITABLE LAYERS / My projects; GENERATE STUNNING MEDIA WITH AI
  CANVAS) · battery 20 pass / 0 fail on a clean server · P1008 contention
  pre-existing.
- Key disclosures: honest gaps everywhere the evidence ran out — no voice
  names captured (picker shows affordances only), no effect descriptions
  (demo-scope cards), no canvas/edit workspace surfaces (disclosed shells +
  placeholders), assets surface uncaptured (index over existing
  generations), originals tab stub on evidence grounds. Two citation nits
  found at reconstruction: the effects quick-nav count is 50 links (comment
  says 51; packet said 51; 45 unique names), and the community capture's nav
  does carry an 'Originals' link (3447) — the uncaptured thing is the tab's
  content.
- Process: worker 55's session hit its deadline after the final commit
  (7b2e000) but before writing delivery records; the worklog and station-log
  entry were reconstructed by worker 56 from git history, the code tree at
  7b2e000, and the station's verification record. The station merged
  (fast-forward) and pushed main → origin/main @ 7b2e000 before closure.
  Next per the roadmap: sub-order 3C (platform pages + contests +
  route-parity exit gate), then wave-4 hardening (incl. the SQLite
  contention fix).
