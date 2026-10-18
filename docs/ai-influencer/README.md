# AI Influencer Studio — Wave 7 mission docs

> Owner: W7-A (docs + research worker). Branch: `hf/wave-7-docs`.
> Mission source: user strategy document (2026-10-17 intake, logged as Task 77-78)
> — "bring Higgsfield AI Influencer to functional/visual/production parity".

## What this is

Wave 7 rebuilds the AI Influencer surface (`/ai-influencer-studio`) from an
evidence-faithful **static shell** (wave 3A) into a **working product**: persistent
characters, real image generation (portrait + full-body), identity conditioning from
an optional uploaded reference, and motion-preset → video generation — all behind
provider interfaces so engines stay swappable.

This directory is the mission's documentation set (strategy doc §C), adapted to repo
conventions. Documentation-only artifacts live here; product code changes are owned by
W7-B (backend) and W7-C (frontend) on `hf/wave-7-influencer`.

## Provenance conventions (evidence honesty law)

| Tag | Meaning |
|---|---|
| `ev: <node>` | Directly captured evidence — node id from `evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json` (813 a11y nodes, captured 2026-10-17T08:02:40Z, evidence id `ev_c6df0ff81690880131885c05491849317dbe299412ec496a370c50e8011af57c`) |
| `published-spec:` | From Higgsfield's published blog description of the studio (Oct 3, 2026) — not directly observed in our capture |
| `spec:` | Clone-side curated choice under the wave-7 doctrine (published-spec options permitted, tagged — supersedes the wave-3 "Any-only" doctrine for this surface only) |
| `measured:` | Live engine measurement from the Task 77-78 station probes (see IMAGE/VIDEO_ROUTE_BENCHMARK.md) |
| `null` | Not measured. Never invented. |

Every factual claim about the reference product carries an evidence node citation or a
`published-spec:` / `spec:` tag. Null measurements stay null.

## Current state (wave-7 scope)

- **Before wave 7** (wave 3A, `src/components/studios/influencer/`): character builder
  with the 9 ev-captured Character-type options, 18 controls locked to "Any", Randomize
  (character-type only), **Generate disabled** (no job, no API), upload disabled,
  presets = gradient tiles, History = empty scope. No Character persistence, no real
  generation, no motion. Phase-0 audit logged as Task 77-78.
- **Wave 7 target**: canonical Character model + registry APIs, real image provider
  (OpenRouter Gemini image via Vercel / zai SDK in sandbox / mock in tests), real video
  provider (DashScope intl `wan2.2-i2v-flash` / zai / mock), portrait+full-body
  generation burning 1.125 credits (ev: 2252), motion presets → MP4, character library
  + history, all reusing the proven Generation / CAS-worker / credits pipeline.
- **Confirmed engines** (Task 77-78 live probes): DashScope intl wan2.2 video (real MP4
  in 30-43 s), zai SDK image (real JPEG in 63 s), OpenRouter paid calls verified
  (image models geo-blocked **from the sandbox only** — Vercel-side verification pending).

## Document set

| File | Purpose |
|---|---|
| [REFERENCE_SCOPE.md](REFERENCE_SCOPE.md) | What the evidence capture observed vs did not |
| [FEATURE_INVENTORY.md](FEATURE_INVENTORY.md) | Functional parity matrix (mission §1.1) with status columns |
| [BEHAVIOR_SPEC.md](BEHAVIOR_SPEC.md) | Stage-D behavior specs for the 9 core user scenarios |
| [STATE_TRANSITIONS.md](STATE_TRANSITIONS.md) | Job lifecycle (clone pipeline ↔ mission §9.2) + character record lifecycle |
| [REVERSE_ENGINEERING_EVIDENCE.md](REVERSE_ENGINEERING_EVIDENCE.md) | Evidence artifact index + explicit unknowns |
| [API_CONTRACTS.md](API_CONTRACTS.md) | Clone-side wave-7 API contracts (TL architecture) |
| [ACCEPTANCE_CRITERIA.md](ACCEPTANCE_CRITERIA.md) | Mission §G 20-item gate — all NOT TESTED until wave 7 fills them |
| [OPEN_QUESTIONS.md](OPEN_QUESTIONS.md) | Tracked open questions for the TL |
| [OPEN_SOURCE_CATALOG.md](OPEN_SOURCE_CATALOG.md) + [research-catalog.csv](research-catalog.csv) | Mission §F shortlist + §4.5 adaptations, with decisions |
| [LICENSE_REVIEW.md](LICENSE_REVIEW.md) | Code vs model-weight/service licensing, verified vs needs-legal-review |
| [IMAGE_ROUTE_BENCHMARK.md](IMAGE_ROUTE_BENCHMARK.md) | Live-measured image engine results (Task 77-78) |
| [VIDEO_ROUTE_BENCHMARK.md](VIDEO_ROUTE_BENCHMARK.md) | Live-measured video engine results (Task 77-78) |
| [IDENTITY_EVALUATION.md](IDENTITY_EVALUATION.md) | Evaluation protocol (mission §6.4/6.5) and wave-7 measurement plan |
| [KNOWN_LIMITATIONS.md](KNOWN_LIMITATIONS.md) | The honest list |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Wave-7 system architecture (TL decision) |
| [ARCHITECTURE_DECISIONS.md](ARCHITECTURE_DECISIONS.md) | ADRs for the wave-7 architecture decisions |

Note vs the mission §C file list: `ROADMAP.md` is not duplicated here — the dependency-aware
roadmap is maintained in the TL worklog/console ledger (Task 77-78 "Next" plan); `ROUTE_RECOMMENDATIONS.md`
is folded into OPEN_SOURCE_CATALOG.md's decision column + the two benchmark files.

## Related in-repo material

- Wave-3A implementation + its evidence citations: `src/components/studios/influencer/character-builder.tsx`, `influencer-studio.tsx`
- Route parity: `docs/route-parity-report.md` (Marketing/influencer studios section)
- Deployment/engine facts: `docs/DEPLOYMENT.md`, worklog Task 77-78 (engine probes)
- Existing pipeline this wave reuses: `src/server/worker.ts` (CAS worker), `src/server/adapters/types.ts` (ModelAdapter), `prisma/schema.prisma` (Generation/credits)
