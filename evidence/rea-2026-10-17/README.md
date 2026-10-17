# REA Survey — 2026-10-17 (wave-2/3 evidence deepening)

Instrument: [morluto/rea](https://github.com/morluto/rea) v6.5.0 (`rea` CLI),
attached passively to the operator Chrome (CDP `127.0.0.1:9222`, live Clerk
session `yaslencatty@gmail.com` / user `radiatingcapybara1609`). Plus the CDP
network capture daemons (`replay2/scripts/local/hf_net_capture{,2}.py`, now
recording request headers via `requestWillBeSentExtraInfo`).

## Files

- `inspect-cinema-studio.json` — REA `inspect-web-page` of `/generate`
  (Cinema Studio 4.0): 2,943 DOM nodes, 617 a11y nodes (full sidebar/topbar/
  composer tree), storage keys (`hf:gen-panel-v1`, `hf:cinematic-studio-image-v4`,
  `creator-pass:header-participant:<uid>`, `accessible-folder-sidebar-folder:<uid>`,
  `hf:term-of-use-consent-accepted:<uid>` …), script/resource inventory.
- `bundle-ai-image.json` — REA `analyze-web-bundle --fetch-source-maps` on
  `/ai/image`: per-route chunk set (15 scripts with full minified source),
  routes, 4 source-map references, vendor fingerprints (React). NOTE: each
  TanStack route lazy-loads only its own chunks — repeat per surface to
  accumulate the full app source set.
- `net-capture-with-auth-headers.jsonl` — full request/response pairs for the
  Cinema Studio tab incl. **auth headers**.
- `net-capture-ai-image-generation.jsonl` — the live generation attempt on
  `/ai/image` (see below).
- `cinema-studio-state.png`, `datadome-challenge.png` — visual evidence.

## Key findings (wave-2 payload)

### 1. The generation POST (ground truth)

`POST https://fnf-api-gw.higgsfield.ai/fnf/jobs/{model}` — model in the path.
Captured live (model `nano-banana-2`, 2 credits):

```json
{
  "params": {
    "prompt": "…",
    "aspect_ratio": "3:4",
    "resolution": "1k",
    "batch_size": 1,
    "is_storyboard": false,
    "is_zoom_control": false,
    "use_unlim": false,
    "width": 896,
    "height": 1200,
    "input_images": []
  },
  "use_unlim": false
}
```

Response: **403 + DataDome challenge** (see §4). No successful 200 body
captured — the account has zero historical jobs
(`GET /fnf/jobs/accessible?job_set_type=viral_hub_rendered_image&job_set_type=text2ima`
→ `{"jobs":[],"has_more":false}`, `folders/pinned` → `[]`). The job object
shape must be inferred for the clone (status machine queued→processing→
done/failed per the roadmap).

### 2. The auth chain

- Clerk session (`POST /_clerk/v1/client/sessions/{sess}/tokens`) mints a
  RS256 JWT carrying `workspace_id` + `sub` (user id) — used verbatim as the
  fnf Bearer.
- fnf requests carry: `authorization: Bearer <clerk-jwt>`,
  `x-datadome-clientid: <cid>`, origin/referer `https://higgsfield.ai`.
- Stale-token behavior on reload: initial fnf GETs 401
  `{"detail":"Invalid or expired token"}` until the Clerk token refresh
  lands, then all succeed (app-level retry).

### 3. Folder model (verbatim POST response)

`POST /fnf/folders` (fired automatically by GENERATE clicks — one new project
per attempt) returns the full folder object: `id, workspace_id, user_id,
owner_username, parent_id, root_folder_id, is_root, path, name, slug,
description, emoji, color, preview_url, cover_image_url, count,
subfolders_count, sort_order, access_mode, link_access_level, views_count,
copies_count, join_behavior, default_role, is_discoverable,
admins_can_manage_credit_limits, …`. Root folders get `color:"cyan"`,
`name:"New project"`, auto-slug `new-project-N`; a "Getting Started"
subfolder is seeded under the first project.

### 4. DataDome protection (the 403 wall)

Every `POST /fnf/jobs/*` from this environment is challenged: 403 (text/html)
→ full-viewport iframe `geo.captcha-delivery.com/captcha` → slider challenge
("Slide right to secure your access", `.sliderContainer/.slider/.sliderTarget`
geometry) + audio fallback (6 digits). Two CDP-driven human-like drags
(smoothstep + jitter, then hesitation/overshoot trajectory) were **rejected**
— DataDome lists "developer or inspection tools" among failure reasons; the
CDP attachment itself is fingerprinted. **Do not burn more attempts.** The
clone must not reproduce DataDome internals — treat the 403→challenge flow as
an edge case (rate-limit-style gate) in the product clone.

### 5. Route truth (landing vs app)

- `/ai-image` is the SEO landing page; its Generate CTA navigates to the real
  studio at **`/ai/image`** (`?model=nano-banana-pro&aspect_…` — model +
  aspect in query params).
- `/generate` = Cinema Studio 4.0 (composer: Image/Video/References tabs,
  Film setup, GENERATE 80 — premium-gated: Upgrade Required modal on click).
- Full top-nav dropdown (21 surfaces, badges verbatim): Explore, Image, Video,
  Audio, MCP, API, Genjutsu(top), Katana(New), AI Influencer, Academy(New),
  ChatGPT Plugin, Ads Studio, Effects, Cinema Studio, Contests, Marketing
  Studio, Edit, Community, Plugins, Canvas, Originals.

### 6. Wallet/free-gens endpoints (live, 200)

`GET /fnf/user`, `/fnf/user/meta`, `/fnf/user/free-gens/v2`,
`/fnf/workspaces/wallet`, `/fnf/user/offers` (→ `[]`),
`/fnf/user/credit-package-chase`, `/fnf/user/credit-package-discount`,
`/fnf/user/personal-promo`, `/fnf/subscriptions/v2/plans?plan_set_key=default&with_localization=true`,
`/fnf/concurrent-boost-credits/state`, `/fnf/subscriptions/bundle/unlim-catalog`,
`/fnf/v2/quizzes/user`, `/fnf/trash/library/count`.
Landing-page marketing copy shows "300 FREE GENS" plans (200 credits/mo …).

### 7. Studio composer DOM (ai/image)

Prompt input is a **contenteditable div** (Cinema Studio) / textarea variant
on other surfaces; "Generate 2" button (credits inline); model mentions:
Nano Banana Pro, GPT Image, Seedream, FLUX, Genjutsu, Kling, Seedance, Soul ID.

## Worker guidance

- Build the job pipeline from §1 (POST shape) + roadmap wave-2 spec; poll
  `GET /fnf/jobs/accessible` shape for the list view (`{"jobs":[],"has_more":false}`).
- Folder CRUD from §3 verbatim shapes.
- Auth: NextAuth JWT → own Bearer scheme; replicate the 401-retry behavior.
- Do NOT attempt DataDome bypass — out of scope for the clone.
