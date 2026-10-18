# Open-source catalog — mission §F shortlist + §4.5 routes

> W7-A research pass (docs-only). Verification law: license/activity claims are marked
> **verified** (web search surfaced the LICENSE text / authoritative statement this
> session, 2026-10) or **unverified** (search did not surface it — inspect the repo
> before any use). Nothing is fabricated; unknown stays unknown. Machine-readable
> companion: [research-catalog.csv](research-catalog.csv) (mission §4.5 field set).
>
> **Program context for every decision:** wave 7 runs on **hosted APIs** — OpenRouter
> (Gemini image family) for images on Vercel, Alibaba DashScope-intl (`wan2.2-i2v-flash`)
> for video, and the platform `z-ai-web-dev-sdk` locally in the sandbox; mock for tests.
> No self-hosted GPU inference exists in this deployment, so OSS candidates are
> evaluated as (a) future self-host routes, (b) design references, or (c) rejected.

## Mandatory shortlist (mission §F)

### 1. AI Influencer Generator — `SamurAIGPT/AI-Influencer-Generator`
- **What:** SD image generation + consistent-character + gTTS + SadTalker talking-face
  animation + social-content pipeline (persona → script → speech → animation).
- **License:** MIT — **verified** (LICENSE text surfaced by search: "Permission is
  hereby granted, free of charge…").
- **Decision: REJECT as an integration; ACCEPT as a workflow reference.** Rationale:
  the persona-to-content decomposition (image → voice → animation as separate stages)
  informs our motion/history feature decomposition, but the pipeline is a local-GPU
  research app; nothing here outperforms our hosted routes, and SadTalker-class
  talking-heads are out of wave-7 scope.

### 2. Local AI Influencer — `kavyabarnadhya/ai-influencer`
- **What:** DreamBooth-LoRA character pipeline + ComfyUI + identity-consistency
  scoring; documents an IP-Adapter alternative.
- **License:** **unverified** (search did not surface the repo or its license).
- **Decision: REJECT for wave 7.** Rationale: character-specific LoRA training is a
  local-GPU workflow (mission Route 2) that our hosted-API deployment cannot run; the
  *idea* (trigger-token persona + automated consistency scoring) is banked for a future
  self-host route. Not adopted as code or dependency in any form.

### 3. ComfyUI Influencer v2 — `mogretici/comfyui-influencer-v2`
- **What:** ComfyUI pipeline: FLUX.2 Dev + custom face LoRA + IP-Adapter + face
  refinement + pose control + upscaling; published hardware requirements are
  "substantial" (mission §4.1).
- **License:** **unverified** (search did not surface the repo).
- **Decision: REJECT for wave 7; retain as a quality benchmark reference.** Rationale:
  this is the high-effort photorealistic ceiling of the mission's Route 1/2 stack, but
  it needs a local GPU farm; our identity-consistency comparisons use it only as a
  conceptual benchmark for what a premium local route achieves.

### 4. Character Studio — `AasthaShayla/character-studio`
- **What:** single-file Gradio tool on ComfyUI+FLUX: lock the face → establish a
  full-body master → manage wardrobe changes while protecting the character.
- **License:** MIT — **verified** (LICENSE file surfaced by search).
- **Decision: ACCEPT as a design reference; REJECT as runtime.** Rationale: its
  canonical-character-first workflow (lock identity → derive variations) is exactly the
  mission §3.2/§5.3 model our Character record + portrait/full-body + regenerate flow
  implements. No code is imported; the UX pattern is banked.

### 5. PuLID — `ToTheBeginning/PuLID`
- **What:** identity-customization (FLUX / SDXL-family) with reference-based
  generation; NeurIPS 2024.
- **License:** Apache-2.0 is widely reported but **not directly verified this pass**;
  also depends on InsightFace-class face models (a known non-commercial trap — the
  repo's own issue #26 discusses an insightface-free variant).
- **Decision: REJECT for wave 7 (future self-host candidate).** Rationale:
  reference-conditioned generation without per-character training is precisely our
  identity route conceptually — but we execute it through OpenRouter's Gemini image
  models with the reference image in the prompt. PuLID becomes relevant only if we
  stand up GPU inference. Re-evaluate then (with license + face-model verification).

### 6. PhotoMaker (V2) — `TencentARC/PhotoMaker`
- **What:** personalized realistic generation from identity stacks; ControlNet /
  T2I-Adapter / IP-Adapter integrations.
- **License:** code Apache-2.0 reported, **not directly verified this pass**; PhotoMaker
  V2's InsightFace dependency introduces non-commercial considerations — **verified**
  via the repo's own issue #142 ("insightface… indeed non viable for commercial
  purposes").
- **Decision: REJECT.** Rationale: the InsightFace licensing trap makes the
  reference-conditioning route commercially unclear, and hosted APIs cover the need.
  Not adopted.

### 7. InstantID — `instantX-research/InstantID`
- **What:** zero-shot identity-preserving generation from a single image.
- **License:** code Apache-2.0 — **verified** (LICENSE file surfaced: "Apache License
  Version 2.0"); the repo itself warns code vs checkpoints vs face models carry
  different conditions — **verified** via issue #26 and the HF model discussion
  ("unfortunately, this is non commercial" re weights).
- **Decision: REJECT.** Rationale: explicitly split licensing across code/weights/face
  models = needs-legal-review before any commercial deployment; hosted route avoids it.

### 8. ComfyUI-Omnichar — `omnichar/ComfyUI-Omnichar`
- **What:** portable `.char` format packaging character references + description +
  optional LoRA, with ComfyUI workflows for image and video models.
- **License:** GPLv3 — **verified** (LICENSE file surfaced; "conditioned on making
  available complete source").
- **Decision: REJECT as a dependency; note as a format idea.** Rationale: GPLv3
  copyleft is incompatible with our closed product code; the *concept* of a portable
  character package maps onto our canonical Character spec (JSON + reference + asset
  links), which we own. No import/export compatibility promised.

### 9. Wan2.2 — `Wan-Video/Wan2.2` ✅ ACCEPTED (hosted)
- **What:** Alibaba's open video suite; includes `Wan2.2-Animate-14B` (unified
  character animation + replacement) and t2v/i2v models.
- **License:** Apache-2.0 — **verified** (Wan-Video/Wan2.2 LICENSE.txt surfaced by
  search; permissive, commercial use permitted).
- **Decision: ACCEPT — via the DashScope-intl hosted API, not self-hosted weights.**
  Rationale: our production video route is `wan2.2-i2v-flash` on DashScope (measured:
  real MP4 in 43 s, Task 77-78), which works everywhere including Vercel and needs zero
  GPU infrastructure. Apache-2.0 weights + a commercial API = cleanest licensing story
  in the shortlist. **Caveat:** the hosted gateway does NOT expose the Animate/VACE
  modes (probe-verified), so character replacement is unavailable — motion =
  preset-prompt i2v.

### 10. LivePortrait — `KwaiVGI/LivePortrait` (org now `KlingAIResearch/LivePortrait`)
- **What:** efficient portrait animation / retargeting / editing.
- **License:** MIT code widely reported but **not directly verified this pass**; the
  InsightFace detection models it uses are strictly non-commercial — **verified** via
  kijai/ComfyUI-LivePortraitKJ README ("Insightface is strictly for NON-COMMERCIAL
  use") and a HF NOTICE ("LivePortrait's licence asks commercial users to replace
  InsightFace's detection models" — MediaPipe is the known swap).
- **Decision: REJECT for wave 7.** Rationale: portrait-animation (face-driven) is a
  narrower capability than the reference's full-body motion presets; commercial use
  requires an InsightFace replacement; hosted wan2.2 i2v covers the motion need.

### 11. MuseTalk — `TMElyralab/MuseTalk`
- **What:** real-time lip-synced talking-head video.
- **License:** MIT — **verified** (repo statement surfaced: "no limitation for both
  academic and commercial usage").
- **Decision: REJECT.** Rationale: talking-head/lip-sync is out of wave-7 scope (the
  reference hero promise is full-body motion presets, ev: 326); clean license, no use
  case now. Watch if audio-driven influencer content becomes a requirement.

### 12. Open-Higgsfield-AI — `juninhoomar/Open-Higgsfield-AI` (now `Autom8AI/Open-Higgsfield-AI`)
- **What:** open-source multi-model creative studio (image, video, image-to-video,
  lip-sync) with a unified provider service.
- **License:** MIT — **verified** (search surfaced "Self-hosted, customizable, MIT
  licensed" + LICENSE references).
- **Decision: REJECT as a code dependency; ACCEPT as an architecture reference.**
  Rationale: studying its unified provider-service pattern validated our two-interface
  (image/video) provider layer with env-gated selection; adopting another studio's
  codebase would import branding, conventions and surface mismatches — our own
  evidence-first product code stays.

## §4.5 Route J — Wan2.2 digital-human adaptations

| Repo | Verification status | Decision |
|---|---|---|
| `initchu/Wan2.2-Animate` | **unverified** — search surfaced only the official Wan-Video/Wan2.2 repo; treat as an unofficial adaptation of unknown provenance/license | **REJECT — watch-list.** Not adopted; if a self-host Animate route is ever built, use the official Apache-2.0 upstream |
| `qued02/Wan2.2-digital-human` | **unverified** — search did not surface the repo | **REJECT — watch-list** (stylized-character fidelity + long-range motion-consistency ideas noted) |
| `davepartner/wantudowhat` | **unverified** — search surfaced only the author's profile | **REJECT — watch-list** (web-interface-for-animation idea noted) |
| `HumanAIGC/wan-animate` | Repo verified to exist ("project page for Wan-Animate"); org publishes Apache-2.0/MIT repos but this repo's license **not directly verified**; the Wan-Animate model itself is upstreamed into official Wan2.2-Animate-14B | **REJECT — watch-list.** The unified animation+replacement concept matters, but the hosted gateway lacks the animate mode (probe-verified), so neither this nor official Animate is reachable for wave 7 |

## §4.5 Route K — ModelScope digital-human workflows + discovery channels

- **ModelScope community** (talking-character tutorial, `community.modelscope.cn`):
  research channel only. The mission's own caveat applies and is adopted as law here:
  talking-head animation ≠ Higgsfield-style full-body motion transfer — never
  substitute one for the other. **Decision: monitor, do not adopt.**
- **Discovery channels covered this pass:** GitHub (primary — the shortlist above),
  Hugging Face (model listings referenced via the mission doc's categories; licenses
  spot-checked via HF discussions), web search across GitHub/HF/Reddit indexes.
  **Not systematically covered:** Gitee, OpenXLab, ModelScope repo search,
  Chinese-language queries (AI数字人开源项目 etc.). This pass is therefore **not
  exhaustive** and does not claim to be (mission §4.5 law); the channels above remain
  open for a follow-up research pass if a self-host route is ever green-lit.
- **Extra row noted:** `kijai/ComfyUI-WanVideoWrapper` (mission §4.3 table) — ComfyUI
  orchestration for Wan models; same reject rationale as other ComfyUI routes (no
  ComfyUI infrastructure in this deployment), kept in the CSV for completeness.

## Bottom line

One acceptance: **Wan2.2 via the hosted DashScope API** (Apache-2.0 weights, measured
working). Three design-reference adoptions (no code): AI Influencer Generator,
Character Studio, Open-Higgsfield-AI. Everything else is rejected with recorded
rationale — dominated by the hosted-API architecture decision, licensing traps
(InsightFace everywhere, InstantID weight terms, Omnichar GPLv3), or missing
infrastructure (local GPU/ComfyUI). Re-evaluation triggers: a self-host GPU route
(PuLID/PhotoMaker/InstantID/ComfyUI family), a gateway exposing VACE/Animate
(character replacement), or an audio-driven content requirement (MuseTalk).
