# HF-WAVE3-PACKET — the wider product surface (station-issued worker orders)

Issued by the TL station against merged baseline **bfe60d2** (wave-2, certified:
lint 0 / tsc 0 / build 0 / api 19/19 / e2e PASS — re-certified locally after the
sandbox reset). Wave 3 is split into three sequential sub-orders; each is one
worker order = one branch = one station-verified merge. **3A dispatches first;
3B and 3C queue behind it.**

## Ground-truth index (read this before anything)

Evidence lives in `evidence/rea-2026-10-17/`. Usable surface specs (REA
`inspect-web-page` captures: `normalized_result.accessibility.nodes` =
node_id/parent_id/role/name/level a11y tree; `normalized_result.dom` = DOM
nodes; `normalized_result.storage.local_storage_keys`):

| Spec | Root page | Notes |
|---|---|---|
| `surfaces/inspect-api.json` | "Open Higgsfield AI \| Official Higgsfield API Platform" | **The full MODEL CATALOG** (2577 a11y nodes): bytedance/Seedance 2.5, higgsfield/Genjutsu, kling/Kling 3.0, minimax/MiniMax H3 … + "Show all Image models" / "Show all Video models" / "Workflows" / cashback banner |
| `surfaces/inspect-ads-studio.json` | "Ads Studio" | "Start with tools" / "HOW IT WORKS" / "EVERYTHING YOU NEED TO CREATE ADS THAT C…" / "YOUR BRAND KIT IS CREATED FROM YOUR WEBS…" |
| `surfaces/inspect-marketing-studio.json` | "Marketing Studio • Higgsfield" | "TURN ANY PRODUCT INTO READY TO POST CONT[ENT]" hero |
| `surfaces/inspect-ai-influencer-studio.json` | "AI Influencer \| Higgsfield" | Character builder form: Character type / Gender / Build / Hairstyle / Hair Color / Style / Ethnicity … |
| `surfaces/inspect-effects.json` | "Visual Effects" | 51 headings — named effect catalog (FLOATING FALL, HIGH FLIP, BURNING MAN, SCRAPBOOK COLLAGE, COMIC, FROZEN IN MOTION, PARTICLES …) |
| `surfaces/inspect-canvas.json` | "Higgsfield" | "GENERATE STUNNING MEDIA WITH AI CANVAS" |
| `surfaces/inspect-edit.json` | "Image Edit — Turn Flat Images Into Editable Layers" | "TURN FLAT IMAGES INTO EDITABLE LAYERS." + "My projects" |
| `surfaces/inspect-audio.json` | "Higgsfield Audio - AI Voice Over & Voice Translation Tool" | "TURN TEXT INTO SPEECH" / "Pick or clone a voice" / "Write, describe and generate" |
| `surfaces/inspect-academy.json` | "Academy \| Higgsfield" | Course content: "LEARN AI VIDEO FROM ZERO." / "NO EXPERIENCE NEEDED" / FAQ |
| `surfaces/inspect-mcp.json` | "Higgsfield MCP \| AI Image & Video Generation for Any Agent" | "EVERY CREATIVE MODEL, INSIDE CHATGPT" + model/studio lists |
| `surfaces/inspect-contests.json` | "Contests \| Higgsfield" | ACTIVE/RECENT CONTESTS, THE ADATHON, HIGGSFIELD APPS CONTEST, MAKE YOUR ACTION SCENE |
| `surfaces/inspect-community.json` | community | FEATURED CREATORS / CONTESTS / OPEN PROJECTS / SHOTS / CREATOR HUB / DISCORD / Grants |

**Known-bad specs (DO NOT use as ground truth):** `inspect-projects.json`,
`inspect-settings.json`, `inspect-video.json` — all captured 404 pages.

Route truth: `route-preload-manifest.json` — live tree keys of interest:
`/_private/ads-studio{,/all,/ad-multiplier,/b/$brandId,/brand-research/$brandId}`,
`/_private/ai-influencer-studio`, `/_private/audio`, `/_private/asset`,
`/_private/canvas{,/$id,/templates/$templateId}`, `/_private/edit{,/$projectId,
/avatar/$category,canvas/$imageId}`, `/_private/explore`,
`/(public)/(explore)/(home)/` + per-model community slugs (`kling-30-community`,
`seedance-2-5-community`, `seedance-4k-community`, `soul/`, `wan-video/`),
`/(public)/effects`, `/(public)/collection/effects`, `/(public)/mcp`,
`/(public)/mcp_/$slug`, `/(public)/contests/$contestSlug{,/submissions/…}`,
`/(public)/marketing-studio-community`, `/(public)/original-series/…`,
`/(public)/enterprise-studio`, `/academy`, `/viral-effects`.

Extraction recipe (DO NOT read these JSONs whole — they are 220KB–1MB; extract
with python):

```bash
python3 -c "
import json
d = json.load(open('evidence/rea-2026-10-17/surfaces/inspect-ads-studio.json'))
nodes = d['normalized_result']['accessibility']['nodes']
for n in nodes:
    if n.get('role') in ('heading','link','button','textbox','combobox','radio','tab') and n.get('name'):
        print(n['node_id'], n.get('parent_id'), n['role'], repr(str(n['name'])[:80]))
" | head -80
```

Existing code anchors (verified at baseline bfe60d2):

- `src/components/app-shell.tsx` — sidebar `NavLinks` (`link()` helper) + topbar
  (wallet pill → `/pricing`, account dropdown). Wave-3 adds its nav entries here.
- `src/lib/catalog.ts` — `MODEL_CATALOG: Record<string, ModelSpec>` (generate-able
  models: `nano-banana-2` = 2 credits, `cinema-studio-4` = 80, `wan-2-2-animate-faceswap` = 30),
  `ASPECT_PRESETS`, `PRICING_CONFIG`, `JOB_SET_NOTICES`.
- `src/app/` — `/` (Cinema Studio composer), `/generate/all|folder/[folderId]|trash`,
  `/community?tab=…` (5 tabs: generations/contests/creators/originals/projects —
  originals+projects are wave-three-stub placeholders), `/pricing`.
- API routes: `src/app/api/{auth,jobs,folders,trash,user,notices,community}/…`
  (snake_case, evidence-shaped; 401 body exactly `{"detail":"Invalid or expired token"}`).
- Prisma models: User, Folder, Generation, CreditPool, CreditLedger, FreeGensGrant,
  FeedPublication, Contest.
- Tests: `tests/api.test.ts` (19), `tests/e2e.test.ts` (1) — run against a live
  server via `TEST_BASE_URL` (station uses :3111; the worker may too).

## WORKER LAWS (binding — violation = order rejected)

1. **FILE-TOOL LAW (§10b):** every repo file you create or modify MUST go
   through the Write/Edit/MultiEdit tools. Bash heredocs / `python -c` file
   writes to repo paths are FORBIDDEN (invisible to station review). Bash is
   for commands only (git, bun, curl, evidence extraction that prints to stdout
   or writes to /tmp).
2. **Evidence-first:** every UI structure claim cites the spec file + node text
   you derived it from (code comment `// ev: inspect-ads-studio.json §nodes` style).
   Never invent API contracts. Where the live product calls uncaptured fnf
   endpoints, build the UI and stub the call with a disclosed placeholder
   (toast/console is NOT enough — a visible "demo scope" note or inert state).
3. **File boundary:** touch only the files your sub-order lists. Shared-file
   edits (app-shell nav) are allowed EXACTLY as specified. Report anything
   broken outside your boundary; do not fix it.
4. **No new npm packages** unless the order says so. Stack: existing shadcn/ui +
   lucide + TanStack Query + Zustand + date-fns.
5. **Determinism:** no `Math.random` (use `src/lib/seeded-rng.ts` if needed).
   Skeletons/pulse placeholders must be deterministic.
6. **Verification battery (all green before you report done):**
   `bun run lint` (0) · `bunx tsc --noEmit` (0) · curl each new route → 200 with
   key evidence headings present in SSR HTML · `TEST_BASE_URL=http://localhost:3111
   bun test tests/api.test.ts tests/e2e.test.ts` still green (19 + 1).
   The station dev server runs on :3111 with hot reload; if it died, relaunch:
   `cd /home/z/higgsfield && (nohup bunx next dev -p 3111 > /tmp/hf-dev.log 2>&1 &)`.
7. **Delivery:** work on your branch, commit your work (conventional commits),
   append your work record to `docs/wave-3{X}-worker-worklog.md` in the repo
   AND to `/home/z/my-project/worklog.md` (shared TL log, append-only, template
   per program law). Never push; never merge to main yourself. Never touch
   `/home/z/my-project` (that is the sandbox console, not this repo).
8. **Honesty:** report failures, skips, and clone-side inventions explicitly.
   A disclosed stub merges; an undisclosed invention voids the order.

---

## Sub-order 3A — Studios family + the model catalog surface (DISPATCHED)

Branch: `hf/wave-3a-studios`. Scope: four route-level modules + nav extension.
Frontend-only (no new API routes, no Prisma changes) — the wave-2 pipeline stays
the only generation path; 3A surfaces link into it where honest.

### A1. `/explore` — the model catalog surface (public)

- Extract the full vendor/model inventory from `surfaces/inspect-api.json`
  (a11y tree carries the card headings: "bytedance / Seedance 2.5",
  "higgsfield / Genjutsu", "kling / Kling 3.0", "minimax / MiniMax H3" …) and
  cross-check per-model credit pools in `api-bodies-digest.json`.
- New `src/lib/model-registry.ts`: `MODEL_REGISTRY` — vendor → models[]
  (name, slug, kind image|video, blurb from evidence, `href`), citing evidence
  per entry. Generate-able models reference the existing `MODEL_CATALOG` ids.
- Page `src/app/explore/page.tsx` (public, no SessionGate): hero, "Image models"
  + "Video models" sections (the "Show all …" toggle pattern), vendor-grouped
  model cards; a card whose model is generate-able deep-links to `/` with the
  model preselected (extend the studio's model param handling ONLY if it
  already supports it — check first; otherwise link to `/` plainly and note it).
- Evidence comment header on the file listing the exact nodes used.

### A2. `/ads-studio` — Ads Studio (private, SessionGate)

From `surfaces/inspect-ads-studio.json`: landing structure — "Start with tools"
grid, "HOW IT WORKS" steps, "EVERYTHING YOU NEED TO CREATE ADS THAT C…" hero,
"YOUR BRAND KIT IS CREATED FROM YOUR WEBS[ITE]" brand-kit section. Route
manifest children: `/ads-studio/all`, `/ads-studio/ad-multiplier`,
`/ads-studio/brand-research/$brandId`, `/ads-studio/b/$brandId` — implement
`/ads-studio` (landing + tools) and `/ads-studio/all` (brands/projects list
reading the existing folders API filtered to an ads surface — CHECK the
folders API surface field first in `src/app/api/folders/`; if the clone folder
model has no ads surface, list all folders with a disclosed note). Tool
subpages (ad-multiplier, brand-research) = routed placeholder pages with the
evidence-derived heading + disclosed "demo scope" note. CTA buttons that would
start an uncaptured fnf flow must be visibly scoped (disabled + note), not fake.

### A3. `/marketing-studio` — Marketing Studio (private)

From `surfaces/inspect-marketing-studio.json`: hero "TURN ANY PRODUCT INTO
READY TO POST CONTENT" (full text from evidence), product→content flow
structure from the a11y tree, CTA into the wave-2 generation pipeline where
honest (`/` studio link). Disclose anything stubbed.

### A4. `/ai-influencer-studio` — AI Influencer character builder (private)

From `surfaces/inspect-ai-influencer-studio.json`: the character builder —
extract every form control (Character type / Gender / Build / Hairstyle /
Hair Color / Style / Ethnicity … — get the FULL option sets from the spec's
combobox/radio nodes). Client-side state (Zustand or useState), chip/select
UI matching the app's existing composer patterns, a summary panel and a
GENERATE affordance that is honestly scoped (the influencer pipeline is not
captured → visible demo-scope note, no fake job creation).

### A5. Nav extension (shared file — allowed edit)

`src/components/app-shell.tsx`: add a "Studios" nav group (Ads Studio,
Marketing Studio, AI Influencer) below the existing core links; topbar gains
an "Explore" link → `/explore` (the live topbar has Explore — cite
inspect-cinema-studio.json if it carries the topbar node; if not in evidence,
mark it a disclosed clone-side choice). Icons: lucide (Megaphone, Newspaper,
UserRound, Compass or similar). Desktop sidebar + mobile Sheet both.

### 3A exit gates

- lint 0 · tsc 0 · api 19/19 · e2e 1/1 · all new routes curl 200 with evidence
  headings in SSR output · existing routes unregressed (`/`, `/community`,
  `/pricing`, `/generate/all`).
- Every page carries its evidence citation header. Disclosures section in the
  worker worklog listing every stub/invention.

---

## Sub-order 3B — Creative tools family (QUEUED — do not start until 3A merges)

Branch: `hf/wave-3b-tools`. Modules: `/effects` (public catalog from
inspect-effects.json — 51 named effects, grid + detail slugs) and
`/effects/[slug]` (effect landing with a "Try in Cinema Studio" deep link),
`/canvas` (landing from inspect-canvas.json + `/canvas/[id]` routed shell),
`/edit` (landing from inspect-edit.json + "My projects" list via folders API),
`/audio` (landing + voice picker UI from inspect-audio.json — voices list
from `api-bodies-digest.json` if captured), `/assets` (from route manifest
`/_private/asset` — simple assets index over existing generations).
Exit: same battery + community originals tab upgraded from stub to a real
publications view if evidence supports it (inspect-community.json).

## Sub-order 3C — Platform pages + contests + route parity (QUEUED)

Branch: `hf/wave-3c-platform`. Modules: `/api` (the Open Platform page from
inspect-api.json — model catalog with docs links, Workflows, cashback banner;
link model cards to `/explore`), `/mcp` (from inspect-mcp.json), `/academy`
(from inspect-academy.json — course/FAQ content), `/contests` (list exists in
community tab; add `/contests/[slug]` detail from inspect-contests.json +
api-bodies-digest contests bodies, with submissions route shell), community
"projects" tab fill (OPEN PROJECTS section evidence). **Exit gate (wave-3
final): route-inventory parity script** — `scripts/route-parity.ts` (or .mjs):
walk `src/app` for app-router routes, diff against a curated allowlist derived
from `route-preload-manifest.json` (the /_private + /(public) trees that are
in wave 1-3 scope), print implemented/missing/extra, exit 0 when the curated
scope is covered. Commit the parity report output to `docs/`.
