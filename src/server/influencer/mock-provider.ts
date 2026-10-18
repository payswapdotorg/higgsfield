/**
 * HF-W7 mock influencer provider — deterministic, tests/demo only.
 *
 * - Resolves after MOCK_ADAPTER_MS (the same env knob as the mock model adapter,
 *   default 1200) with ±20% seeded jitter derived from req.seed (mirrors
 *   src/server/adapters/mock-adapter.ts — determinism law).
 * - Returns a tiny VALID base64 SVG data URI, visibly labeled as an hf-mock asset
 *   (the SVG text carries the seed so determinism is assertable). Real providers
 *   (openrouter/dashscope/zai) are the production engines; this one exists so
 *   the battery never touches a real API.
 */

import { fnv1a, mulberry32 } from "@/lib/seeded-rng";
import type {
  InfluencerAsset,
  InfluencerImageProvider,
  InfluencerImageRequest,
  InfluencerMotionProvider,
  InfluencerMotionRequest,
} from "./types";

function adapterBaseMs(): number {
  const parsed = Number(process.env.MOCK_ADAPTER_MS ?? 1200);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1200;
}

/** Deterministic jittered delay: base ± 20% (seeded — no wall-clock dependence in outcomes). */
async function mockDelay(seed: number): Promise<void> {
  const rng = mulberry32(seed >>> 0);
  const jitter = 0.8 + rng() * 0.4;
  await new Promise((resolve) => setTimeout(resolve, Math.round(adapterBaseMs() * jitter)));
}

function svgDataUri(label: string, seed: number): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" fill="#4a4a4a"/><text x="4" y="30" font-size="8" fill="#fff">hf-mock ${label}</text><text x="4" y="44" font-size="8" fill="#ffd">seed ${seed}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
}

export const mockInfluencerProvider: InfluencerImageProvider & InfluencerMotionProvider = {
  name: "mock",

  async generatePortrait(req: InfluencerImageRequest): Promise<InfluencerAsset> {
    await mockDelay(req.seed);
    return { assetUrl: svgDataUri("portrait", req.seed), kind: "image", meta: { mock: true } };
  },

  async generateFullBody(req: InfluencerImageRequest): Promise<InfluencerAsset> {
    await mockDelay(req.seed);
    return { assetUrl: svgDataUri("fullbody", req.seed), kind: "image", meta: { mock: true } };
  },

  async animate(req: InfluencerMotionRequest): Promise<InfluencerAsset> {
    // Deterministic seed derived from the prompt (the motion request carries no
    // seed field per the provider contract; the prompt itself is deterministic
    // from spec + preset, so fnv1a(prompt) keeps this pure and reproducible).
    const seed = fnv1a(`hf-mock-motion:${req.prompt}:${req.durationSeconds}`);
    await mockDelay(seed >>> 0);
    return { assetUrl: svgDataUri("motion", seed), kind: "video", meta: { mock: true } };
  },
};
