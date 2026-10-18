# Ads Studio — Functional Parity Reverse-Engineering & Implementation Handoff

**Status:** implementation plan / not a completion claim  
**Repository:** `payswapdotorg/higgsfield`  
**Primary route:** `/ads-studio`  
**Related route:** `/ads-studio/ad-multiplier`  
**Evidence date:** 2026-10-18  
**Operating rule:** the repository, its evidence and acceptance reports are the source of truth; do not rely on chat-only instructions.

## 1. Executive decision

The current clone is not behind because it needs a nicer landing page. The main workflow is missing.

The current source confirms:
- `src/components/studios/ads-studio-landing.tsx` renders the hero and two tool cards, but its “Create ads” CTA is deliberately disabled because the actual workflow was not captured.
- `src/app/ads-studio/b/[brandId]/page.tsx`, `src/app/ads-studio/brand-research/[brandId]/page.tsx`, and `src/app/ads-studio/ad-multiplier/page.tsx` render disclosed placeholders.
- `src/app/ads-studio/all/page.tsx` points to an all-projects component whose own comments say the surface is not captured.
- Current tests exercise the generic generation pipeline (`tests/e2e.test.ts`), not the brand → product → ad-batch workflow.

**Do not spend the next wave polishing the landing page.** Build and test the end-to-end static-ad product first, then treat Ad Multiplier as a separate video-editing workstream.

### Observable product contract

Higgsfield's public Ads Studio material describes this workflow:
1. Start from a brand website, or create a brand kit manually.
2. Extract/import and let the user edit brand identity: logo, colors, fonts, tone, audience, visual aesthetics, description, selling points and social links.
3. Import product names/images/prices from the brand site; let the user add products by URL or upload them manually.
4. Select one or more products (public intro says up to 10 products), then request a batch of up to 20 ads per product.
5. Create distinct, product-grounded selling angles and finished **static** ads, with copy and visuals shaped by the same saved brand kit.
6. Review results, keep/discard, download selected ads, and generate more variations through chat by mentioning a known product.
7. Support the publicly shown social aspect ratios **1:1, 4:5 and 9:16**.
8. Save brand kits, products, research, batches and generations for later sessions.

Public reference material:
- [Ads Studio product page](https://higgsfield.ai/ads-studio)
- [Ads Studio introduction and workflow](https://higgsfield.ai/ads-studio-intro)
- [Higgsfield's Ads Studio walkthrough/pricing](https://higgsfield.ai/blog/higgsfield-ads-studio)

Public pages describe each static ad as a combination of product visuals, ad copy and brand style; example angles include offers/prices, ingredients/materials, usage and lifestyle. The public walkthrough says up to 20 ads can be generated per product. Pricing/credit amounts are provider/product-specific; do not hardcode an API cost as if it were a universal generation cost.

**Scope distinction:** current public descriptions say Ads Studio itself creates static ads. Ad Multiplier is a separate tool for taking a 4–30 second reference video and generating variants while attempting to preserve timing, cuts, framing and original audio. Do not mix these two generation problems into one adapter or claim that a new video generator is equivalent to source-video-preserving edits.

## 2. Reverse-engineering protocol using REA + other methods

Use REA to observe public/authorized product behavior and build a behavioral specification. Do not assume private server implementation can or must be recovered.

### Reference matrix to capture

Create a versioned matrix at `docs/HF-PROGRAM/ads-studio/reference-matrix.md`. Capture only flows that can be reached with legitimate account access and do not automate around CAPTCHA, rate limits, access controls or anti-bot defenses.

| Flow | Actions to perform | Evidence to retain |
|---|---|---|
| Landing | Open Ads Studio, enumerate buttons/links/tabs and visual states | Screenshot at fixed desktop/mobile viewports; DOM/accessibility tree; labels and route transitions |
| Create brand from website | Submit a controlled test domain; observe loading/errors and editable fields | Step-by-step screenshots; UI state transitions; sanitized request/response schemas if authorized and observable |
| Manual brand kit | Fill required and optional fields, logo, colors, fonts, tone, audience, selling points, socials | Required-field and validation matrix; persistence behavior |
| Product import | Review imported products; open product detail; add by URL; upload a product image | Product fields, image-selection rules, empty/error/duplicate states |
| Static batch | Select product(s), choose counts/aspect ratios, inspect price/credit estimate, submit, poll results | Job transitions, batch limits, cost display, retry/cancel behavior, output-card metadata |
| Review/export | Select, discard, download one and many ads, reload history | File type/dimensions/naming, saved/discarded state, history semantics |
| Chat variations | Mention an existing product, ask for a new angle, request 1–2 creatives | Product-reference semantics, whether copy/visuals or both are changed |
| Ad Multiplier | Upload an owned or permission-cleared 4–30 second test video and reference assets; inspect options/results | Duration rules, supported input caps, quality options, audio/timing behavior, job state and output format |

For each capture, record: UTC timestamp, target route, viewport, preconditions, exact user action, expected observation, actual observation, evidence filename, confidence level and unresolved questions. Keep screenshots and redacted payload-shape evidence, not credentials.

### REA workflow

1. Re-run the relevant REA page inspection at `https://higgsfield.ai/ads-studio`; save the full capture under a new dated directory rather than silently overwriting the 2026-10-17 evidence.
2. Use accessibility/DOM inspection to enumerate controls and the transitions available from the live route. Collect screenshot before and after each action.
3. Observe request names, methods, status codes, non-secret request-body shapes and response-body shapes only where allowed. Normalize payloads and redact bearer tokens, cookies, account identifiers, session IDs, anti-bot client IDs and signed URLs.
4. Compare the reference and clone with the same test data and viewport. Build tests from observable behavior, not from guessed private implementation details.
5. If a flow is blocked by a challenge, permission gate or missing account entitlement, document the blocker and stop. Do not bypass it. Use the documented public API, an open model provider or a deterministic test adapter for implementation work instead.

### P0 public-evidence hygiene

The repository's evidence index currently describes `evidence/rea-2026-10-17/net-capture-with-auth-headers.jsonl` as a full request/response capture that includes auth headers. It is in a public repository path. Treat this as a possible credential/session exposure until audited.

- Immediately audit all committed evidence for `Authorization`, `Cookie`, Clerk JWT/session tokens, API keys, signed URLs, anti-bot IDs and personal identifiers.
- Revoke/invalidate affected sessions or tokens where applicable.
- Replace raw captures with sanitized payload-shape fixtures; keep an access-controlled local original only when there is a legitimate need.
- Remove secrets from Git history (not just the current file) and verify that CI artifacts and deployment logs did not republish them.
- Add automated secret scanning and a “no auth headers in committed evidence” test.
- Do not append any new raw authenticated captures until this is done.

This item is a separate security repair, not a reason to abandon REA.

## 3. Credible implementation routes and open-source survey

No single mature open-source project surfaced that is a drop-in clone of the full Higgsfield brand import → market-informed product ads → saved brand kit → reusable generation workflow. The useful projects cover different layers. Run a bake-off through one shared interface rather than independently building three incompatible products.

### Route A — official Higgsfield Ads Studio workflow API (fastest quality baseline; not open source)

Reference: [Higgsfield Ads Studio API playground](https://open.higgsfield.ai/models/workflows/ads-studio/playground)

The publicly documented example uses `@higgsfield/client/v2`, workflow `higgsfield/ads-studio/v1.0`, and inputs such as `niche`, `prompt`, `language`, `batch_size`, `image_urls`, `aspect_ratio` and `target_audience`.

Use this only as an **optional, explicitly configured provider** using authorized API credentials and in accordance with the provider's terms. Never call or copy private `fnf` endpoints, impersonate the web app's user session, or scrape private credentials. The API is not a clone implementation, but it can provide:
- a fast quality ceiling/reference for generated static-ad output;
- a fallback route for customers who choose to pay for the official service;
- a known-good benchmark for comparing our independent adapters.

Requirements: provider-specific adapter; credentials stored as server-side secrets and never returned to the browser; clear cost estimate; timeout/retry/idempotency handling; provider output retained under our own job and asset records. Keep the app useful when this provider is unconfigured.

### Route B — fork/adapt the MIT Branda ad-maker pattern (best starting point for a shippable website-to-ads flow)

Repository: [context-dot-dev/ad-maker](https://github.com/context-dot-dev/ad-maker) — MIT.

Why it is relevant: it already implements domain → brand data/style → product extraction → creative direction/copy → multiple image-model calls → streaming results/download. Its README describes 12 creative directions and a multi-model pipeline. This is the closest discovered source project to the **static advertising workflow**.

Caveats:
- It relies on Context.dev APIs for parts of brand extraction/scraping/styleguide/product extraction, and on external image-generation APIs. That is not a completely self-hosted system.
- If code is reused, retain the MIT notice and follow dependencies' own terms. The external Context.dev/API dependency must be swappable; avoid locking our business logic to one proprietary data extractor.
- Its current output/UX is not automatically Higgsfield-parity: adapt it to saved brands, multi-product batches, 1:1/4:5/9:16, editable product catalog, per-product history, product mentions and the existing HF Studio job/credit conventions.

Recommendation: use this for the first functional baseline, or reproduce its architecture cleanly if a dependency or license audit rules out code reuse.

### Route C — Chinese-language e-commerce pipelines (high relevance; audit maturity before adopting)

- [MediaForge](https://github.com/arjun-go-go/mediaforge) — MIT. Chinese-language e-commerce content platform. README describes product catalogs, text/image/BM25 hybrid reference retrieval, popularity/reference search, platform-specific rules, multi-model image generation, asynchronous batches, quality checks and repair loops. It explicitly calls itself early-stage and says APIs/flows may change; use as architecture and workflow reference, not as assumed production-ready code. It relies on external models/services.
- [AI Product Image Generator](https://github.com/pang-qin/ai-product-image-generator) — MIT. FastAPI + Vue application for product/scene image uploads, 3×3 product presentations, product-to-scene composition, batch jobs, progress, configurable model parameters and asset history. Strong reference for job orchestration and product imagery; it does not supply the full brand-research/copy pipeline by itself.
- [Product Poster AI](https://github.com/chaochaoji/product-poster-ai) — MIT. Product attribute recognition → multi-platform marketing copy → image prompts/posters; useful for the product-understanding/copy side. Validate the actual runnable path and dependencies before integrating.
- [ComfyUI E-Commerce Workflows](https://github.com/xiaoqahax-ui/comfyui-ecommerce-workflows) — Apache-2.0. ComfyUI workflows and scripts for background replacement, try-on, product-detail layout and batch processing. Good candidate for the image-generation adapter, not a substitute for the brand/project database or website ingestion.

Treat all repository descriptions as leads to verify. Pin a commit, install in isolation, run its documented smoke test and inspect dependency/model licenses before copying code or making a quality claim.

### Route D — self-hosted / open-weight models and ComfyUI

Useful candidates found:
- [Qwen Image 2512 advertisement/product-photography LoRA](https://huggingface.co/RayyanAhmed9477/qwen-image-2512-lora-advertisement) — the LoRA page lists Apache-2.0. It is a generation adapter, not a full ad application. Verify the base model and dataset/license implications separately; do not assume a model card alone clears every commercial use.
- [AI Product Photography Space](https://huggingface.co/spaces/Jaroliya/AI-Product-Photography) — includes ComfyUI workflow JSON, a websocket API wrapper and Gradio app. The Space was reported sleeping in the inspected listing, so treat it as a workflow sample, not a reliable hosted service.
- [Product Background Generation](https://github.com/noradodev/Product-Background-Generation) — MIT Diffusers pipeline for removing the source background and generating a replacement.
- [ComfyUI FLUX.2 JSON Prompt Builder](https://github.com/MushroomFleet/ComfyUI-FLUX2-JSON) — MIT prompt-structure/custom-node helper for product-scene composition; it is a helper, not the end-to-end ads product.
- [ProductSnapAI](https://github.com/ai-kadhim/ProductSnapAI) — Stable Diffusion notebooks/model fine-tuning for apparel/product imagery. Its README describes a narrow apparel dataset; assess scope and licensing before treating it as a general-purpose backend.

Self-hosting can lower marginal API costs and improve controllability, but it introduces GPU capacity, model-serving, image consistency, update and operations costs. **Do not build the whole product around the belief that “open weights = free inference.”** Keep it as a provider adapter and benchmark it against hosted models.

### Route E — generated video ads (adjacent, not equivalent to Ad Multiplier)

- [AI_AD_GEN](https://github.com/hardbosamiya/AI_AD_GEN) describes a pipeline from product images to scene planning, generated clips, voice-over, captions and final 9:16 video; it relies on external Gemini, DEAPI, ElevenLabs and Whisper services. A repository license file was not found during this audit, so use it as a feature/architecture lead only—do not copy code without resolving permission.
- The open-source e-commerce pipelines above can help create stills, but the survey did **not** identify a mature drop-in open-source implementation of Higgsfield's video Ad Multiplier semantics (replace selected products/characters/locations while preserving the existing edit, motion, timing and original audio).

Implement Ad Multiplier as a separate experiment:
1. Ingest/validate source video (documented reference says 4–30 seconds) and user-authorized assets.
2. Use FFmpeg/ffprobe to retain exact duration, frame rate, audio track and shot boundaries; sample keyframes.
3. Detect/tracks masks for regions to replace, and record per-shot replacement instructions.
4. Evaluate two adapters independently: (a) an authorized commercial video-edit API, (b) an open-source mask/inpaint/video-consistency workflow orchestrated through ComfyUI.
5. Keep original audio and cuts by default; composite new hook/script/CTA as a separate editable overlay, unless the user asks to regenerate audio.
6. Be honest about failure modes. If an adapter regenerates whole shots or changes timing, label it a “recreated variant,” not a faithful Ad Multiplier.

### Discovery across platforms

The sweep included GitHub, Hugging Face models/Spaces, ModelScope Studios, and indexed Gitee/GitCode searches in English and Chinese. The directly useful results above were stronger than any exact drop-in app surfaced on the Chinese-code-host queries. ModelScope is still worth checking for current Qwen-Image demos and LoRAs, but a hosted Studio/model checkpoint should not be mistaken for licensed source code or an end-to-end product. Repeat this inventory in the repo before final model selection and record date, commit, license, base-model license, dependencies, GPU requirements, run command, example output and quality score.

## 4. Recommended architecture

Use one domain workflow with pluggable generation adapters. Do not create one separate frontend/product per provider.

### Domain records

Add Prisma models/migrations (first inspect the current main-branch schema and deployment docs; do not blindly follow the older SQLite description in stale docs):

- **BrandKit** — owner/workspace, name, website, description, logo asset key, colors, display/body fonts, tone, audience, aesthetics, selling points, socials, source URLs, extraction status/version.
- **AdProduct** — brand ID, name, description, SKU/slug where available, price/currency, source product URL, image asset keys, product facts and provenance URLs, editable user overrides.
- **BrandResearch** — source pages, extracted facts, category insights, selling angles, evidence URL(s), timestamp/model and confidence. User-facing “research” claims must be grounded in cited product/site facts.
- **AdBatch** — owner, brand, selected products, requested count per product, ratios, creative brief, provider/model, estimated and actual cost, idempotency key, state/timestamps/error.
- **AdCreative** — batch/product IDs, aspect ratio, angle key, headline/body/CTA, rendered asset key, source product facts, provider metadata (never credentials), QC results, review status and timestamps.
- **AdJobEvent** or reuse the existing generic job/event mechanism if it already covers durable progress well. Preserve job history on page reload and make retriable failures visible.

Use existing auth, object storage, job/worker and credit ledger patterns where sound. Before extending the current generic `Generation` model, decide explicitly whether ad creatives are a subtype of generation or a separate entity; write the decision in the architecture doc and add a migration test.

### Pipeline

1. **Website intake, safely.** Validate URL scheme; block loopback/private/link-local/metadata IPs on every redirect and resolved address; constrain redirects, body size, content type, timeout, page count and crawl depth. Protect against DNS rebinding and SSRF. Extract structured product data/JSON-LD, metadata, images, price, brand text and CSS color/font cues. Use sitemap and product pages where allowed. Never treat arbitrary URL fetching as an unrestricted proxy.
2. **Reviewable extraction.** Show extracted logo, palette, fonts, tone, audience, selling points and products in editable forms. Keep source URLs beside facts so the user can fix wrong imports. Support manual brand kit and product upload regardless of website quality.
3. **Research and concepts.** Generate distinct selling angles from sourced product attributes, actual offers, category context and audience. Build a concept record before invoking the image model; don't let one model invent price, ingredients, certifications, health claims or product features. For unsupported claims, omit the claim or ask the user to confirm it.
4. **Visual creation.** For each concept, produce a scene/background with a provider adapter. Favor reference-conditioned editing when a source product photo exists. For strong product fidelity, segment/cut out the actual product and composite it into the generated scene with controlled shadow/reflection rather than trusting a full text-to-image output to reconstruct exact packaging.
5. **Deterministic ad layout.** Render logo, price, headline, copy, disclaimers and CTA using HTML/SVG/Canvas/Sharp, with typography from the brand kit and platform safe zones. Avoid asking a diffusion model to spell exact brand names, prices or CTA text. Run OCR/spell/layout checks on the rendered result.
6. **Batch orchestration.** Generate incrementally, show per-creative queued/running/done/failed states, retry transient failures with bounded backoff, deduplicate by idempotency key and preserve completed outputs when one item fails. Do not charge twice on retry. Store prompt/version/provider metadata so a result can be reproduced.
7. **Review/export.** Grid and full-size view; edit copy/CTA; mark keep/discard; regenerate one variation; download one creative or a ZIP of selected creatives; persist history; support “make more like this” and product references in chat.
8. **Model router.** Expose a common interface similar to:
   `generateStaticAd({ product, brandKit, concept, aspectRatio, referenceImages, quality }): Promise<AdAsset>`.
   Implement adapters behind a feature flag and normalize errors/progress/cost. Required adapters for the bake-off: mock fixture adapter, official Higgsfield workflow API adapter (opt-in), Branda-like multi-provider image route, and ComfyUI/open-weight route.
9. **Observability.** Persist job correlation ID, provider latency, estimated/actual cost, retry count, QC failure reasons and user keep/discard choice. Never log user secrets, full auth headers or sensitive upload URLs.

## 5. Test-first plan and parallel work orders

Use TDD: write tests from the reference matrix before implementation, prove the new tests fail against today's placeholder behavior, then make them pass. Keep worker branches small and deliver evidence with each PR.

### Wave 0 — safety + observation (blocking)

**Worker 1: REA and acceptance harness**
- Inventory and sanitize existing REA evidence, resolve the public auth-header exposure noted in §2 before capturing again.
- Capture the complete authorized brand/product/static-batch/export workflow, or document each inaccessible step and its blocker.
- Create `docs/HF-PROGRAM/ads-studio/reference-matrix.md`, a sanitized fixture pack and a reference screenshot set.
- Add Playwright route/navigation tests and a test that fails if “Create ads” is disabled or brand/ad-multiplier routes render the generic placeholder.

**Exit:** a behavior matrix with evidence for every implemented claim, no new secrets committed, baseline screenshots reproducible.

### Wave 1 — domain + brand intake

**Worker 2: Brand kit and products**
- Add failing unit/integration tests for manual brand creation, URL intake, product extraction, editable overrides, product uploads and persistence.
- Implement BrandKit, AdProduct and source provenance.
- Add fixture sites for a product catalog, an SaaS/no-catalog business, a broken site, redirect-to-private-IP rejection, oversized responses and malformed JSON-LD.
- Build the “create from URL” and “create manually” experiences and a functional brand workspace.

**Exit:** website import and manual entry both produce editable, persisted brand/product records; safe URL tests pass.

### Wave 2 — static generation through one vertical slice

**Worker 3: Ad jobs and provider adapters**
- Define an adapter contract and deterministic fake provider first.
- Add failing API/e2e tests for one product × one ad, a multi-ad batch, 1:1/4:5/9:16 output, incremental completion, one-item failure, retries, idempotency, cost preflight, persistence and download.
- Implement concepts/copy and the first useful rendering pipeline. Prefer deterministic text/layout and exact product-image compositing.
- Reuse the existing worker/ledger conventions only after verifying they support batch partial success and provider-specific actual cost.

**Exit:** brand → product → batch → review → download works end to end with the fake adapter; no “demo-only” main CTA remains.

### Wave 3 — parallel provider bake-off

Run the exact same input set through three isolated branches/adapters:
- **A: official API reference adapter**, enabled only by explicit server-side config and authorized credentials;
- **B: Branda-like multi-provider route**, using the MIT project as a reference or properly attributed code base;
- **C: ComfyUI/open-model route**, using reviewed Qwen-Image/FLUX/SDXL workflows and appropriate product-preservation steps.

All outputs must enter the same `AdCreative` records and review grid. Workers must not fork the domain schema or design different provider-specific UX.

Benchmark at least 20 test products across food/drink, cosmetics, apparel, consumer electronics and one non-physical/SaaS example. Use the same brand facts, product source images, ad angle, count and aspect ratio across adapters. Save prompt/config, generated images, cost, latency and QC scores.

**Exit:** choose the default provider by evidence; document the winner and trade-offs. Keep other adapters optional only if their output/latency/cost trade-offs justify maintenance.

### Wave 4 — quality and product completion

- Add diverse concept templates: product hero, offer/price, feature/benefit, ingredient/material, usage, lifestyle/moment, audience pain point and seasonal campaign.
- Add batch selection, copy edit, redo-one, chat variations with explicit product mention, history, keep/discard and ZIP downloads.
- Add image asset ownership and delete/retention rules.
- Add OCR, typography overflow, aspect ratio, product similarity/fidelity and unsupported-claim checks.
- Replace generic placeholder cards with designed, functional product surfaces. Preserve the HF Studio product UI—not ZCode branding or a generic provider playground.

### Wave 5 — separate Ad Multiplier prototype

Do not call it complete until source-video fidelity is tested. Implement it behind its own capability flag and compare commercial/edit API vs open-source video-mask/inpaint routes. Explicitly test whether the output preserves source audio, duration, shot boundaries and framing. If open models cannot meet those criteria, ship the honest lower-fidelity mode as “recreate this ad” rather than claiming the reference video was preserved.

## 6. Minimum TDD acceptance suite

### Unit tests
- Brand field normalization, hex palette validation, URL/source provenance and manual overrides.
- Product facts cannot be promoted into ad claims unless tied to source data or explicitly user-confirmed.
- Concept planner emits distinct angle IDs, avoids duplicate semantic copy, and preserves brand tone.
- Aspect ratio dimensions and text safe zones.
- Adapter input/output schema and provider error normalization.
- SSRF defenses for redirects, DNS-resolved private addresses, non-HTTP schemes, userinfo URLs, huge bodies and timeout handling.

### API/integration tests
- Create, read, update and delete brand/product records under correct tenant/owner.
- One product, multiple products, each batch size boundary and each supported ratio.
- Partial-success batch: failed item does not erase successful creatives.
- Duplicate submission with the same idempotency key does not duplicate charges/jobs.
- Provider timeout, transient error, permanent error, worker restart and retry exhaustion.
- Correct estimated-cost confirmation and ledger reconciliation; never double-debit on retry.
- Upload validation, object ownership, download authorization and ZIP export.
- Provider missing/disabled: UI shows an actionable error and manual/other provider path, not a false success.

### Browser E2E / visual regression
- Create brand via URL → review/edit → import products → generate 4–5 creatives → wait for completion → edit copy → keep two → download selection → reload and verify history.
- Create brand manually without a website.
- Add product by URL and upload; handle unavailable image and no-catalog website.
- Generate more ads for an existing product through “Mention a product.”
- Responsive desktop and mobile layouts; keyboard navigation and accessible labels.
- Golden screenshots for every important state: empty, loading, extraction review, product picker, preflight/cost confirmation, running batch, partial failure, results grid, creative editor and export confirmation.

### Quality gate (no “on-par” claim before measured)
- Blind human review on at least 100 creatives from the fixed benchmark, spanning the five categories and all three aspect ratios.
- Rate 1–5 on product fidelity, brand consistency, copy accuracy, typography/layout, concept diversity and overall usefulness.
- Initial release gate: median ≥4/5 for brand consistency, factual copy and typography/layout; ≥80% of outputs judged usable without a full regeneration; **zero** fabricated prices/discounts/certifications/health claims; zero garbled logos/brand names in the accepted set.
- Record a comparison gallery against the authorized reference examples; report categories where parity is not achieved rather than averaging away failures.
- Track first-result latency, batch completion time, provider failure rate and cost per accepted creative; no one-size-fits-all threshold is meaningful until measured on each adapter.

## 7. Delivery rules and repo artifacts

The TL coordinates and verifies; workers implement on isolated branches. Each work order must specify owner, branch, exact files allowed, tests expected, evidence filenames and merge/rollback strategy. Do not let workers change provider adapters and the shared schema in parallel without agreeing on the contract first.

Every PR must contain:
1. concise implementation summary and limitations;
2. exact test commands and real outputs;
3. sanitized screenshots and/or sample output assets;
4. provider/model/config/commit details and a license/terms check;
5. cost/latency and benchmark rows for generated creatives;
6. updated reference matrix, status and architecture notes;
7. confirmation that no secrets or raw auth headers were introduced.

Update `docs/HF-PROGRAM/PROGRAM-STATUS.md` only with evidence-supported status. The broad product program's “complete” label does not mean Ads Studio has functional parity while the primary CTA, brand workspace and Ad Multiplier remain placeholders.

## 8. Final recommendation

Start with **Route B's static-ad architecture** because it is the closest available open-source workflow. Keep **Route A** as an opt-in quality reference/provider, and **Route D/ComfyUI** as the open-weight alternative. Use the same data model, test suite and evaluation set for all routes. Make static Ads Studio demonstrably functional before attempting the harder video-preserving Ad Multiplier feature.

The definition of done is not “route returns HTTP 200” or “the UI resembles the screenshot.” It is: users can import or define a brand, choose real products, create fact-grounded and visibly on-brand static ads at supported sizes, review and export real assets, return later to the saved work, and do so through provider adapters that are tested, measurable and replaceable.
