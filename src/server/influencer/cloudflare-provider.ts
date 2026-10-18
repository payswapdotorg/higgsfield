/**
 * HF-W7.1 Cloudflare Workers AI image provider — the credit-free production
 * image engine (Task 85), replacing OpenRouter images in prod.
 *
 * WHY this provider exists (the wave's reason for being): the deployed Vercel
 * app's OpenRouter image engine is HTTP 402 credit-blocked — OpenRouter demands
 * a ≥ $1.00 account balance for paid image models and credits CANNOT be added
 * to this account. Cloudflare Workers AI bills against the user's EXISTING
 * Cloudflare account free allocation (10,000 neurons/day), so the studio keeps
 * a real image engine at zero cost. The station live-probed the replacement on
 * the user's account before this worker was dispatched.
 *
 * Station probe facts (live-measured 2026-10-18, Task 85 briefing — encoded
 * verbatim; nothing invented):
 *   REST: POST https://api.cloudflare.com/client/v4/accounts/{CLOUDFLARE_ACCOUNT_ID}/ai/run/{model}
 *   with header `Authorization: Bearer {CLOUDFLARE_API_TOKEN}`.
 *
 *   · @cf/black-forest-labs/flux-2-klein-9b (the DEFAULT model):
 *     requires a **multipart/form-data** body — a JSON body → HTTP 400
 *     {"errors":[{"message":"AiError: Bad input: Error: required properties at '/' are 'multipart'","code":5006}],"success":false}.
 *     Form fields (probe-verified): `prompt` (string), `image` (a JPEG/PNG file
 *     part — OPTIONAL: this is the identity reference image and it IS consumed —
 *     multi-reference editing), `width` / `height` (integers sent as form
 *     strings — 832/1216 verified accepted). 200 response: JSON
 *     {"result":{"image":"<base64 JPEG>"},"success":true,"errors":[],"messages":[]}
 *     — base64 starts /9j/ (JPEG). NO usage/neurons echo in the response
 *     (analytics-measured ~909 neurons/image).
 *     Measured: 1024×1024 ref-conditioned in 2.7s (611KB JPEG); 832×1216
 *     ref-conditioned in 3.4s (415KB JPEG); prompt-only 1024×1024 in 3.4s
 *     (478KB JPEG).
 *   · @cf/black-forest-labs/flux-1-schnell: JSON body {"prompt":…} → 200 JSON
 *     {result:{image:"<base64 JPEG>"}, usage:{neurons:172.8}} — 172.8
 *     neurons/image (matches account analytics), ~6.0s, output FIXED 1024×1024
 *     (sending width/height → HTTP 400). Text-to-image only, no reference input.
 *   · @cf/bytedance/stable-diffusion-xl-lightning (FREE fallback, 0 neurons —
 *     beta, price 0): JSON body {"prompt":…, "width":…, "height":…, "steps":4}
 *     → 200 **RAW JPEG BYTES** (binary, NOT JSON). 768×1152 verified, ~4.0s.
 *     No reference input.
 *   · Response-shape dispatch rule: inspect the response content-type —
 *     application/json → parse and take result.image (base64); image/jpeg /
 *     image/png (or any non-JSON type) → read the raw body bytes and base64
 *     them here. Detect the final mime from the magic bytes (/9j/ → image/jpeg,
 *     iVBOR → image/png) for the data-URI prefix.
 *   · Error classification reuses the types.ts matrix via the same conventions:
 *     402/403/400/401/404 → non-retryable; 429/5xx/network/timeout →
 *     retryable. CF error JSON shape: {success:false, errors:[{message, code}]}.
 *   · Neuron budget (free allocation 10,000 neurons/day): klein-9b ≈ 10
 *     images/day, schnell ≈ 57/day, sdxl-lightning unlimited/free.
 *
 * Identity reference: when req.referenceImage is present it is attached as the
 * `image` form part on the klein multipart route. BOTH stored forms are
 * handled: `data:<mime>;base64,<payload>` (decoded → Buffer → Blob) and an
 * `https://…` URL (bytes fetched → Blob; a fetch failure of the reference is a
 * NON-retryable error — it is input data, not transport). If the selected
 * primary model is a JSON-route model (schnell/sdxl — detected by the model
 * name containing "flux-1-schnell" or "stable-diffusion"), the reference cannot
 * be attached — the call proceeds prompt-only (the prompt is pre-rendered and
 * self-sufficient; disclosed).
 *
 * Fallback behavior (HF_CF_IMAGE_FALLBACK_MODEL, default sdxl-lightning,
 * literal value "none" disables): if the primary attempt fails with ANY
 * InfluencerProviderError except the missing-config guard, one prompt-only
 * fallback attempt runs at the fallback sizes (portrait 1024×1024, full-body
 * 768×1152). Success → the asset carries meta.fallbackUsed; failure → the
 * FALLBACK's error is thrown (its classification stands). The fallback exists
 * so a daily klein neuron-quota exhaustion degrades to the free SDXL instead
 * of hard-failing the studio.
 */

import {
  InfluencerProviderError,
  networkError,
  retryableForStatus,
  type InfluencerAsset,
  type InfluencerImageProvider,
  type InfluencerImageRequest,
} from "./types";

const CF_RUN_BASE = "https://api.cloudflare.com/client/v4/accounts"; // …/{accountId}/ai/run/{model}
const REQUEST_TIMEOUT_MS = 90_000;
const REFERENCE_FETCH_TIMEOUT_MS = 30_000;
const SDXL_STEPS = 4; // probe-verified sdxl-lightning body: {prompt, width, height, steps:4}

const DEFAULT_MODEL = "@cf/black-forest-labs/flux-2-klein-9b";
const DEFAULT_FALLBACK_MODEL = "@cf/bytedance/stable-diffusion-xl-lightning";

/** Portrait sizes: primary klein 1024×1024 (square, the 1:1 sheet tile), fallback 1024×1024. */
const PORTRAIT = { primary: { width: 1024, height: 1024 }, fallback: { width: 1024, height: 1024 } };
/** Full-body sizes: primary klein 832×1216 (probe-verified accepted), fallback sdxl 768×1152 (probe-verified). */
const FULL_BODY = { primary: { width: 832, height: 1216 }, fallback: { width: 768, height: 1152 } };

function primaryModel(): string {
  return process.env.HF_CF_IMAGE_MODEL ?? DEFAULT_MODEL;
}

/** null = fallback disabled (HF_CF_IMAGE_FALLBACK_MODEL=none). */
function fallbackModel(): string | null {
  const value = process.env.HF_CF_IMAGE_FALLBACK_MODEL ?? DEFAULT_FALLBACK_MODEL;
  return value.trim().toLowerCase() === "none" ? null : value;
}

/**
 * JSON-route models take a plain JSON body and accept NO reference input
 * (probe-verified for schnell/sdxl). Everything else is routed multipart —
 * the klein schema (prompt / image / width / height form fields).
 */
function isJsonRouteModel(model: string): boolean {
  const m = model.toLowerCase();
  return m.includes("flux-1-schnell") || m.includes("stable-diffusion");
}

/** sdxl-family models accept width/height/steps in the JSON body. */
function isSdxlFamily(model: string): boolean {
  return model.toLowerCase().includes("stable-diffusion");
}

/** Config guard: both CF env vars are required (the factory also gates + warn-falls back to mock). */
function requireCfConfig(): { token: string; accountId: string } {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new InfluencerProviderError(
      "CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID are both required for the cloudflare image provider",
      false
    );
  }
  return { token, accountId };
}

/** CF error JSON shape: {success:false, errors:[{message, code}]} → "code: message; …" detail. */
function cfErrorDetail(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("errors" in body)) return null;
  const errors = (body as { errors?: unknown }).errors;
  if (!Array.isArray(errors) || errors.length === 0) return null;
  const parts = errors.map((e) => {
    if (e && typeof e === "object" && "message" in e) {
      const message = (e as { message?: unknown }).message;
      const code = (e as { code?: unknown }).code;
      if (typeof message === "string") {
        return code !== undefined && code !== null ? `${String(code)}: ${message}` : message;
      }
    }
    return JSON.stringify(e);
  });
  return parts.join("; ").slice(0, 300);
}

/** Final mime from the base64 magic prefix (probe fact #4): /9j/ → JPEG, iVBOR → PNG. */
function mimeFromBase64Prefix(base64: string): "image/jpeg" | "image/png" {
  if (base64.startsWith("/9j/")) return "image/jpeg";
  if (base64.startsWith("iVBOR")) return "image/png";
  // Unrecognized payload — transient-leaning anomaly, same class as a
  // 200-without-image (openrouter-provider precedent), so a retry gets a chance
  // to deliver clean bytes.
  throw new InfluencerProviderError(
    "cloudflare image: unrecognized payload magic bytes (expected JPEG /9j/ or PNG iVBOR)",
    true
  );
}

/**
 * Identity reference → Blob for the multipart `image` form part.
 * `data:<mime>;base64,<payload>` is decoded; an https/http URL's bytes are
 * fetched (a reference-fetch failure is NON-retryable — it is input data).
 */
async function referenceToBlob(referenceImage: string): Promise<Blob> {
  if (referenceImage.startsWith("data:")) {
    const comma = referenceImage.indexOf(",");
    const header = comma === -1 ? "" : referenceImage.slice(5, comma);
    if (comma === -1 || !header.includes("base64")) {
      throw new InfluencerProviderError(
        "cloudflare reference image: expected a data:<mime>;base64,<payload> URI",
        false
      );
    }
    const payload = referenceImage.slice(comma + 1);
    if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
      throw new InfluencerProviderError("cloudflare reference image: payload is not valid base64", false);
    }
    const bytes = Buffer.from(payload, "base64");
    if (bytes.length === 0) {
      throw new InfluencerProviderError("cloudflare reference image: decoded payload is empty", false);
    }
    const mime = header.split(";")[0] || "image/jpeg";
    return new Blob([new Uint8Array(bytes)], { type: mime });
  }
  if (/^https?:\/\//i.test(referenceImage)) {
    let res: Response;
    try {
      res = await fetch(referenceImage, { signal: AbortSignal.timeout(REFERENCE_FETCH_TIMEOUT_MS) });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new InfluencerProviderError(`cloudflare reference image fetch failed — ${msg}`, false);
    }
    if (!res.ok) {
      throw new InfluencerProviderError(
        `cloudflare reference image fetch: HTTP ${res.status} (input data unreachable)`,
        false,
        res.status
      );
    }
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0) {
      throw new InfluencerProviderError("cloudflare reference image: fetched body is empty", false);
    }
    const contentType = res.headers.get("content-type")?.split(";")[0];
    return new Blob([new Uint8Array(bytes)], { type: contentType && contentType.startsWith("image/") ? contentType : "image/jpeg" });
  }
  throw new InfluencerProviderError(
    "cloudflare reference image: unsupported form (expected data: URI or https URL)",
    false
  );
}

interface CfRunJsonResponse {
  result?: { image?: unknown };
  success?: boolean;
  errors?: Array<{ message?: unknown; code?: unknown }>;
  usage?: { neurons?: unknown };
}

/**
 * One model run — request building (multipart klein route vs JSON route) +
 * response-shape dispatch (JSON result.image vs raw bytes) + classification.
 * Only ever throws InfluencerProviderError.
 */
async function runCfModel(args: {
  token: string;
  accountId: string;
  model: string;
  prompt: string;
  referenceImage?: string;
  width: number;
  height: number;
  fallbackUsed?: boolean;
}): Promise<InfluencerAsset> {
  const url = `${CF_RUN_BASE}/${args.accountId}/ai/run/${args.model}`;

  // ── request building ──
  // klein route: multipart/form-data (prompt / image? / width / height — the
  // runtime sets the multipart boundary; content-type is NOT set manually).
  // JSON route (schnell/sdxl): plain JSON — schnell is fixed-square (sending
  // width/height → 400), sdxl accepts width/height/steps.
  let body: FormData | string;
  if (isJsonRouteModel(args.model)) {
    const json: Record<string, unknown> = { prompt: args.prompt };
    if (isSdxlFamily(args.model)) {
      json.width = args.width;
      json.height = args.height;
      json.steps = SDXL_STEPS;
    }
    body = JSON.stringify(json);
  } else {
    const fd = new FormData();
    fd.append("prompt", args.prompt);
    if (args.referenceImage) {
      // The identity reference — consumed by the model (multi-reference editing).
      const blob = await referenceToBlob(args.referenceImage);
      fd.append("image", blob, "reference.jpg");
    }
    fd.append("width", String(args.width));
    fd.append("height", String(args.height));
    body = fd;
  }

  // ── the call ──
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers:
        body instanceof FormData
          ? { authorization: `Bearer ${args.token}` } // multipart boundary comes from the runtime
          : { authorization: `Bearer ${args.token}`, "content-type": "application/json" },
      body,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    throw networkError(`cloudflare image (${args.model})`, err);
  }

  // ── non-2xx → classified error (CF error JSON detail included) ──
  if (!res.ok) {
    const text = await res.text();
    let detail = text.slice(0, 300);
    try {
      const cfDetail = cfErrorDetail(JSON.parse(text));
      if (cfDetail) detail = cfDetail;
    } catch {
      /* keep raw text */
    }
    throw new InfluencerProviderError(
      `cloudflare image (${args.model}): HTTP ${res.status} — ${detail}`,
      retryableForStatus(res.status),
      res.status
    );
  }

  // ── response-shape dispatch (probe fact #4): content-type decides ──
  let base64: string;
  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("json")) {
    // JSON route: {"result":{"image":"<base64>"},"success":true,…} (klein/schnell)
    let json: CfRunJsonResponse;
    try {
      json = JSON.parse(await res.text()) as CfRunJsonResponse;
    } catch {
      throw new InfluencerProviderError(`cloudflare image (${args.model}): invalid JSON response`, false);
    }
    if (json.success === false) {
      // Explicit provider rejection — a retry would hit the same refusal.
      throw new InfluencerProviderError(
        `cloudflare image (${args.model}): success=false — ${cfErrorDetail(json) ?? "no error detail"}`,
        false
      );
    }
    const image = json.result?.image;
    if (typeof image !== "string" || image.length === 0) {
      // 200 without an image — transient/model-level miss (openrouter precedent).
      throw new InfluencerProviderError(
        `cloudflare image (${args.model}): response carried no result.image`,
        true
      );
    }
    base64 = image;
    if (typeof json.usage?.neurons === "number") {
      // schnell echoes usage.neurons (172.8/image measured); klein does NOT
      // (its ~909 neurons/image figure comes from account analytics).
      console.log(`[f-influencer] cloudflare usage: ${json.usage.neurons} neurons (${args.model})`);
    }
  } else {
    // Binary route: RAW JPEG/PNG bytes (sdxl-lightning) → base64 them here.
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length === 0) {
      throw new InfluencerProviderError(`cloudflare image (${args.model}): empty binary response`, true);
    }
    base64 = bytes.toString("base64");
  }

  const mime = mimeFromBase64Prefix(base64);
  // schnell output is FIXED 1024×1024 (probe-verified) — meta reports the
  // factual output size, not the ignored request size.
  const fixedSquare = args.model.toLowerCase().includes("flux-1-schnell");
  const width = fixedSquare ? 1024 : args.width;
  const height = fixedSquare ? 1024 : args.height;

  console.log(
    `[f-influencer] cloudflare image ok (${args.model}, ${width}x${height}${args.fallbackUsed ? ", fallback" : ""}, ` +
      `${(base64.length / 1024) | 0}KB base64)`
  );
  return {
    assetUrl: `data:${mime};base64,${base64}`,
    kind: "image",
    meta: {
      model: args.model,
      provider: "cloudflare",
      ...(args.fallbackUsed ? { fallbackUsed: true } : {}),
      width,
      height,
    },
  };
}

/** Primary attempt + (on any InfluencerProviderError except the config guard) one fallback attempt. */
async function generate(
  req: InfluencerImageRequest,
  sizes: { primary: { width: number; height: number }; fallback: { width: number; height: number } }
): Promise<InfluencerAsset> {
  // Missing-config guard — runs BEFORE any attempt, so it is never subject to
  // the fallback (the fallback needs the very same credentials).
  const { token, accountId } = requireCfConfig();

  const model = primaryModel();
  const fallback = fallbackModel();
  try {
    return await runCfModel({
      token,
      accountId,
      model,
      prompt: req.prompt,
      referenceImage: req.referenceImage,
      width: sizes.primary.width,
      height: sizes.primary.height,
    });
  } catch (err) {
    if (!(err instanceof InfluencerProviderError) || !fallback) throw err;
    // e.g. daily klein neuron-quota exhaustion → degrade to the free SDXL
    // instead of hard-failing the studio. Prompt-only: the JSON-route fallback
    // takes no reference input, and the prompt is pre-rendered/self-sufficient.
    console.warn(
      `[f-influencer] cf primary model failed (${err.message.slice(0, 200)}) — retrying with fallback ${fallback}`
    );
    // If the fallback ALSO fails, ITS error is thrown — its classification stands.
    return await runCfModel({
      token,
      accountId,
      model: fallback,
      prompt: req.prompt,
      width: sizes.fallback.width,
      height: sizes.fallback.height,
      fallbackUsed: true,
    });
  }
}

export const cloudflareImageProvider: InfluencerImageProvider = {
  name: "cloudflare",

  async generatePortrait(req: InfluencerImageRequest): Promise<InfluencerAsset> {
    // Primary klein at 1024×1024 (the square 1:1 sheet tile); fallback 1024×1024.
    return generate(req, PORTRAIT);
  },

  async generateFullBody(req: InfluencerImageRequest): Promise<InfluencerAsset> {
    // Primary klein at 832×1216 (probe-verified accepted, the 2:3-leaning sheet
    // tile); fallback sdxl at 768×1152 (probe-verified).
    return generate(req, FULL_BODY);
  },
};
