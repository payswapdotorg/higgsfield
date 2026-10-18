# Image route benchmark — LIVE MEASURED (Task 77-78 station probes; Task 85 station probes)

> Law: every number below is a live measurement or an explicit `null` (not yet
> measured). Nothing is invented; null stays null. Probe dates: 2026-10-17/18
> session (worklog Task 77-78) and 2026-10-18 (worklog Task 85). Quality scores
> are all null — quality evaluation happens via IDENTITY_EVALUATION.md, not
> here.

## Measured results

| Route | Call | Result | Wall time | Cost | Notes |
|---|---|---|---|---|---|
| **zai SDK image** (`z-ai-web-dev-sdk@0.0.18`, `images.generations.create`) | `{prompt, size:1024x1024}` (red-circle test) | **real JPEG** (valid image, verified) | **63,228 ms** | null (platform-included) | Sandbox-only route (private network auth — see KNOWN_LIMITATIONS) |
| **OpenRouter text (control)** | paid chat completion, `deepseek v3.1` | real completion | null (not recorded) | **$0.00000316** | Proves the account can spend and the key works |
| **OpenRouter image models** | all 12 image-output models | **403 "not available in your region"** | n/a | n/a | **Geo-gate from the sandbox egress only** — incl. `google/gemini-2.5-flash-image`, `google/gemini-nano-banana-2.1`, `google/gemini-3.1-flash-image`, `google/gemini-3-pro-image`, `openai/gpt-5-image`. Vercel us-east-1 egress is expected to pass — **verification pending post-deploy** |
| **DashScope intl image (compatible-mode)** | `qwen-image-3.0` / `wan2.7-image` / `z-image-turbo` | **DEAD** — gateway returns empty `message.content` (echo response) | ~46 s (qwen-image-3.0 attempt) | null | Pre-prod gateway mock; not an image route |

## OpenRouter image pricing observed during the probe (gateway-listed)

| Model | Listed price |
|---|---|
| `google/gemini-2.5-flash-image` | $0.0000003/image prompt + $0.0000003 completion per token |
| `google/gemini-3-pro-image` | $0.000002 per image |
| `google/gemini-nano-banana-2.1`, `google/gemini-3.1-flash-image`, `openai/gpt-5-image` | listed on the models page (values null here — not recorded in the probe notes) |

Response shape for image models (per OpenRouter docs, cited Task 77-78):
`choices[0].message.images[].image_url.url` → `data:…;base64` — the adapter contract
for the openrouter image provider.

## Not yet measured (null)

- Vercel-side OpenRouter image generation latency/success/spend — RESOLVED as
  moot by Task 84's live verification: image jobs answer **HTTP 402** (requires
  ≥ $1.00 balance) from the Vercel egress; the geo-gate passed but the credit
  minimum did not. Generation itself never ran.
- Latency/cost of `google/gemini-3.1-flash-image` / `gpt-5-image` / `nano-banana-2.1` (any egress).
- Reference-image (identity-conditioned) generation quality/latency on any route.
- Portrait vs full-body prompt latency split; batch behavior.
- Failure rates / retry behavior on the real image models.
- Image-route identity similarity scores (deferred — IDENTITY_EVALUATION.md).

## Route decision (updated Task 85; original Task 77-78 decision retained below)

`HF_IMAGE_PROVIDER` = `cloudflare` (**Vercel production default — credit-free**) |
`openrouter` (switchable when the account has credits) | `zai` (sandbox/local) |
`mock` (tests, **default**). DashScope-intl image is rejected (dead gateway —
confirmed twice, see below). The cloudflare provider conditions identity via the
klein multipart `image` form part (multi-reference editing); the openrouter
provider via multimodal `messages`; the zai provider via
`images.generations.edit`.

WHY the replacement: the deployed Vercel app's OpenRouter image engine answers
HTTP 402 — OpenRouter requires a **≥ $1.00 account balance** for paid image
models, and credits cannot be added to this account (measured live on the
public URL, Task 84: wallet burns, image jobs 402). Cloudflare Workers AI runs
on the user's existing Cloudflare account free allocation (10,000 neurons/day)
— that credit-freedom is the wave-7.1 reason for existing.

### Original Task 77-78 decision (superseded above)

`HF_IMAGE_PROVIDER` = `openrouter` (Vercel production) | `zai` (sandbox/local) |
`mock` (tests; **default**). DashScope-intl image is rejected (dead gateway). The
openrouter provider conditions identity via multimodal `messages` (reference image +
prompt); the zai provider via `images.generations.edit`.

## Task 85 station probes (2026-10-18)

Probed on the user's existing Cloudflare account after the OpenRouter 402
dead-end (Task 84 live verification). REST base:
`POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}`
with `Authorization: Bearer {CLOUDFLARE_API_TOKEN}`.

### DashScope intl text-to-image — conclusively DEAD (closed for good)

All five probed t2i models on the intl gateway answer identically —
`InvalidParameter "Model not exist."` — so the "no alternative image engine
exists with vaulted keys" conclusion of Task 84 is closed:

| Model probed (POST /api/v1/services/aigc/text2image/image-synthesis style route) | Result |
|---|---|
| `wanx2.1-t2i-turbo` | **`InvalidParameter "Model not exist."`** |
| `flux-schnell` | **`InvalidParameter "Model not exist."`** |
| `wanx2.1-t2i-plus` | **`InvalidParameter "Model not exist."`** |
| `wan2.5-t2i-flash` | **`InvalidParameter "Model not exist."`** |
| `qwen-image` | **`InvalidParameter "Model not exist."`** |

(Evidence style: same request/reply exchange records as the Task 77-78 probes —
live POSTs from the station shell with the vaulted intl key; every probe's JSON
reply carried the quoted code/message pair above. No request_ids were recorded
in the Task 85 briefing packet — the station's probe log is the primary record.)

### Cloudflare Workers AI — measured per model

| Route | Call shape | Result | Wall time | Cost (neurons) | Notes |
|---|---|---|---|---|---|
| **`@cf/black-forest-labs/flux-2-klein-9b`** (DEFAULT) | **multipart/form-data** — form fields `prompt` (string), `image` (JPEG/PNG file part, OPTIONAL — the identity reference, and it IS consumed: multi-reference editing), `width`/`height` (integers as form strings) | 200 JSON `{"result":{"image":"<base64 JPEG>"},"success":true,"errors":[],"messages":[]}` — base64 starts `/9j/` | **2.7 s** @ 1024×1024 ref-conditioned (611KB JPEG) · **3.4 s** @ 832×1216 ref-conditioned (415KB JPEG) · **3.4 s** @ 1024×1024 prompt-only (478KB JPEG) | **~909 neurons/image** (account-analytics measured — NO usage echo in the response) | JSON body → HTTP 400 `{"errors":[{"message":"AiError: Bad input: Error: required properties at '/' are 'multipart'","code":5006}],"success":false}`. 832/1216 width/height verified accepted |
| **`@cf/black-forest-labs/flux-1-schnell`** | JSON `{"prompt":…}` | 200 JSON `{result:{image:"<base64 JPEG>"}, usage:{neurons:172.8}}` | ~6.0 s | **172.8 neurons/image** (matches account analytics) | Output **FIXED 1024×1024** — sending width/height → HTTP 400. Text-to-image only, no reference input |
| **`@cf/bytedance/stable-diffusion-xl-lightning`** (FREE fallback) | JSON `{"prompt":…, "width":…, "height":…, "steps":4}` | 200 **RAW JPEG BYTES** (binary, NOT JSON) | **~4.0 s** @ 768×1152 | **0 neurons** (beta, price 0 — unlimited) | No reference input. 768×1152 verified |

### Response-shape dispatch + error classification (probe-derived provider laws)

- Inspect the response **content-type**: `application/json` → parse and take
  `result.image` (base64); `image/jpeg` / `image/png` (any non-JSON) → read the
  raw body bytes and base64 them in the provider. Detect the final mime from
  magic bytes — base64 prefix `/9j/` → `image/jpeg`, `iVBOR` → `image/png` —
  for the data-URI prefix.
- CF error JSON shape: `{success:false, errors:[{message, code}]}` — the
  `errors[].message` detail is surfaced in the thrown provider error.
- Classification follows the house matrix (types.ts): 402/403/400/401/404 →
  non-retryable; 429/5xx/network/timeout → retryable.

### Neuron budget (free allocation 10,000 neurons/day on the user's account)

| Model | Neurons/image | Images/day within the free allocation |
|---|---|---|
| `@cf/black-forest-labs/flux-2-klein-9b` | ~909 | **≈ 10/day** |
| `@cf/black-forest-labs/flux-1-schnell` | 172.8 | **≈ 57/day** |
| `@cf/bytedance/stable-diffusion-xl-lightning` | 0 (beta, price 0) | unlimited / free |

Measurement method: **account analytics** (the Workers AI dashboard/analytics
API is the source for klein's ~909 figure — its HTTP response carries NO
usage echo; schnell's 172.8 usage echo was cross-checked against analytics and
matches).
