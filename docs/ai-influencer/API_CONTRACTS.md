# API contracts — wave 7 (clone-side)

> These are **clone-side contracts** (TL architecture, Task 77-78). The reference
> product's generation API was never captured (0 network rows — see
> REVERSE_ENGINEERING_EVIDENCE.md); nothing here claims to be a recovered reference API.
> Naming note: the captured notices body (api-bodies-digest `notices`) proves the
> reference pipeline has an `ai_influencer` job_set_type; our three-way split
> (`influencer_portrait` / `influencer_fullbody` / `influencer_motion`) is a TL
> clone-side choice for per-asset job tracking.
> All request/response payloads are **snake_case** (repo law). All routes are
> authenticated (session cookie) unless noted.

## 1. Character registry

### `GET /api/characters`
List the signed-in user's characters.
- Response `200`: `{ "characters": [ { "id", "name", "created_at", "updated_at", "has_reference", "portrait_url" | null, "full_body_url" | null } ] }` (summary shape; full spec omitted from the list view).
- Empty list is a valid state: `{ "characters": [] }`.

### `POST /api/characters`
Create a character. **No generation, no credit burn.**
- Request: `{ "name"?: string, "spec": object }` — `spec` is the canonical character spec (§3 below): 19 settings keys; `character_type` must be one of the 9 evidence options; the other 18 keys must be values from the curated option library or `null` (= "Any" unset).
- Response `201`: `{ "id", "name", "spec", "reference_image" | null, "created_at" }`.
- `400` on invalid spec (unknown keys rejected — repo zod law).

### `GET /api/characters/[id]`
Character detail **including its jobs** (the character library / character-sheet / history read).
- Response `200`: `{ "id", "name", "spec", "reference_image" | null, "portrait_url" | null, "full_body_url" | null, "jobs": [ Generation-public-shape ] }` — jobs are the existing public Generation shape (status, kind, asset_url, error, created_at, …), newest first, filtered to this character's `influencer_*` jobs.
- `404` if not the owner's (`{"detail":"Not found"}`).

### `PATCH /api/characters/[id]`
Update name, spec, and/or the reference image.
- Request: `{ "name"?: string, "spec"?: object, "reference_image"?: string | null }` — `reference_image` is a data-URI (`data:image/…;base64,…`) or `null` to clear. Partial: omitted keys unchanged.
- Response `200` with the updated character record.
- Existing jobs are never mutated by a PATCH.

### `DELETE /api/characters/[id]`
Remove the character record.
- Response `200 { "deleted": true }` (or 204). The user's Generation rows survive as ordinary history (no cascade delete of paid outputs — disclosed clone-side choice).
- `404` if not the owner's.

## 2. Generation

### `POST /api/characters/[id]/generate`
Create **TWO Generation rows** for the character — portrait + full-body — in one atomic
submit (credits + both rows in one transaction, the §1a law).
- Request: `{}` (uses the character's stored spec + reference image). Optional `spec` override is NOT part of the wave-7 contract (edit-then-save first).
- Per-row values: `job_set_type` ∈ {`influencer_portrait`, `influencer_fullbody`}; `modelVersion = "ai-influencer"`; `kind = "image"`; prompt = deterministic render of the spec by the prompt builder (§4).
- **Credits: 1.125 total** (`ev: 2252` — the only captured influencer cost), **split 0.5625 / 0.5625** across the two rows. Burn order and ledger rows follow the existing pipeline (free-gens grant `model:influencer_*` → `model:<jobSetType>` pools → `daily` → `wallet`), one `CreditLedger` row per debit.
- Response `201`: `{ "jobs": [ { "id", "job_set_type", "status" }, … ] }` (both rows, `queued`).
- `402` terminal before any job exists if credits are insufficient (existing law).
- `429` with `Retry-After` + challenge body if the rate limiter trips (existing H3).
- Duplicate guard: a `400/409` clone-side guard prevents a second in-flight generate pair for the same character (spec: — the reference's duplicate behavior is uncaptured).

### `POST /api/characters/[id]/motion`
Create **ONE Generation row** — a motion-preset video.
- Request: `{ "preset": string }` — must be a key of the curated motion-preset library (§5).
- Row values: `job_set_type = "influencer_motion"`; `kind = "video"`; `modelVersion = "wan2.2-i2v-flash"`; input image = the character's full-body (fallback portrait) asset; prompt = the preset's curated motion prompt.
- **Credits: 1.125** — **spec-curated clone-side choice**: the reference's motion cost was never captured, so the only evidence-captured influencer price (ev: 2252) is mirrored for the studio's other generation action. Revisit after live provider-cost measurement (DashScope flash-tier 5 s clips are cheap; 1.125 clone credits comfortably covers spend).
- Response `201`: `{ "job": { "id", "job_set_type", "status" } }`.
- `404` character; `400` unknown preset; `409` if the character has no image asset to animate yet.

Both generation routes enqueue through the **existing** in-process CAS worker —
status polling, retry (attempt 1→2 for retryable adapter failures), terminal-failure
handling and the credit no-refund-on-retry law are inherited unchanged
(STATE_TRANSITIONS.md).

## 3. Canonical Character spec (stored as JSON on the Character row)

19 keys, one per captured settings heading (ev: 134–289):

```
character_type    — "average"|"bold"|"extreme"|"insect"|"frog"|"cat"|"dog"|"rodent"|"bird"   [ev: 2104/142–166]
gender, build, hairstyle, hair_color, style, ethnicity, age, skin_color, height,
proportions, head_shape, neck, eye_shape, eye_color, features, facial_hair,
distinctive_features, accessories                                                       — curated values [spec:]
```

- Every setting except `character_type` may be `null` = "Any" (unset default).
- Values are lowercase slugs; the option library carries display labels.
- Unknown keys rejected (strict zod, repo law).

## 4. Option library + prompt builder

**Option library** — a provenance-tagged, version-controlled table (code-owned, not
DB-owned) of every setting's allowed values:
- `character_type`: 9 options, provenance `ev:` (group 2104, nodes 142–166).
- The 18 remaining settings: curated lists of 4–10 options each, provenance `spec:`,
  chosen for coverage of common influencer appearance axes without claiming reference
  parity; `"Any"` (null) always available.

**Prompt builder** — renders a spec into a **deterministic** natural-language prompt
(same spec → same prompt string; no randomness — seeds belong to the provider call):
one portrait prompt ("close-up portrait, head and shoulders…") and one full-body prompt
("full-body photograph…"), each enumerating the set (non-null) settings in fixed order
with stable phrasing. Unset settings are omitted (the provider decides), matching the
"Any" semantics.

## 5. Motion preset library (spec:)

Curated preset-key → motion-prompt table (names/prompts are clone-side; the reference's
preset list is uncaptured). Each preset maps to a short performance prompt for
`wan2.2-i2v-flash` (e.g. walk-and-turn, wave-to-camera, runway walk, dance loop, …).
Preset selection is a UI affordance shaped like the reference's promise (ev: 326
"Choose a motion preset and watch them perform it in a video ready to share").

## 6. Provider interfaces (env-gated)

Two interfaces behind the existing `ModelAdapter` seam, selected by env, **default
`mock`** so the battery stays deterministic:

| Interface | Providers | Env | Route |
|---|---|---|---|
| Image | `openrouter` / `zai` / `mock` | `HF_IMAGE_PROVIDER` | Vercel prod = OpenRouter (Gemini image family; reference image conditioning via multimodal `messages`); sandbox/local = zai SDK `images.generations.create` / `images.generations.edit` |
| Video | `dashscope` / `zai` / `mock` | `HF_VIDEO_PROVIDER` | Everywhere (incl. Vercel) = DashScope intl `wan2.2-i2v-flash` (async task API, §7); sandbox alt = zai `video.generations.create` (cogvideox-3) |

Contract-test law (mission §6.1): a provider is "integrated" only when it passes the
common contract tests against the real engine — mock proves nothing about production.

## 7. DashScope intl video API mechanics (measured, Task 77-78)

- `POST https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis`
  with header **`X-DashScope-Async: enable`** (without it → `AccessDenied`, "current
  user api does not support synchronous calls").
- Body: `{ "model": "wan2.2-i2v-flash", "input": { "prompt", "img_url" }, "parameters": { "size", "duration" } }`.
- `size` whitelist: `832*480`, `480*832`, `1920*1080`, `1080*1920`, `1440*1440`,
  `1632*1248`, `1248*1632`, `624*624` (`1280*720` rejected).
- Poll `GET /api/v1/tasks/{id}` → `output.task_status`; `SUCCEEDED` → `output.video_url`
  (OSS signed URL, **~24 h expiry** — assets must be persisted beyond the URL; see
  KNOWN_LIMITATIONS.md).
- Measured: t2v-plus 5 s 832*480 → real MP4 in 30 s wall; i2v-flash img_url+prompt →
  real MP4 in 43 s wall. Available models: `wan2.2-t2v-plus`, `wan2.2-i2v-plus`,
  `wan2.2-i2v-flash`. **Not** on the gateway: `wan2.5-*`, `wan2.7-video`,
  `wanx2.1-vace`, `wan2.2-animate`.

## 8. Error contract (inherited)

`401 {"detail":"Invalid or expired token"}` (§1d) · `402` terminal insufficient
credits · `429` rate-limit challenge · `404` ownership misses. Job failures surface
through the Generation row's `status`/`error` via the existing polling client — the UI
must never report success while the job failed (mission §6.3 law).
