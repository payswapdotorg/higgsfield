/**
 * HF-W7 OpenRouter image provider — the Vercel-prod image engine.
 *
 * Route: POST https://openrouter.ai/api/v1/chat/completions with
 * `Authorization: Bearer $OPENROUTER_API_KEY` and an image-output chat model
 * (default `google/gemini-2.5-flash-image`, configurable via
 * HF_OPENROUTER_IMAGE_MODEL). Task 77-78 probe results encoded here:
 *   · the response image rides at choices[0].message.images[0].image_url.url
 *     as a `data:…base64` URI (per OpenRouter's image-model response shape);
 *   · from THIS sandbox's egress every image-output model 403s with
 *     "not available in your region" (geo-gate only — Vercel us-east-1 should
 *     route fine); that exact 403 maps to a clean NON-retryable provider error,
 *     never a crash;
 *   · 402/403 → non-retryable; 429/5xx/timeouts → retryable (types.ts matrix).
 *
 * Identity reference: when referenceImage is present it is prepended as a
 * multimodal input image with an explicit instruction clause — "use the person
 * in the provided image as the identity reference; preserve their facial
 * identity" — so portrait/full-body renders stay on-identity.
 */

import {
  InfluencerProviderError,
  networkError,
  readJsonOrThrow,
  type InfluencerAsset,
  type InfluencerImageProvider,
  type InfluencerImageRequest,
} from "./types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 90_000;
const IDENTITY_REFERENCE_CLAUSE =
  "Use the person in the provided image as the identity reference; preserve their facial identity. ";

interface OpenRouterImageResponse {
  choices?: Array<{
    message?: {
      images?: Array<{ image_url?: { url?: string } }>;
      content?: unknown;
    };
  }>;
}

function imageModel(): string {
  return process.env.HF_OPENROUTER_IMAGE_MODEL ?? "google/gemini-2.5-flash-image";
}

async function generate(req: InfluencerImageRequest): Promise<InfluencerAsset> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Config guard: a missing key is a deployment misconfiguration — non-retryable.
    throw new InfluencerProviderError("OPENROUTER_API_KEY is not configured", false);
  }

  const text = IDENTITY_REFERENCE_CLAUSE + req.prompt;
  // With a reference image the message content becomes a multimodal parts array
  // (text + identity-reference input image); without it, a plain text prompt.
  const content: string | Array<Record<string, unknown>> = req.referenceImage
    ? [
        { type: "text", text },
        { type: "image_url", image_url: { url: req.referenceImage } },
      ]
    : text;

  let res: Response;
  try {
    res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: imageModel(),
        messages: [{ role: "user", content }],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw networkError("openrouter image", err);
  }

  const json = (await readJsonOrThrow(res, `openrouter image (${imageModel()})`)) as OpenRouterImageResponse;
  const url = json.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url || typeof url !== "string") {
    // 200 without an image block: treat as a transient/model-level miss — retryable.
    throw new InfluencerProviderError(
      "openrouter image: response carried no image (choices[0].message.images empty)",
      true
    );
  }
  console.log(`[f-influencer] openrouter image ok (${imageModel()}, ${(url.length / 1024) | 0}KB data URI)`);
  return { assetUrl: url, kind: "image", meta: { model: imageModel(), provider: "openrouter" } };
}

export const openrouterImageProvider: InfluencerImageProvider = {
  name: "openrouter",
  // The pre-rendered prompts already carry the framing difference (close-up vs
  // full-body composition), so both methods share the request path — the seam
  // exists for future per-shot parameters (size/quality) without contract churn.
  generatePortrait: generate,
  generateFullBody: generate,
};
