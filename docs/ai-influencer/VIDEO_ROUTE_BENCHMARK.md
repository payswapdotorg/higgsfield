# Video route benchmark — LIVE MEASURED (Task 77-78 station probes; Task 86 station measurements; Task 93 production-DB evidence)

> Law: measured numbers only; null stays null. Probe dates: 2026-10-17/18 session
> (worklog Task 77-78), 2026-10-18 station measurements (worklog Task 86), 2026-10-18
> Neon-DB production rows re-audited read-only by the Task 93 worker, DashScope
> **intl** endpoint (`dashscope-intl.aliyuncs.com`) with the vaulted key.

## Measured results

| Route | Call | Result | Wall time | Notes |
|---|---|---|---|---|
| **`wan2.2-t2v-plus`** | text-to-video, 5 s, `832*480` | **real MP4** (submit 16:57:28 → done 16:57:58) | **30 s** | Async task API; OSS signed output URL |
| **`wan2.2-i2v-flash`** | image-to-video motion transfer: `img_url` (tiger.png probe) + motion prompt | **real MP4** | **43 s** | The wave-7 motion route: character asset + preset motion prompt |
| DashScope **China** endpoint (`dashscope.aliyuncs.com`) | any call | **key INVALID** (InvalidApiKey both endpoints) | n/a | Intl-only key; intl endpoint is the route |
| DashScope intl **chat (control)** | `qwen-flash` | real completion | null (not recorded) | Proves key validity |

Both MP4 outputs came back via the async task flow:
`POST /api/v1/services/aigc/video-generation/video-synthesis` + header
**`X-DashScope-Async: enable`** (without it → `AccessDenied "current user api does not
support synchronous calls"`) → poll `GET /api/v1/tasks/{id}` → `output.task_status` →
`SUCCEEDED` → `output.video_url`. Output URLs are **OSS signed, ~24 h expiry** (asset
persistence implication — KNOWN_LIMITATIONS.md, OPEN_QUESTIONS.md Q4).

## Model availability on the gateway (probe-verified)

| Model | Status |
|---|---|
| `wan2.2-t2v-plus` | available |
| `wan2.2-i2v-plus` | available |
| `wan2.2-i2v-flash` | available — **wave-7 motion route** |
| `wan2.5-*` | **NOT available** |
| `wan2.7-video` | **NOT available** |
| `wanx2.1-vace` | **NOT available** → character-replacement route unavailable |
| `wan2.2-animate` | **NOT available** → character-replacement route unavailable |

Parameter constraints (probe-verified): `size` must be one of `832*480`, `480*832`,
`1920*1080`, `1080*1920`, `1440*1440`, `1632*1248`, `1248*1632`, `624*624` —
`1280*720` is rejected.

## Consequences for the product

1. **Motion = preset-prompt i2v.** With VACE/animate absent, the motion studio
   animates the character image with a curated motion prompt via `wan2.2-i2v-flash` —
   which matches the reference's own hero semantics (ev: 326 "Choose a motion preset
   and watch them perform it in a video ready to share"). Character replacement is
   disclosed-unavailable (mission §5.5 Replacement route → BLOCKED in
   ACCEPTANCE_CRITERIA.md).
2. **Character-animation fidelity is bounded by i2v-flash quality** — full-body pose
   replication from a driving video is NOT available; the evaluation protocol judges
   what we actually ship.
3. **Engine-family corroboration (weak evidence):** the reference's captured notices
   body lists a `wan2_2_animate_faceswap` job_set_type — naming evidence the reference
   platform itself runs wan2.2-animate-class jobs. It does not identify the influencer
   motion route's engine, but it aligns our wan2.2-family choice with the reference's
   apparent engine family.

## Not yet measured (null)

- i2v-plus vs i2v-flash quality/latency on character images (plus tier unprobed).
- 1080p sizes latency/cost; 10 s durations; per-model API cost (pricing page reading
  not banked — null).
- Motion-preset prompt fidelity on real character assets (wave-7 golden path will
  measure).
- Failure/timeout rates; concurrent task limits.
- zai video route (`cogvideox-3` via `video.generations.create` + `async.result.query`)
  beyond the in-flight probe at Task 77-78 — sandbox-only alt, not the production route.

## Route decision (TL, Task 77-78)

`HF_VIDEO_PROVIDER` = `dashscope` (production — works everywhere incl. Vercel) | `zai`
(sandbox alt, cogvideox-3) | `mock` (tests; **default**).

## Task 86 station measurements (2026-10-18)

Live-verified problem on the production Vercel deployment (Task 84's deploy,
`HF_VIDEO_PROVIDER=dashscope`, public URL): the motion pipeline (wan2.2-i2v)
fails at SUBMIT when the reference portrait is a large data URI — while the
same large body flies from the station sandbox. All facts below are
live-measured; nothing invented.

| Observation | Egress | Result | Wall time | Notes |
|---|---|---|---|---|
| Motion submit, real portrait reference (JPEG data URI ≈625KB decoded, ≈840KB JSON body) | **Vercel production** | **FAIL — two consecutive failures**, job error verbatim: `dashscope submit: network error — The operation was aborted due to timeout` | ≥60 s (abort fires) | The provider's own `AbortSignal.timeout(60_000)` fires; the function itself survives ≥60 s |
| The SAME ~815KB JSON body | station sandbox → dashscope-intl | **task accepted** | **0.66 s** | Body size is not the problem at the gateway itself |
| Motion submit, ~3KB body (mock SVG reference, Task 84) | **Vercel production** | **succeeded** (task submitted + polled; the task FAILED only on the non-raster input) | n/a (not recorded) | Small bodies pass from Vercel fine |
| Station probe task `8fdf18d0` — real 611KB klein JPEG as `img_url` | station sandbox → dashscope-intl | **SUCCESS — real MP4 produced** | **~40 s** | The engine itself is healthy |

**Conclusion (large-body egress throttle):** dashscope-intl (Singapore)
throttles/stalls large POST bodies from Vercel us-east-1 egress; small bodies
pass. The engine, the async task flow, and the key are all fine — only the
transport of bulky bodies from Vercel is the problem.

### Compaction mitigation (Task 86 — `src/server/influencer/dashscope-provider.ts`)

Before building the submit body, `animate()` compacts the reference when it is
a bulky data URI:

- Applies only when `referenceImage` starts with `data:` AND its decoded byte
  size exceeds the threshold (https URLs pass through verbatim).
- Env knob `HF_DASHSCOPE_REF_MAX_KB` (default **220**): the max decoded KB
  allowed through uncompacted; a value ≤ 0 disables compaction entirely.
- Compaction: `sharp` (dynamically imported — never loaded on the mock/test
  path) `resize(768, 768, { fit: "inside", withoutEnlargement: true })` →
  `jpeg({ quality: 82 })` → re-wrapped as `data:image/jpeg;base64,…`.
- **Never-fail guard**: any sharp import/processing error WARNs
  (`[f-influencer] dashscope reference compaction failed — passing original
  through: …`) and the ORIGINAL reference is submitted — compaction must never
  block the pipeline. A compact that is not smaller than the original keeps the
  original.
- Success log (format; the numbers are the measured original → compacted
  sizes): `[f-influencer] dashscope reference compacted: 625KB → 118KB
  (wan2.2 submit body; Vercel-egress throttle mitigation, Task 86)`.

### Not yet measured (null, Task 86)

- Vercel-side re-verification of the mitigated submit (the compacted body
  passing the egress throttle from Vercel) — null until the station re-runs
  the live motion path post-deploy.
- Compacted-reference motion quality vs the full-size reference (768px / q82
  identity fidelity on real portraits) — null until the live re-run.

## Task 93 production evidence + mitigation (2026-10-18)

The deployed product (Vercel us-east-1 → dashscope-intl Singapore) still
stalls the wan2.2 submit POST intermittently AFTER Task 86's compaction —
the stall is connection-level, not size-gated. Every row below was
re-verified first-hand by the Task 93 worker with a read-only query against
the live Neon DB (the DB behind the Vercel deployment); job errors verbatim.

| Timestamp (UTC, generation row) | Result | Detail |
|---|---|---|
| 2026-10-18T22:03:03Z | **FAIL — submit timeout** | `dashscope submit: network error — The operation was aborted due to timeout` — POST-compaction (the live deployment was 223c584, which includes the Task 86 mitigation) |
| 2026-10-18T13:05:01Z | **FAIL — submit timeout** | same error verbatim |
| 2026-10-18T13:00:01Z | **FAIL — submit timeout** | same error verbatim (reference = the 12:58 sheet's JPEG data-URI portrait; the sheet rows stored ~876KB / ~774KB data-URI assets — the large-body era Task 86 measured) |
| 2026-10-18T22:08:58Z | **SUCCESS** | the user's own re-submit of the 22:03 failure — real wan2.2 MP4, cost 5, OSS signed `video_url` |
| 2026-10-18T13:41:43Z | **SUCCESS** | the 13:0x failures eventually went through too — real wan2.2 MP4, cost 5, OSS signed `video_url` |

**Rationale (retry-once, fresh connection):** the stall is connection-level
and intermittent — a FRESH submit attempt has a good chance of going
through, exactly as the user-level re-submits proved twice (22:03 → 22:08
and 13:05 → 13:41; the DB rows are facts, the retry pairing is the station
audit's reading — each re-submit is a fresh POST with no job-level linkage).

### Mitigation (Task 93 — `src/server/influencer/dashscope-provider.ts`)

1. **One fresh-connection submit retry.** On a fetch-level submit network
   error — AbortError/timeout, ECONNRESET, EPIPE, socket hang-up, any
   transport failure thrown by `fetch` BEFORE an HTTP response exists — the
   submit is retried EXACTLY ONCE with a completely fresh `fetch` (fresh
   connection + fresh `AbortSignal`).
2. **HTTP responses are never retried here.** An error carrying an HTTP
   status code keeps its existing per-status classification (402/403/400/
   401/404 → non-retryable; 429/5xx → retryable via the worker's own retry
   machinery) — a status-carrying answer would come back the same way.
3. **Second failure → the ORIGINAL error stands.** If the fresh-connection
   retry also fails at transport level, the job fails with the FIRST
   attempt's error (the existing error shape) — the retry never masks the
   original failure.
4. **The submit body is built once.** Task 86's compaction still runs before
   the body build (structure unchanged); both attempts reuse the identical
   body — compaction is expensive and deterministic.
5. **Submit timeout env knob `HF_DASHSCOPE_SUBMIT_TIMEOUT_MS`** (default
   **60_000 — UNCHANGED**; the station decides the prod value): never-fail
   module-level parse (the Task 86 `HF_DASHSCOPE_REF_MAX_KB` style) —
   missing / non-numeric / unparsable / ≤ 0 → default (the timeout can NOT
   be disabled: an unbounded submit would hang a serverless invocation);
   values above the **300_000** (5 min) serverless-sanity cap clamp to the
   cap with a `console.warn`.

**DISCLOSED RISK (orphan task):** if the first submit actually reached
dashscope and only the RESPONSE was lost, the retry creates an orphaned
server-side task whose output is never fetched. No correctness impact — the
product tracks only the retry's task ID; the orphan simply wastes dashscope
free-tier quota. This mirrors the single-fallback pattern in the cloudflare
image provider (Task 85): the same one-extra-attempt trade-off class,
disclosed there too.

### Not yet measured (null, Task 93)

- Station post-deploy live re-verification of the retry path on the Vercel
  deployment (a real egress stall recovered by the in-provider retry) — null
  until the station re-runs the live motion path post-deploy.
- Orphan-task frequency (the response-lost case) — null; no orphan has been
  observed in the audited window.
