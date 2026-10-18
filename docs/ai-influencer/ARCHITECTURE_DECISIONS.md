# Architecture decisions — ADRs for AI Influencer wave 7

Recorded by W7-A from the TL's Task 77-78 decision log + dispatch architecture.
Statuses: **Decided** (TL ruling, recorded here) / **Provisional** (documented choice,
revisit trigger stated).

---

## ADR-01 — Two provider interfaces behind the existing ModelAdapter seam
**Status: Decided (TL, Task 77-78).**
Context: mission §5 demands interchangeable image/video engines without rewriting the
frontend or character registry; the repo already has a proven pluggable adapter seam.
Decision: image provider (openrouter | zai | mock) + video provider (dashscope | zai |
mock), env-gated `HF_IMAGE_PROVIDER` / `HF_VIDEO_PROVIDER`, default `mock`.
Alternatives rejected: one mega-provider interface (couples image/video concerns);
per-job provider flags in the DB (config drift); no provider layer (mission rule 6
violated).

## ADR-02 — Hosted-API-first engine strategy
**Status: Decided (TL, Task 77-78).**
Context: mission §F shortlists OSS routes (PuLID/PhotoMaker/InstantID/ComfyUI/Wan
self-host); our deployment is Vercel serverless + Neon with no GPU infrastructure.
Decision: production engines are OpenRouter (Gemini image family) + DashScope-intl
(wan2.2-i2v-flash); zai SDK for sandbox/local; mock for tests. OSS candidates rejected
with recorded rationale (OPEN_SOURCE_CATALOG.md) — dominated by infrastructure absence
and licensing traps (InsightFace, InstantID weight terms, Omnichar GPLv3).
Consequences: character replacement (VACE/animate) unavailable (gateway lacks the
models); identity conditioning is prompt-level reference conditioning, not LoRA or
face-embedding pipelines. Re-evaluation triggers recorded (self-host GPU route,
gateway exposing VACE, audio-driven requirement).

## ADR-03 — Reuse the Generation/CAS-worker/credits pipeline for influencer jobs
**Status: Decided (TL dispatch).**
Context: mission §9.2 wants durable jobs out of the interactive path; the clone
already has exactly that (atomic credit burn at POST, CAS worker, retry law, terminal
402, rate limiting) — battle-tested through waves 2–6 incl. the P1008 wedge fixes.
Decision: influencer jobs are ordinary `Generation` rows with new `job_set_type`
values (`influencer_portrait`, `influencer_fullbody`, `influencer_motion`); zero new
job machinery.
Consequence: mission states QUALITY_CHECK/REJECTED/CANCELLED map to "not implemented"
(documented in STATE_TRANSITIONS.md), not silently faked.

## ADR-04 — Provenance-tagged option library (ev: vs spec:)
**Status: Decided (TL, Task 77-78 doctrine shift).**
Context: only Character type's option set was captured (ev: 2104/142–166); the other
18 settings' options live in closed dropdowns (uncaptured). The wave-1..5 doctrine
("Any-only honest shell") is superseded **for this surface** by the user's
functional-parity mandate.
Decision: 18 curated option lists (4–10 options each, "Any" = unset default) tagged
`spec:` in a version-controlled library; the 9 Character-type options stay `ev:`.
The tags are load-bearing: every spec-curated value is distinguishable from evidence
forever. Upgrade path: re-base onto `ev:` values if a future authenticated capture
lands (OPEN_QUESTIONS.md Q12).

## ADR-05 — Motion = preset-prompt i2v on wan2.2-i2v-flash
**Status: Decided (constraint-driven; TL).**
Context: reference promises "Choose a motion preset and watch them perform it in a
video ready to share" (ev: 326) but its engine is unobservable; the DashScope gateway
has wan2.2 i2v models and NOT vace/animate (probe-verified).
Decision: motion presets = curated prompt library → `wan2.2-i2v-flash` i2v from the
character asset. Character replacement disclosed-unavailable. This is honest scope:
the shipped capability matches the captured promise, and the blocked capability is
named, not hidden.

## ADR-06 — Default provider = mock
**Status: Decided (TL, Task 77-78).**
Battery determinism law: tests must not depend on 63 s network calls or spend. Mock
stays the default; real providers are explicit env selections. Mission rule 5
enforced: no mock success is ever cited as production evidence.

## ADR-07 — Character record shape: spec JSON + referenceImage data-URI + asset links
**Status: Decided (TL dispatch).**
`Character(id, userId, name, spec JSON, referenceImage data-URI | null,
portraitUrl | null, fullBodyUrl | null, timestamps)`. JSON-in-String follows the repo's
established column convention; data-URI reference storage trades row size for
zero-new-infrastructure (no blob store in the stack). Additive-only Neon push.

## ADR-08 — Fractional credit representation
**Status: Provisional — W7-B must finalize (OPEN_QUESTIONS.md Q1).**
The evidence cost is 1.125 (ev: 2252) split 0.5625/0.5625, but `Generation.cost` is
`Int` and pool arithmetic is integer. Documented options: milli-credit scaling for
influencer rows vs schema type change. The *price* (1.125 total) is fixed by
evidence; only the storage representation is open. Whatever lands must be disclosed
in the wave-7 worklog.

## ADR-09 — Deterministic prompt builder (no hidden randomness)
**Status: Decided (TL dispatch).**
Spec → stable natural-language prompt, fixed order/phrasing; randomness confined to
provider seeds. Rationale: reproducibility (mission capability 8) and testability;
also makes spec→prompt→output lineage auditable in evidence records.

## ADR-10 — Identity evaluation: human station review, automated embeddings deferred
**Status: Decided (documented deviation).**
No face-embedding evaluation infrastructure exists in wave 7; quantitative identity
scores stay null (IDENTITY_EVALUATION.md). Human review = the TL's station browser
verification of archived golden-path outputs. Deferred, never claimed.

## ADR-11 — Motion credit cost = 1.125 (mirroring ev: 2252)
**Status: Provisional.**
The reference's motion price was never captured; the clone charges 1.125 — the only
evidence-captured influencer price — for the studio's other generation action.
Rationale: avoids inventing a second arbitrary number while keeping one studio price.
Revisit after live provider-cost measurement (OPEN_QUESTIONS.md Q5).
