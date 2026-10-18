/**
 * HF-W7 influencer provider factory — env-gated engine selection.
 *
 *   HF_IMAGE_PROVIDER = mock | openrouter | zai   (default mock)
 *   HF_VIDEO_PROVIDER = mock | dashscope | zai    (default mock)
 *
 * Defaults are mock so the test battery stays deterministic and never touches a
 * real API. A non-mock selection without its required key falls back to mock with
 * a `[f-influencer]` console.warn (deployments can run image-only or video-only
 * real engines; the other pipeline silently stays mock — disclosed clone-side
 * choice over hard-failing the whole studio).
 *
 * Sandbox note: zai needs no key env (ambient /etc/.z-ai-config) but only works
 * inside this sandbox; dashscope works everywhere incl. Vercel (Task 77-78).
 */

import { mockInfluencerProvider } from "./mock-provider";
import { openrouterImageProvider } from "./openrouter-provider";
import { dashscopeMotionProvider } from "./dashscope-provider";
import { zaiInfluencerProvider } from "./zai-provider";
import type { InfluencerImageProvider, InfluencerMotionProvider } from "./types";

export function getImageProvider(): InfluencerImageProvider {
  const name = (process.env.HF_IMAGE_PROVIDER ?? "mock").toLowerCase();
  if (name === "mock") return mockInfluencerProvider;
  if (name === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn(
        "[f-influencer] HF_IMAGE_PROVIDER=openrouter but OPENROUTER_API_KEY is unset — falling back to mock"
      );
      return mockInfluencerProvider;
    }
    return openrouterImageProvider;
  }
  if (name === "zai") return zaiInfluencerProvider; // ambient sandbox auth, no key env
  console.warn(`[f-influencer] unknown HF_IMAGE_PROVIDER '${name}' — using mock`);
  return mockInfluencerProvider;
}

export function getMotionProvider(): InfluencerMotionProvider {
  const name = (process.env.HF_VIDEO_PROVIDER ?? "mock").toLowerCase();
  if (name === "mock") return mockInfluencerProvider;
  if (name === "dashscope") {
    if (!process.env.DASHSCOPE_API_KEY) {
      console.warn(
        "[f-influencer] HF_VIDEO_PROVIDER=dashscope but DASHSCOPE_API_KEY is unset — falling back to mock"
      );
      return mockInfluencerProvider;
    }
    return dashscopeMotionProvider;
  }
  if (name === "zai") return zaiInfluencerProvider; // ambient sandbox auth, no key env
  console.warn(`[f-influencer] unknown HF_VIDEO_PROVIDER '${name}' — using mock`);
  return mockInfluencerProvider;
}

// Re-export the provider contracts so the adapter/module boundary has one import site.
export type { InfluencerAsset, InfluencerImageProvider, InfluencerMotionProvider } from "./types";
