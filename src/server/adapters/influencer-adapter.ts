/**
 * HF-W7 influencer model adapter — the ModelAdapter seam implementation that
 * routes influencer jobs to the pluggable provider layer.
 *
 * Per the dispatch contract: the job row carries everything the engine needs —
 *   · prompt        — pre-rendered at POST time (portrait / full-body / motion);
 *   · inputImages[0] — the identity reference: the uploaded face ref for
 *                     portrait/full-body, the character's portrait asset for motion;
 *   · seed          — deterministic job seed (mock determinism).
 *
 * Returns AdapterResult so the EXISTING worker machinery (CAS claims, the single
 * automatic retry, terminal states) works unchanged. Provider failures throw
 * InfluencerProviderError with an explicit retryable classification, mapped here;
 * any unexpected throw is treated as non-retryable (the same request would crash
 * identically — retrying would only churn the paid slot; see the worker header's
 * no-refund rationale).
 */

import type { Generation } from "@prisma/client";
import type { AdapterResult, ModelAdapter } from "./types";
import {
  getImageProvider,
  getMotionProvider,
} from "@/server/influencer";
import { InfluencerProviderError } from "@/server/influencer/types";

/** Motion clip length in seconds (spec: clone-side — wan2.2 supports 5s clips). */
export const MOTION_DURATION_SECONDS = 5;

function firstInputImage(inputImagesJson: string): string | undefined {
  try {
    const v = JSON.parse(inputImagesJson || "[]");
    if (Array.isArray(v) && typeof v[0] === "string" && v[0].length > 0) return v[0];
    return undefined;
  } catch {
    return undefined;
  }
}

function toAdapterResult(err: unknown): AdapterResult {
  if (err instanceof InfluencerProviderError) {
    return { ok: false, error: err.message, retryable: err.retryable };
  }
  console.error("[f-influencer] unexpected provider crash:", err);
  return { ok: false, error: "influencer provider crashed", retryable: false };
}

export const influencerAdapter: ModelAdapter = {
  name: "influencer",

  async run(job: Generation): Promise<AdapterResult> {
    const referenceImage = firstInputImage(job.inputImages);
    try {
      if (job.jobSetType === "influencer_portrait") {
        const asset = await getImageProvider().generatePortrait({
          prompt: job.prompt,
          referenceImage,
          seed: job.seed,
        });
        return { ok: true, assetUrl: asset.assetUrl, assetKind: asset.kind };
      }
      if (job.jobSetType === "influencer_fullbody") {
        const asset = await getImageProvider().generateFullBody({
          prompt: job.prompt,
          referenceImage,
          seed: job.seed,
        });
        return { ok: true, assetUrl: asset.assetUrl, assetKind: asset.kind };
      }
      if (job.jobSetType === "influencer_motion") {
        if (!referenceImage) {
          // Contract violation — the motion route guarantees a portrait input;
          // non-retryable (a retry would hit the same missing input).
          return {
            ok: false,
            error: "influencer_motion job has no reference portrait in input_images",
            retryable: false,
          };
        }
        const asset = await getMotionProvider().animate({
          prompt: job.prompt,
          referenceImage,
          durationSeconds: MOTION_DURATION_SECONDS,
        });
        return { ok: true, assetUrl: asset.assetUrl, assetKind: asset.kind };
      }
      return {
        ok: false,
        error: `influencer adapter does not handle job_set_type '${job.jobSetType}'`,
        retryable: false,
      };
    } catch (err) {
      return toAdapterResult(err);
    }
  },
};
