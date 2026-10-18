# Image route benchmark — LIVE MEASURED (Task 77-78 station probes)

> Law: every number below is a live measurement or an explicit `null` (not yet
> measured). Nothing is invented; null stays null. Probe date: 2026-10-17/18 session
> (worklog Task 77-78). Quality scores are all null — quality evaluation happens via
> IDENTITY_EVALUATION.md, not here.

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

- Vercel-side OpenRouter image generation (latency, success, actual spend per image).
- Latency/cost of `google/gemini-3.1-flash-image` / `gpt-5-image` / `nano-banana-2.1` (any egress).
- Reference-image (identity-conditioned) generation quality/latency on any route.
- Portrait vs full-body prompt latency split; batch behavior.
- Failure rates / retry behavior on the real image models.
- Image-route identity similarity scores (deferred — IDENTITY_EVALUATION.md).

## Route decision (TL, Task 77-78)

`HF_IMAGE_PROVIDER` = `openrouter` (Vercel production) | `zai` (sandbox/local) |
`mock` (tests; **default**). DashScope-intl image is rejected (dead gateway). The
openrouter provider conditions identity via multimodal `messages` (reference image +
prompt); the zai provider via `images.generations.edit`.
