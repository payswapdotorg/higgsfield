/**
 * HF-W7 z-ai-web-dev-sdk provider — the sandbox/local engine for BOTH image and
 * video (Task 77-78 probe: images.generations.create verified real JPEG in ~63s;
 * video.generations.create → async.result.query poll → video url).
 *
 * Scope disclosure: the SDK authenticates via the ambient /etc/.z-ai-config
 * machine credentials and routes to an internal private IP — it works ONLY
 * inside this sandbox (unusable from Vercel). It is selected purely by env
 * (HF_IMAGE_PROVIDER=zai / HF_VIDEO_PROVIDER=zai); no secret lives in code.
 *
 * The SDK is imported DYNAMICALLY inside the call paths so that (a) merely
 * importing the provider factory never pulls the SDK into a serverless bundle
 * and (b) a missing ambient config surfaces as a clean classified error at call
 * time, not a module-load crash.
 *
 * Probe-verified call shapes:
 *   · image:     zai.images.generations.create({prompt, size}) → {data:[{base64}]}
 *                → data:image/jpeg;base64,…
 *   · identity:  zai.images.generations.edit({prompt, image})  (reference-image route)
 *   · video:     zai.video.generations.create({prompt, image_url, quality:"speed",
 *                duration}) → task id → zai.async.result.query(id) poll → SUCCESS →
 *                video url at video_result[0].url || video_url || url
 */

import { sleep } from "@/lib/seeded-rng";
import {
  InfluencerProviderError,
  type InfluencerAsset,
  type InfluencerImageProvider,
  type InfluencerImageRequest,
  type InfluencerMotionProvider,
  type InfluencerMotionRequest,
} from "./types";

const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

// z-ai-web-dev-sdk has no bundled types — the dynamic import is typed loosely here
// and narrowed at the call sites (the shapes below are the probe-verified ones).
interface ZaiClient {
  images: {
    generations: {
      create(args: { prompt: string; size: string }): Promise<{ data?: Array<{ base64?: string }> }>;
      edit(args: { prompt: string; image: string }): Promise<{ data?: Array<{ base64?: string }> }>;
    };
  };
  video: {
    generations: {
      create(args: {
        prompt: string;
        image_url?: string;
        quality?: string;
        duration?: number;
      }): Promise<{ id?: string; request_id?: string }>;
    };
  };
  async: {
    result: {
      query(id: string): Promise<Record<string, unknown>>;
    };
  };
}

type ZaiModule = { default: { create(): Promise<ZaiClient> } };

// Cached on globalThis (dev-HMR-safe — same law as the worker's started flag).
const globalForZai = globalThis as unknown as { __hfZaiClient?: ZaiClient };

async function getZai(): Promise<ZaiClient> {
  if (globalForZai.__hfZaiClient) return globalForZai.__hfZaiClient;
  try {
    const mod = (await import("z-ai-web-dev-sdk")) as unknown as ZaiModule;
    const client = await mod.default.create();
    globalForZai.__hfZaiClient = client;
    return client;
  } catch (err) {
    // Missing ambient config (e.g. outside the sandbox) or SDK load failure —
    // a deployment-scope misconfiguration, non-retryable.
    throw new InfluencerProviderError(
      `zai SDK unavailable (ambient /etc/.z-ai-config missing or create() failed): ${String(err).slice(0, 200)}`,
      false
    );
  }
}

function toDataUri(base64: string | undefined, context: string): string {
  if (!base64) {
    throw new InfluencerProviderError(`zai ${context}: response carried no base64 image`, true);
  }
  return `data:image/jpeg;base64,${base64}`;
}

async function generateImage(req: InfluencerImageRequest, size: string): Promise<InfluencerAsset> {
  const zai = await getZai();
  try {
    // Identity-reference route when a reference image is present (edit), plain
    // text-to-image otherwise (create).
    const res = req.referenceImage
      ? await zai.images.generations.edit({ prompt: req.prompt, image: req.referenceImage })
      : await zai.images.generations.create({ prompt: req.prompt, size });
    console.log(`[f-influencer] zai image ok (${req.referenceImage ? "edit/identity" : "create"}, size ${size})`);
    return {
      assetUrl: toDataUri(res.data?.[0]?.base64, "image"),
      kind: "image",
      meta: { provider: "zai", mode: req.referenceImage ? "edit" : "create", size },
    };
  } catch (err) {
    if (err instanceof InfluencerProviderError) throw err;
    // SDK failures (timeouts, upstream 5xx-ish) lean retryable.
    throw new InfluencerProviderError(
      `zai image failed: ${String(err).slice(0, 300)}`,
      true
    );
  }
}

function extractVideoUrl(task: Record<string, unknown>): string | null {
  const videoResult = task.video_result as Array<{ url?: string }> | undefined;
  if (Array.isArray(videoResult) && typeof videoResult[0]?.url === "string") {
    return videoResult[0].url;
  }
  if (typeof task.video_url === "string") return task.video_url;
  if (typeof task.url === "string") return task.url;
  return null;
}

async function animate(req: InfluencerMotionRequest): Promise<InfluencerAsset> {
  const zai = await getZai();
  let taskId: string;
  try {
    const res = await zai.video.generations.create({
      prompt: req.prompt,
      image_url: req.referenceImage,
      quality: "speed",
      duration: req.durationSeconds,
    });
    taskId = res.id ?? res.request_id ?? "";
  } catch (err) {
    throw new InfluencerProviderError(`zai video submit failed: ${String(err).slice(0, 300)}`, true);
  }
  if (!taskId) {
    throw new InfluencerProviderError("zai video submit: no task id in response", true);
  }
  console.log(`[f-influencer] zai video task submitted: ${taskId}`);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  for (;;) {
    if (Date.now() >= deadline) {
      throw new InfluencerProviderError(
        `zai video task ${taskId}: poll timeout after ${POLL_TIMEOUT_MS / 1000}s`,
        true
      );
    }
    await sleep(POLL_INTERVAL_MS);
    let task: Record<string, unknown>;
    try {
      task = await zai.async.result.query(taskId);
    } catch (err) {
      console.warn(`[f-influencer] zai poll transient error (will retry): ${String(err).slice(0, 160)}`);
      continue;
    }
    const status = task.task_status;
    if (status === "SUCCESS") {
      const url = extractVideoUrl(task);
      if (!url) {
        throw new InfluencerProviderError(`zai video task ${taskId}: SUCCESS but no video url`, false);
      }
      console.log(`[f-influencer] zai video task ${taskId} SUCCESS → ${url.slice(0, 80)}…`);
      return { assetUrl: url, kind: "video", meta: { provider: "zai", taskId } };
    }
    if (status === "FAIL" || status === "FAILED") {
      throw new InfluencerProviderError(
        `zai video task ${taskId} FAILED: ${JSON.stringify(task).slice(0, 200)}`,
        false
      );
    }
    // PENDING / RUNNING — keep polling.
  }
}

export const zaiInfluencerProvider: InfluencerImageProvider & InfluencerMotionProvider = {
  name: "zai",
  // 1024×1024 portrait (square job aspect 1:1); 864×1152 full-body (the closest
  // SDK size to the 2:3 job aspect) — spec: clone-side size mapping.
  generatePortrait: (req) => generateImage(req, "1024x1024"),
  generateFullBody: (req) => generateImage(req, "864x1152"),
  animate,
};
