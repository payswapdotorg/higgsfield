# Video route benchmark — LIVE MEASURED (Task 77-78 station probes; Task 86 station measurements)

> Law: measured numbers only; null stays null. Probe dates: 2026-10-17/18 session
> (worklog Task 77-78), 2026-10-18 station measurements (worklog Task 86), DashScope
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
