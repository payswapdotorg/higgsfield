# Architecture — AI Influencer wave 7 (TL decision, Task 77-78)

Documented by W7-A from the TL's engine-matrix decision + dispatch architecture.
Implementers: W7-B (backend) / W7-C (frontend) on `hf/wave-7-influencer`. The
architecture deliberately **reuses** the proven wave-2/4 pipeline instead of building a
parallel one — the mission's §5 "interchangeable routes" goal is satisfied at the
provider seam, not by duplicating job machinery.

```
                       /ai-influencer-studio (UI)
                                 |
                    CharacterBuilder + Motion + Library + History
                                 |
                 Character Service  ──  /api/characters* routes (API_CONTRACTS.md)
                                 |
               Canonical Character (Prisma) — spec JSON + referenceImage data-URI
                                 |             + portrait/fullBody asset links
                                 |
        POST …/generate (2 rows) │ POST …/motion (1 row)
                                 |
              existing Generation pipeline (unchanged semantics)
        atomic credit burn (1.125 ev:2252, split 0.5625/0.5625)
        in-process CAS worker: queued → processing → done/failed (+1 retry)
                                 |
                    Provider layer (ModelAdapter seam)
        ┌────────────────────────┴────────────────────────┐
   ImageProvider                                  VideoProvider
   HF_IMAGE_PROVIDER                              HF_VIDEO_PROVIDER
   ├─ openrouter (Vercel prod)                    ├─ dashscope (prod, everywhere)
   │    Gemini image family; reference            │    wan2.2-i2v-flash async task API
   │    image via multimodal messages             │    (X-DashScope-Async, poll → OSS URL)
   ├─ zai (sandbox/local)                         ├─ zai (sandbox alt — cogvideox-3)
   │    images.generations(.edit)                 └─ mock (tests)
   └─ mock (tests; DEFAULT for both)
```

## Components

### 1. Provider layer — two interfaces, env-gated
- Interfaces: image provider + video provider, plugged into the existing
  `ModelAdapter` contract (`src/server/adapters/types.ts`) so the worker, retry law,
  and credit pipeline are untouched.
- Selection: `HF_IMAGE_PROVIDER` ∈ {`mock`, `openrouter`, `zai`},
  `HF_VIDEO_PROVIDER` ∈ {`mock`, `dashscope`, `zai`} — **default `mock`** so the
  verify battery stays deterministic (mission rule 5: mock is for tests, never proof).
- **openrouter** (image, Vercel): Gemini image family; identity conditioning = the
  reference image passed in multimodal `messages` alongside the prompt; response
  parsed from `choices[0].message.images[].image_url.url` (data-URI). Sandbox egress
  is geo-blocked (403 on all 12 image models) — Vercel-side verification pending.
- **zai** (image, sandbox-only): `images.generations.create` (63 s measured) and
  `images.generations.edit` (identity-reference route). Non-portable (private network
  auth) — never a production dependency.
- **dashscope** (video, prod): `wan2.2-i2v-flash` via the async task API
  (API_CONTRACTS.md §7 for exact mechanics + size whitelist); output is a signed OSS
  URL (~24 h expiry) stored as `asset_url`.
- Contract-test law: a provider counts as integrated only after passing the common
  contract tests against the real engine (mock proves nothing).

### 2. Canonical Character model (Prisma, additive-only)
- `Character`: id, userId, name, **spec JSON** (19-setting canonical spec),
  **referenceImage** (data-URI string, nullable), **portraitUrl / fullBodyUrl**
  (asset links resolved from completed jobs), createdAt/updatedAt.
- Characters are the durable identity asset (mission §3.2): jobs reference the
  character; editing the spec never mutates past jobs; deletion keeps user history
  (STATE_TRANSITIONS.md §2).
- Additive-only schema push against Neon (the live DB backs Vercel).

### 3. Influencer jobs — reuse, don't rebuild
- `POST /api/characters/[id]/generate` → **two** `Generation` rows
  (`job_set_type` `influencer_portrait` + `influencer_fullbody`, model `ai-influencer`,
  burn **1.125 credits total** per ev: 2252, split 0.5625/0.5625).
- `POST /api/characters/[id]/motion` → **one** `Generation` row (`kind: video`,
  `job_set_type` `influencer_motion`, model `wan2.2-i2v-flash`, **1.125 credits —
  spec-curated clone-side choice**).
- Everything downstream is the existing machinery: atomic burn (grant → model pool →
  daily → wallet, ledger rows), CAS claim, one retry for retryable failures, terminal
  402 pre-queue, rate limiting, polling client. Snake_case payloads throughout.

### 4. Provenance-tagged option library
- Version-controlled (code, not DB) table of the 19 settings' allowed values.
- `character_type`: 9 options, provenance `ev:` (group 2104, nodes 142–166).
- 18 remaining settings: curated lists (4–10 options each, "Any" = unset/null),
  provenance `spec:` — wave-7 doctrine: published-spec options permitted **with tags**,
  superseding the wave-3 "Any-only" law for this surface only.
- Randomize draws from this library; validation (zod, unknown-keys-rejected) enforces it.

### 5. Prompt builder (deterministic)
- Renders a spec → stable natural-language prompt (portrait variant + full-body
  variant). Same spec in, same prompt out — no hidden randomness; seeds live in the
  provider call. Unset ("Any") settings are omitted, matching reference semantics.

### 6. Identity conditioning
- If the character carries a reference image, it conditions generation:
  openrouter → multimodal `messages` (image + prompt); zai →
  `images.generations.edit` (image + prompt). No LoRA training, no face-embedding
  pipeline (rejected routes in OPEN_SOURCE_CATALOG.md) — reference conditioning only
  for wave 7.

### 7. Motion presets (curated prompt library, spec:)
- Preset key → motion prompt table (e.g. walk-and-turn, wave-to-camera, runway walk,
  dance loop — clone-side curation; the reference's preset list is uncaptured).
- Motion job = character asset (full-body, fallback portrait) + preset prompt →
  `wan2.2-i2v-flash` i2v. Matches the reference's promised semantics (ev: 326).
- Character replacement (VACE/animate) is architecturally absent: the gateway doesn't
  expose it — disclosed as unavailable, not stubbed as fake success.

## Deployment shape

- Vercel (Next.js serverless + Neon Postgres) — existing runbook
  `docs/DEPLOYMENT.md`; new env vars: `HF_IMAGE_PROVIDER`, `HF_VIDEO_PROVIDER`,
  `OPENROUTER_API_KEY`, `DASHSCOPE_API_KEY` (station sets post-merge).
- The in-process worker's per-invocation `ensureWorker` semantics carry over; note
  OPEN_QUESTIONS.md Q3 (function duration vs 63 s image jobs) as the main deployment
  risk to burn down during station verification.
