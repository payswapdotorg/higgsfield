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
 *
 * Task 86 station measurements (2026-10-18, the production Vercel deployment —
 * encoded verbatim; nothing invented):
 *   · The motion pipeline failed at SUBMIT twice in a row with
 *     `dashscope submit: network error — The operation was aborted due to
 *     timeout` — this provider's own AbortSignal.timeout(60_000) fired; the
 *     Vercel function itself survived ≥60s. Trigger: the reference portrait
 *     was a real JPEG data URI ≈625KB decoded (≈840KB JSON body).
 *   · The SAME ~815KB JSON body submitted from the station sandbox reaches
 *     dashscope-intl in 0.66s (task accepted); Task 84's Vercel submit with a
 *     ~3KB body (mock SVG reference) succeeded fine. Conclusion: dashscope-intl
 *     (Singapore) throttles/stalls large POST bodies from Vercel us-east-1
 *     egress; small bodies pass — the engine is healthy, only the transport is
 *     the problem.
 *   · A station probe (task 8fdf18d0, submitted from the sandbox with a real
 *     611KB klein JPEG as img_url) SUCCEEDED in ~40s and produced a real MP4.
 *   · Mitigation (this file): compact the reference before submit when it is
 *     a bulky data URI — sharp resize 768×768 {fit:"inside", withoutEnlargement}
 *     → JPEG quality 82; threshold env HF_DASHSCOPE_REF_MAX_KB (default 220
 *     decoded KB allowed through uncompacted; ≤0 disables compaction).
 *     NEVER-FAIL: on any sharp import/processing error the ORIGINAL reference
 *     is submitted unchanged (compaction must never block the pipeline), and
 *     a compact that is not smaller than the original keeps the original too.
 *
 * Task 93 production evidence + mitigation (2026-10-18, re-verified first-hand
 * by this worker with a read-only query against the live Neon DB — the DB
 * behind the Vercel deployment; job errors verbatim; nothing invented):
 *   · The submit stall is INTERMITTENT, not size-gated — Task 86's compaction
 *     reduced but did NOT eliminate it: 2026-10-18T22:03:03Z failed
 *     POST-compaction (the live deployment was 223c584, which includes the
 *     mitigation) with the same `dashscope submit: network error — The
 *     operation was aborted due to timeout`; so did 13:00:01Z and 13:05:01Z.
 *   · BUT the user-level re-submits SUCCEEDED: 22:08:58Z (the 22:03 retry) and
 *     13:41:43Z both produced real wan2.2 MP4s (cost 5 each). A FRESH submit
 *     attempt goes through — the stall is connection-level.
 *   · Mitigation (this file): on a fetch-level submit network error —
 *     AbortError/timeout, ECONNRESET, EPIPE, socket hang-up, any transport
 *     failure thrown by fetch BEFORE an HTTP response exists (an
 *     InfluencerProviderError means an HTTP response ARRIVED — its per-status
 *     classification stands and is never retried here) — retry the submit
 *     EXACTLY ONCE with a completely fresh fetch (fresh connection + fresh
 *     AbortSignal). A second transport failure throws the ORIGINAL (first)
 *     error. The submit body is built ONCE before both attempts (compaction
 *     is expensive and deterministic; only the fetch is retried).
 *   · DISCLOSED RISK: if the first submit actually reached dashscope and only
 *     the RESPONSE was lost, the retry orphans a server-side task whose
 *     output is never fetched — no correctness impact (only the retry's task
 *     ID is tracked), but it wastes dashscope free-tier quota. Mirrors the
 *     single-fallback pattern in cloudflare-provider.ts (Task 85) — the same
 *     one-extra-attempt trade-off class, disclosed there too.
 *   · Submit timeout knob HF_DASHSCOPE_SUBMIT_TIMEOUT_MS (default 60_000 —
 *     UNCHANGED; the station decides the prod value): never-fail module-level
 *     parse (the Task 86 HF_DASHSCOPE_REF_MAX_KB style) — missing / non-numeric
 *     / ≤ 0 → default (the timeout can NOT be disabled; an unbounded submit
 *     would hang a serverless invocation); values above the 300_000 serverless
 *     sanity cap clamp to the cap with a console.warn.
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
const POLL_TIMEOUT_PER_CALL_MS = 30_000;

// Task 93 submit-timeout knob (see the header's production evidence):
// the wan2.2 submit POST timeout in ms — env-tunable, default UNCHANGED at 60s.
const SUBMIT_TIMEOUT_MS_DEFAULT = 60_000;
const SUBMIT_TIMEOUT_MS_CAP = 300_000; // 5 min — serverless sanity; larger env values clamp here

// Task 86 compaction knobs (see the header's station measurements):
// max decoded KB allowed through the submit body UNCOMPACTED (default 220);
const REF_MAX_KB_DEFAULT = 220;
const COMPACT_EDGE = 768; // resize bound — fit "inside", never enlarged
const COMPACT_JPEG_QUALITY = 82;

// wan2.2 size whitelist (probe-verified): 832*480/480*832/1920*1080/1080*1920/
// 1440*1440/1632*1248/1248*1632/624*624 — 1280*720 is INVALID.
const VIDEO_SIZE = "832*480";

function baseUrl(): string {
  return process.env.HF_DASHSCOPE_BASE_URL ?? DEFAULT_BASE_URL;
}

function videoModel(): string {
  return process.env.HF_DASHSCOPE_VIDEO_MODEL ?? "wan2.2-i2v-flash";
}

/**
 * HF_DASHSCOPE_REF_MAX_KB (default 220): the max decoded KB of a data-URI
 * reference allowed through the submit body UNCOMPACTED. A value ≤ 0 disables
 * compaction entirely; a non-numeric value falls back to the default.
 */
function refMaxKb(): number {
  const raw = process.env.HF_DASHSCOPE_REF_MAX_KB;
  if (raw === undefined || raw.trim() === "") return REF_MAX_KB_DEFAULT;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : REF_MAX_KB_DEFAULT;
}

/**
 * HF_DASHSCOPE_SUBMIT_TIMEOUT_MS (default 60_000 — UNCHANGED, Task 93): the
 * wan2.2 submit POST timeout in ms. Never-fail parse in the Task 86
 * HF_DASHSCOPE_REF_MAX_KB style: missing / non-numeric / unparsable / ≤ 0 →
 * the default — the timeout can NOT be disabled (an unbounded submit would
 * hang a serverless invocation); values above the 5-minute serverless sanity
 * cap clamp to the cap with a warn.
 */
function parseSubmitTimeoutMs(): number {
  const raw = process.env.HF_DASHSCOPE_SUBMIT_TIMEOUT_MS;
  if (raw === undefined || raw.trim() === "") return SUBMIT_TIMEOUT_MS_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) return SUBMIT_TIMEOUT_MS_DEFAULT;
  if (parsed > SUBMIT_TIMEOUT_MS_CAP) {
    console.warn(
      `[f-influencer] HF_DASHSCOPE_SUBMIT_TIMEOUT_MS=${raw} exceeds the ${SUBMIT_TIMEOUT_MS_CAP}ms serverless cap — clamping (Task 93)`
    );
    return SUBMIT_TIMEOUT_MS_CAP;
  }
  return parsed;
}

// Parsed ONCE at module level (Task 93). Side-effect-free at the default — the
// mock/test path (provider envs unset) sees zero logging and zero behavior
// change. Each submit attempt builds a FRESH AbortSignal from this value.
const SUBMIT_TIMEOUT_MS = parseSubmitTimeoutMs();

/**
 * Vercel-egress throttle mitigation (Task 86): compact a bulky data-URI
 * reference (sharp 768×768 fit "inside" / JPEG q82) before it rides the
 * wan2.2 submit body — dashscope-intl stalls large POST bodies from Vercel
 * us-east-1 until the 60s submit timeout fires (header facts).
 *
 * Contract: NEVER-FAIL — a sharp import/processing error WARNs and passes the
 * ORIGINAL through (compaction must never block the pipeline); a compact that
 * is not smaller than the original keeps the original; https URLs and
 * under-threshold / malformed data URIs pass through untouched (a malformed
 * URI is the gateway's error to report, not compaction's).
 *
 * The data:<mime>;base64,<payload> parsing mirrors the cloudflare provider's
 * referenceToBlob style but is kept local/small — do NOT import across
 * providers. sharp is DYNAMICALLY imported so the mock/test path (and every
 * non-bulky reference) never loads the native module.
 */
async function compactReferenceIfBulky(referenceImage: string): Promise<string> {
  if (!referenceImage.startsWith("data:")) return referenceImage; // https URL — verbatim
  const maxKb = refMaxKb();
  if (maxKb <= 0) return referenceImage; // compaction disabled

  const comma = referenceImage.indexOf(",");
  if (comma === -1 || !referenceImage.slice(5, comma).includes("base64")) {
    return referenceImage; // not a data:…;base64,<payload> URI — pass through
  }
  const bytes = Buffer.from(referenceImage.slice(comma + 1), "base64");
  if (bytes.length === 0 || bytes.length <= maxKb * 1024) {
    return referenceImage; // empty or under the threshold — nothing to compact
  }

  const kb = (n: number) => Math.round(n / 1024);
  try {
    const { default: sharp } = await import("sharp"); // dynamic — never loaded on the mock/test path
    const compacted = await sharp(bytes)
      .resize(COMPACT_EDGE, COMPACT_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: COMPACT_JPEG_QUALITY })
      .toBuffer();
    if (compacted.length === 0 || compacted.length >= bytes.length) {
      return referenceImage; // not smaller (or empty) — keep the original
    }
    console.log(
      `[f-influencer] dashscope reference compacted: ${kb(bytes.length)}KB → ${kb(compacted.length)}KB ` +
        `(wan2.2 submit body; Vercel-egress throttle mitigation, Task 86)`
    );
    return `data:image/jpeg;base64,${compacted.toString("base64")}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn(
      `[f-influencer] dashscope reference compaction failed — passing original through: ${msg.slice(0, 200)}`
    );
    return referenceImage;
  }
}

interface DashScopeSubmitResponse {
  output?: { task_id?: string; task_status?: string };
  request_id?: string;
}

interface DashScopeTaskResponse {
  output?: { task_status?: string; video_url?: string; message?: string; code?: string };
  request_id?: string;
}

/**
 * One wan2.2 submit POST attempt (async task API — X-DashScope-Async: enable
 * is mandatory). Throws readJsonOrThrow's InfluencerProviderError whenever an
 * HTTP response arrives (per-status classification — the caller does NOT
 * retry those), and propagates the RAW fetch-level error on transport failure
 * (AbortError/timeout, ECONNRESET, EPIPE, socket hang-up — the caller's
 * fresh-connection retry territory, Task 93). A fresh AbortSignal per call.
 */
async function submitTask(apiKey: string, body: string): Promise<DashScopeSubmitResponse> {
  const res = await fetch(`${baseUrl()}${SUBMIT_PATH}`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "x-dashscope-async": "enable",
    },
    body,
    signal: AbortSignal.timeout(SUBMIT_TIMEOUT_MS), // fresh signal per attempt (Task 93)
  });
  return (await readJsonOrThrow(res, `dashscope submit (${videoModel()})`)) as DashScopeSubmitResponse;
}

export const dashscopeMotionProvider: InfluencerMotionProvider = {
  name: "dashscope",

  async animate(req: InfluencerMotionRequest): Promise<InfluencerAsset> {
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      throw new InfluencerProviderError("DASHSCOPE_API_KEY is not configured", false);
    }

    // ── Vercel-egress throttle mitigation (Task 86): compact the reference
    // when it is a bulky data URI BEFORE building the submit body. ──
    const imgRef = await compactReferenceIfBulky(req.referenceImage);

    // ── submit (async task API) — Task 93: one fresh-connection retry on a
    // fetch-level network error. The body is built ONCE before the attempts
    // (compaction ran above — expensive and deterministic; both attempts
    // reuse the identical body); only the fetch itself is retried. ──
    const submitBody = JSON.stringify({
      model: videoModel(),
      input: {
        prompt: req.prompt,
        img_url: imgRef, // data URI (compacted when bulky — Task 86) or https URL — verbatim pass-through
      },
      parameters: {
        size: VIDEO_SIZE,
        duration: req.durationSeconds,
      },
    });

    let submit: DashScopeSubmitResponse;
    try {
      submit = await submitTask(apiKey, submitBody);
    } catch (err) {
      if (err instanceof InfluencerProviderError) {
        // An HTTP response arrived — the existing per-status classification
        // stands; NO fresh-connection retry (a status-carrying answer would
        // come back the same way, and the worker's own retry machinery
        // already handles the retryable statuses).
        throw err;
      }
      // Fetch-level transport failure (AbortError/timeout, ECONNRESET, EPIPE,
      // socket hang-up — anything thrown before an HTTP response exists).
      // Production evidence (header, Task 93): the Vercel→dashscope-intl
      // stall is connection-level and intermittent, and a FRESH submit went
      // through twice at user level (22:03→22:08, 13:05→13:41) — so retry the
      // submit EXACTLY ONCE with a completely fresh fetch (fresh connection +
      // fresh AbortSignal). DISCLOSED RISK: if the first submit reached
      // dashscope and only the response was lost, this retry orphans a
      // server-side task whose output is never fetched — no correctness impact
      // (only the retry's task ID is tracked), it wastes dashscope free-tier
      // quota; mirrors the single-fallback pattern in cloudflare-provider.ts
      // (Task 85).
      const brief = err instanceof Error ? err.message : String(err);
      console.warn(
        `[f-influencer] dashscope submit retry 1/1 after network error (${brief.slice(0, 200)}): fresh connection (Task 93 — Vercel-egress stall mitigation)`
      );
      try {
        submit = await submitTask(apiKey, submitBody);
      } catch (err2) {
        if (err2 instanceof InfluencerProviderError) throw err2; // the retry got an HTTP response — its classification stands
        // Second transport failure — the ORIGINAL (first) error stands: the
        // job fails with the existing error shape, never masked by the retry's
        // own failure.
        throw networkError("dashscope submit", err);
      }
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
