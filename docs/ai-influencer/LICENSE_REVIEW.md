# License review — code vs model weights vs hosted-service terms

> Mission §9.4 law: a permissive repository license does not clear model weights,
> face-recognition components, datasets, or hosted-service terms. Each **deployment
> route** is assessed as a whole. Verification levels: **VERIFIED** (authoritative text
> surfaced via web search this session, 2026-10, or live-measured) · **REPORTED**
> (widely documented but not directly inspected this pass) · **NEEDS-LEGAL-REVIEW**
> (terms exist but require human legal reading before commercial reliance).
> This file is engineering research, not legal advice.

## Production route (wave-7 actual stack)

| Layer | Terms | Status | Notes |
|---|---|---|---|
| Our product code (`payswapdotorg/higgsfield`) | Private repo; we own it | VERIFIED (it's ours) | No upstream branding (mission §A/§17 gate) |
| **OpenRouter API** (image route on Vercel) | Platform Terms of Service: user's ownership rights in outputs are **set forth in the per-model terms**; model providers may process/retain inputs per their terms | VERIFIED (openrouter.ai/terms surfaced via search, Aug 2026 snapshot) — the *consequences* NEEDS-LEGAL-REVIEW | Platform use is commercial-permissive in practice; output rights are per-model, so the Google row below governs generated images |
| **Google Gemini image models via OpenRouter** (`google/gemini-2.5-flash-image`, `gemini-nano-banana-2.1`, `gemini-3-pro-image`, …) | Google's Generative AI terms apply upstream (via the provider chain) | NEEDS-LEGAL-REVIEW — **not verified this pass** | Before commercializing generated influencer imagery at scale, read Google's current output-use terms as surfaced through OpenRouter's model pages. Geo-availability is a separate operational issue (403 from sandbox egress — Task 77-78) |
| **Alibaba Cloud Model Studio / DashScope (intl)** | Alibaba Cloud International Website Product Terms + Model Studio service-specific terms govern the API | VERIFIED that the terms documents exist (help.aliyun.com legal pages surfaced via search) — exact output-rights reading NEEDS-LEGAL-REVIEW | Commercial use is supported in the terms framework; our measured usage (wan2.2 video task API) is a standard paid API call. Data-handling FAQ points to the terms for retention |
| **Wan2.2 model weights** (`wan2.2-i2v-flash` etc. behind DashScope) | Apache-2.0 | **VERIFIED** (Wan-Video/Wan2.2 LICENSE.txt surfaced via search) | Permissive; commercial use permitted. Note we consume them **hosted**, so the binding instrument is the DashScope terms; the Apache-2.0 tag matters for any future self-host |
| **z-ai-web-dev-sdk** (`@0.0.18`, sandbox platform SDK) | Sandbox-internal, **non-portable**: machine auth against a private 172.25.x endpoint (`internal-api.z.ai`) — unreachable outside the sandbox | VERIFIED (live probe, Task 77-78) | Used ONLY as the local/sandbox dev image route + docs tooling. Not a production dependency, no commercial claim, never ship it in Vercel env |
| Mock provider | n/a (deterministic fixture) | VERIFIED | Tests only — mock is never evidence of production function (mission rule 5) |

## Shortlist licensing (from OPEN_SOURCE_CATALOG.md / research-catalog.csv)

| Candidate | Code license | Model/weights status | Commercial bottom line |
|---|---|---|---|
| Wan2.2 | Apache-2.0 **VERIFIED** | Apache-2.0 weights | Clean — accepted (hosted) |
| MuseTalk | MIT **VERIFIED** (repo statement) | repo claims no commercial limitation (code) | Clean but unused |
| SamurAIGPT/AI-Influencer-Generator | MIT **VERIFIED** | base-model weights govern outputs | Reference only |
| AasthaShayla/character-studio | MIT **VERIFIED** | FLUX weights govern | Reference only |
| Open-Higgsfield-AI | MIT **VERIFIED** | upstream model APIs govern | Reference only |
| ComfyUI-Omnichar | **GPLv3 VERIFIED** | weights separate | Copyleft — rejected as dependency |
| InstantID | Apache-2.0 code **VERIFIED** | weights + face models carry **different, more restrictive conditions** (repo's own warning, VERIFIED via issue #26 + HF discussion) | Rejected — needs-legal-review |
| PhotoMaker | Apache-2.0 REPORTED | **InsightFace dependency non-commercial** (VERIFIED via issue #142) | Rejected — licensing trap |
| PuLID | Apache-2.0 REPORTED (not directly verified this pass) | InsightFace-class face models implicated | Rejected for wave 7; verify before any future adoption |
| LivePortrait | MIT REPORTED (not directly verified this pass) | **InsightFace detection models strictly non-commercial** (VERIFIED via kijai README + HF NOTICE; MediaPipe swap known) | Rejected — license friction |
| kavyabarnadhya/ai-influencer, mogretici/comfyui-influencer-v2, initchu/Wan2.2-Animate, qued02, davepartner, HumanAIGC/wan-animate | **UNVERIFIED** (not surfaced this pass) | unverified | Rejected; never adopt unverified-license code |

## Cross-cutting notes

1. **The InsightFace pattern.** The identity-conditioning OSS ecosystem (PhotoMaker V2,
   InstantID, PuLID, LivePortrait pipelines) leans on InsightFace detection/embedding
   weights that are **non-commercial**. This is the single most common silent trap in
   the shortlist and a key reason the hosted-API route (OpenRouter multimodal image
   generation) was chosen for identity conditioning.
2. **Code ≠ weights ≠ service.** Example: Wan2.2's Apache-2.0 does not by itself
   license the DashScope API (Alibaba terms govern) and would not by itself license a
   self-host deployment's *other* dependencies. Every future route re-runs this table.
3. **Identity references & privacy** (mission §9.5): uploaded face images are sensitive.
   Wave-7 clone-side controls: reference images are user-scoped (per-user characters,
   ownership-checked routes), stored as data on the character record, deletable via
   PATCH/DELETE, never used for training (no training exists in the stack), and the
   reference's own `ai_influencer_consent` setting (evidence: api-bodies-digest
   `settings` body) is mirrored in the clone's UserSettings model. Anti-impersonation
   safeguards = product ToS territory (NEEDS-LEGAL-REVIEW before public launch).
4. **Credits/billing**: clone credits are internal play-credits (demo), not real
   currency — no payment licensing surface in wave 7. Real provider spend
   (OpenRouter/DashScope) is station-funded via vaulted keys.
5. **Open questions for legal review before any commercial operation**: Google Gemini
   image output terms via OpenRouter; Alibaba Model Studio output/retention terms;
   publicity-rights/impersonation policy for user-uploaded references; product ToS for
   end users.
