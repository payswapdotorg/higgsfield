# Acceptance criteria — mission §G gate (20 items)

> Law: an item is `PASS` only with supporting evidence recorded; never merely because
> code exists. Status values: `PASS` / `FAIL` / `BLOCKED` / `NOT TESTED`.
> **All items are `NOT TESTED` at W7-A docs time** — wave 7's build/verify workers and
> the station fill these in. Evidence pointers anticipate where the proof will live.

| # | Criterion (mission §G) | Status | Evidence required to flip | Notes |
|---|---|---|---|---|
| 1 | Reference behavior documented with supporting evidence | **NOT TESTED** | REFERENCE_SCOPE.md + REVERSE_ENGINEERING_EVIDENCE.md reviewed by station | Docs complete at W7-A; station sign-off pending |
| 2 | Current repository and deployment audited | **NOT TESTED** | Phase-0 audit record (Task 77-78 worklog) + wave-3A code refs | Audit exists in the TL worklog; formal acceptance pending |
| 3 | All critical UI actions connected to real functionality | **NOT TESTED** | E2E/browser golden path on the deployed build | Includes Randomize, Generate, motion, library, history |
| 4 | Character settings validated and persist correctly | **NOT TESTED** | API tests: POST/PATCH/GET round-trip incl. invalid-spec 400s | zod strict law |
| 5 | Portrait and full-body generation work end to end | **NOT TESTED** | Two `done` jobs with real assets, credited 1.125 total (ev: 2252) | Live engine, not mock |
| 6 | Same character reproducible across multiple scenes | **NOT TESTED** | Regenerate + motion from one character; visual review record | Quantitative identity scoring deferred (see 13) |
| 7 | Identity preservation meets the agreed benchmark | **NOT TESTED** | IDENTITY_EVALUATION.md protocol run; human review record | Automated face-embedding deferred — documented deviation |
| 8 | Character editing without unacceptable identity drift | **NOT TESTED** | Edit-spec → regenerate comparison record | Wave-7 scope = spec-edit + same-reference regeneration; full editing routes deferred |
| 9 | Characters and configurations saved and retrievable | **NOT TESTED** | Refresh/retrieve cycle; jobs attached per character | |
| 10 | Motion transfer produces valid, playable videos | **NOT TESTED** | Real MP4 artifact archived as evidence (measured engine: wan2.2-i2v-flash) | Preset-prompt i2v route |
| 11 | Character replacement produces valid, playable videos | **NOT TESTED** — expected **BLOCKED** | — | DashScope gateway lacks VACE/animate (Task 77-78); self-host out of scope — see KNOWN_LIMITATIONS.md |
| 12 | Automated tests cover critical user journeys | **NOT TESTED** | Battery results incl. new influencer contract/behavior tests | W7-B/C deliver |
| 13 | Visual and identity regression tests reproducible | **NOT TESTED** | Fixed benchmark set + archived generations (IDENTITY_EVALUATION.md) | Human-review protocol wave 7; automation deferred |
| 14 | Provider failures, retries, timeouts handled correctly | **NOT TESTED** | Failure-injection tests across image+video providers | Existing H2 retry law extends to new adapters |
| 15 | Selected implementations have documented licensing status | **NOT TESTED** | LICENSE_REVIEW.md verified-vs-review flags accepted by TL | W7-A drafted; station acceptance pending |
| 16 | Performance and operating costs measured | **NOT TESTED** | Benchmark records (IMAGE/VIDEO_ROUTE_BENCHMARK.md) + live golden-path cost log | Latency measured; per-route cost pending live verification |
| 17 | Product uses its own branding and interface | **NOT TESTED** | UI review | No upstream/ZCode branding in the studio |
| 18 | Production deployment tested | **NOT TESTED** | Live golden path on the public Vercel URL incl. engine env vars | OpenRouter image route Vercel-side verify pending |
| 19 | Remaining limitations documented | **NOT TESTED** | KNOWN_LIMITATIONS.md reviewed | Complete at W7-A; station sign-off pending |
| 20 | Roadmap and handoff complete and repository-based | **NOT TESTED** | This docs set + worklog records + final acceptance report | Records worker closes wave 7 |

## Acceptance gates G1–G8 (mission §6.6)

| Gate | Required evidence | Wave-7 expectation |
|---|---|---|
| G1 Functional | Critical UI actions pass E2E | Achievable (items 3–5, 9, 10, 12) |
| G2 Persistence | Characters/settings/assets survive refresh | Achievable (items 4, 9) |
| G3 Identity | Image route meets agreed identity benchmark | Partial: human-review protocol; quantitative benchmark deferred (documented deviation) |
| G4 Visual quality | Human reviewers approve representative outputs | Station browser review |
| G5 Editing | Controlled edits preserve identity | Partial (spec-edit regeneration; dedicated edit route deferred) |
| G6 Motion | Video route passes motion/identity/temporal checks | Human review of archived MP4s |
| G7 Reliability | Failures/retries/timeouts/invalid input handled | Achievable (item 14) |
| G8 Production readiness | Licensing/security/storage/observability/cost documented | This docs set + deployment runbook |

Numerical thresholds are **not invented** in advance (mission §6.6 law): the TL sets
them after the reference baseline and candidate measurements exist. Null stays null.
