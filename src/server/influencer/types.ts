/**
 * HF-W7 AI Influencer provider contracts — the pluggable generation-engine seam
 * (the influencer analogue of src/server/adapters/types.ts ModelAdapter).
 *
 * Engine matrix (Task 77-78 live probes; Task 85 replacement):
 *   IMAGE  = openrouter (credit-blocked) | cloudflare (Vercel prod default) | zai (sandbox) | mock (tests)
 *   VIDEO  = dashscope intl wan2.2-i2v (works everywhere incl. Vercel) | zai | mock
 * Selection is env-gated in ./index.ts (HF_IMAGE_PROVIDER / HF_VIDEO_PROVIDER),
 * defaulting to mock so the battery stays deterministic.
 *
 * Error discipline: providers signal failures by THROWING InfluencerProviderError
 * with an explicit `retryable` classification; the influencer adapter maps that to
 * the existing worker AdapterResult ({ok:false, error, retryable}) so the proven
 * CAS/retry/terminal machinery works unchanged.
 *   · non-retryable: billing/content rejections (HTTP 402/403), malformed
 *     requests (400/404/422), provider-reported FAILED tasks;
 *   · retryable: rate limits (429), server errors (5xx), network/timeout errors,
 *     and poll-window timeouts.
 */

export interface InfluencerImageRequest {
  /** Pre-rendered prompt (stored verbatim on the Generation row at POST time). */
  prompt: string;
  /** Optional identity-reference image (data:…base64 URI or https URL). */
  referenceImage?: string;
  /** Deterministic job seed (drives mock determinism; ignored by real engines). */
  seed: number;
}

export interface InfluencerAsset {
  assetUrl: string;
  kind: "image" | "video";
  meta?: Record<string, unknown>;
}

export interface InfluencerImageProvider {
  name: string;
  generatePortrait(req: InfluencerImageRequest): Promise<InfluencerAsset>;
  generateFullBody(req: InfluencerImageRequest): Promise<InfluencerAsset>;
}

export interface InfluencerMotionRequest {
  prompt: string;
  /** The character's portrait asset (data URI or https URL) — the i2v input frame. */
  referenceImage: string;
  durationSeconds: number;
}

export interface InfluencerMotionProvider {
  name: string;
  animate(req: InfluencerMotionRequest): Promise<InfluencerAsset>;
}

/** Classified provider failure — mapped onto the worker's AdapterResult retryable flag. */
export class InfluencerProviderError extends Error {
  constructor(
    message: string,
    public retryable: boolean,
    public status?: number
  ) {
    super(message);
    this.name = "InfluencerProviderError";
  }
}

/** HTTP-status → retryable classification (the matrix in the file header). */
export function retryableForStatus(status: number): boolean {
  if (status === 402 || status === 403) return false; // billing / region-gate / forbidden
  if (status === 400 || status === 401 || status === 404 || status === 422) return false; // malformed / auth-config
  return true; // 429, 5xx, anything else transient-leaning
}

/** Uniform fetch error mapping: non-2xx → classified InfluencerProviderError. */
export async function readJsonOrThrow(res: Response, context: string): Promise<unknown> {
  const text = await res.text();
  if (!res.ok) {
    let detail = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>;
      // OpenRouter/DashScope style: {error: {message}} or {message}
      const err = parsed.error ?? parsed.message;
      if (typeof err === "string") detail = err;
      else if (err && typeof err === "object" && "message" in err) {
        const m = (err as { message?: unknown }).message;
        if (typeof m === "string") detail = m;
      }
    } catch {
      /* keep raw text */
    }
    throw new InfluencerProviderError(
      `${context}: HTTP ${res.status} — ${detail}`,
      retryableForStatus(res.status),
      res.status
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new InfluencerProviderError(`${context}: invalid JSON response`, false);
  }
}

/** fetch()-level failure (network/DNS/timeout) → retryable provider error. */
export function networkError(context: string, err: unknown): InfluencerProviderError {
  const msg = err instanceof Error ? err.message : String(err);
  return new InfluencerProviderError(`${context}: network error — ${msg}`, true);
}
