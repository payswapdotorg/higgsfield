/**
 * HF-W7 DashScope video provider — the motion engine (wan2.2 image-to-video).
 *
 * Task 77-78 live-probe facts encoded here (all verified against the intl gateway):
 *   · The key is INTL-scoped: dashscope.aliyuncs.com (China) REJECTS it with
 *     InvalidApiKey — the base is hardcoded to https://dashscope-intl.aliyuncs.com
 *     (overridable via HF_DASHSCOPE_BASE_URL for future gateway moves).
 *   · Submit: POST /api/v1/services/aigc/video-generation/video-synthesis with
 *     header `X-DashScope-Async: enable` — WITHOUT it the gateway answers
 *     AccessDenied "current user api does not support synchronous calls".
 *   · Body: {model, input:{prompt, img_url}, parameters:{size, duration}}.
 *     img_url accepts a data:…base64 URI or an https URL — passed through verbatim.
 *   · size whitelist: 832*480 / 480*832 / 1920*1080 / 1080*1920 / 1440*1440 /
 *     1632*1248 / 1248*1632 / 624*624 — 1280*720 is INVALID (rejected). The
 *     default here is 832*480 (landscape, matches the 16:9 job aspect).
 *   · Poll: GET /api/v1/tasks/{task_id} every 3s; task_status SUCCEEDED →
 *     output.video_url (OSS signed URL, ~24h expiry); FAILED → non-retryable;
 *     10-minute overall timeout → retryable.
 *   · Models that exist: wan2.2-t2v-plus, wan2.2-i2v-plus, wan2.2-i2v-flash
 *     (default here: wan2.2-i2v-flash, env HF_DASHSCOPE_VIDEO_MODEL).
 */

import { sleep } from "@/lib/seeded-rng";
import {
  InfluencerProviderError,
  networkError,
  readJsonOrThrow,
  type InfluencerAsset,
  type InfluencerMotionProvider,
  type InfluencerMotionRequest,
} from "./types";

const DEFAULT_BASE_URL = "https://dashscope-intl.aliyuncs.com"; // intl ONLY — the China endpoint rejects this key class
const SUBMIT_PATH = "/api/v1/services/aigc/video-generation/video-synthesis";
const TASK_PATH = "/api/v1/tasks";
const POLL_INTERVAL_MS = 3_000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;
const SUBMIT_TIMEOUT_MS = 60_000;
const POLL_TIMEOUT_PER_CALL_MS = 30_000;

// wan2.2 size whitelist (probe-verified): 832*480/480*832/1920*1080/1080*1920/
// 1440*1440/1632*1248/1248*1632/624*624 — 1280*720 is INVALID.
const VIDEO_SIZE = "832*480";

function baseUrl(): string {
  return process.env.HF_DASHSCOPE_BASE_URL ?? DEFAULT_BASE_URL;
}

function videoModel(): string {
  return process.env.HF_DASHSCOPE_VIDEO_MODEL ?? "wan2.2-i2v-flash";
}

interface DashScopeSubmitResponse {
  output?: { task_id?: string; task_status?: string };
  request_id?: string;
}

interface DashScopeTaskResponse {
  output?: { task_status?: string; video_url?: string; message?: string; code?: string };
  request_id?: string;
}

export const dashscopeMotionProvider: InfluencerMotionProvider = {
  name: "dashscope",

  async animate(req: InfluencerMotionRequest): Promise<InfluencerAsset> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new InfluencerProviderError("DASHSCOPE_API_KEY is not configured", false);
    }

    // ── submit (async task API — X-DashScope-Async: enable is mandatory) ──
    let submit: DashScopeSubmitResponse;
    try {
      const res = await fetch(`${baseUrl()}${SUBMIT_PATH}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
          "x-dashscope-async": "enable",
        },
        body: JSON.stringify({
          model: videoModel(),
          input: {
            prompt: req.prompt,
            img_url: req.referenceImage, // data URI or https URL — verbatim pass-through
          },
          parameters: {
            size: VIDEO_SIZE,
            duration: req.durationSeconds,
          },
        }),
        signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS),
      });
      submit = (await readJsonOrThrow(res, `dashscope submit (${videoModel()})`)) as DashScopeSubmitResponse;
    } catch (err) {
      if (err instanceof InfluencerProviderError) throw err;
      throw networkError("dashscope submit", err);
    }

    const taskId = submit.output?.task_id;
    if (!taskId) {
      throw new InfluencerProviderError(
        `dashscope submit: no task_id in response (${submit.request_id ?? "no request_id"})`,
        true
      );
    }
    console.log(`[f-influencer] dashscope task submitted: ${taskId} (${videoModel()})`);

    // ── poll every 3s until SUCCEEDED / FAILED / 10-minute timeout ──
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    for (;;) {
      if (Date.now() >= deadline) {
        throw new InfluencerProviderError(
          `dashscope task ${taskId}: poll timeout after ${POLL_TIMEOUT_MS / 1000}s (still not SUCCEEDED)`,
          true
        );
      }
      await sleep(POLL_INTERVAL_MS);

      let task: DashScopeTaskResponse;
      try {
        const res = await fetch(`${baseUrl()}${TASK_PATH}/${taskId}`, {
          headers: { authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(POLL_TIMEOUT_PER_CALL_MS),
        });
        task = (await readJsonOrThrow(res, `dashscope poll ${taskId}`)) as DashScopeTaskResponse;
      } catch (err) {
        if (err instanceof InfluencerProviderError && !err.retryable) throw err;
        // Transient poll errors (429/5xx/network) are retried within the window.
        console.warn(`[f-influencer] dashscope poll transient error (will retry): ${String(err).slice(0, 160)}`);
        continue;
      }

      const status = task.output?.task_status;
      if (status === "SUCCEEDED") {
        const videoUrl = task.output?.video_url;
        if (!videoUrl) {
          throw new InfluencerProviderError(
            `dashscope task ${taskId}: SUCCEEDED but no output.video_url`,
            false
          );
        }
        console.log(`[f-influencer] dashscope task ${taskId} SUCCEEDED → video url (${videoUrl.length} chars)`);
        return {
          assetUrl: videoUrl,
          kind: "video",
          meta: { model: videoModel(), provider: "dashscope", taskId, size: VIDEO_SIZE },
        };
      }
      if (status === "FAILED" || status === "CANCELED" || status === "UNKNOWN") {
        // Provider-reported terminal failure — NOT retryable (the same request
        // would fail identically).
        throw new InfluencerProviderError(
          `dashscope task ${taskId} ${status}: ${task.output?.message ?? task.output?.code ?? "no detail"}`,
          false
        );
      }
      // PENDING / RUNNING — keep polling.
    }
  },
};
