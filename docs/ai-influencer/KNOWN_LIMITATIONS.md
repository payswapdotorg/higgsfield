# Known limitations (the honest list)

Wave 7 ships with these limitations. Each is disclosed, not hidden; several have
upgrade paths in OPEN_QUESTIONS.md.

## Engine & route limitations

1. **OpenRouter image route unverified from production egress.** All 12 image-output
   models 403 region-gated **from the sandbox** (Task 77-78); the Vercel-side
   verification is pending. Until then the production image route is measured-intent,
   not measured-fact. (IMAGE_ROUTE_BENCHMARK.md)
2. **zai SDK image route is sandbox-only** (private-network machine auth,
   `internal-api.z.ai` @ 172.25.x) — 63 s/1024px real JPEG measured, but the route
   cannot exist on Vercel. Local dev only.
3. **DashScope-intl image is dead** (compatible-mode returns empty content) — no
   second hosted image route.
4. **Character replacement (object replacement) unavailable.** The DashScope gateway
   lacks `wanx2.1-vace` and `wan2.2-animate` (probe-verified); self-hosted VACE needs
   GPU infrastructure we don't run. Mission capability #12 = BLOCKED, disclosed in-UI,
   never faked.
5. **Motion is preset-prompt i2v, not driving-video transfer.** `wan2.2-i2v-flash`
   animates the character image from a text prompt; full-body pose replication from a
   reference video (Wan-Animate-class) is not reachable through the hosted gateway.
   This matches the reference's preset semantics (ev: 326) but is NOT the reference's
   (uncaptured, unknown) engine.
6. **Latency floor**: image ~63 s (zai measured; OpenRouter pending), video ~43 s
   (measured). Interactive request paths must never block on these (mission §9.2 law —
   the job queue exists for this); Vercel function-duration interaction is an open
   architectural risk (OPEN_QUESTIONS.md Q3).

## Asset & persistence limitations

7. **OSS video URLs expire ~24 h.** DashScope output URLs are signed OSS links; raw
   `asset_url` storage rots in a day. Durable re-hosting strategy unresolved
   (OPEN_QUESTIONS.md Q4).
8. **Reference images stored as data-URIs on the character row** — simple, portable,
   but bloats rows and payloads vs object storage; acceptable at demo scale, a storage
   decision later.

## Evidence & specification limitations

9. **18 of 19 option sets are spec-curated, not evidence.** Only Character type's 9
   options were captured (ev: 2104/142–166); Gender…Accessories lists are clone-side
   `spec:` values (REFERENCE_SCOPE.md). Option parity with the reference is unprovable
   with current evidence.
10. **Motion preset library is spec-curated.** The reference's preset list was never
    captured (ev: 326 promises presets; names/contents unknown).
11. **Generation API contract is a clone-side design.** 0 network rows captured; the
    reference's actual request/response shapes, job semantics and billing API are
    unknown (REVERSE_ENGINEERING_EVIDENCE.md).
12. **Fractional credits (1.125 / 0.5625) vs the integer credit pipeline** is an
    implementation consideration W7-B must resolve and disclose (OPEN_QUESTIONS.md Q1).
13. **Preset gallery cards are placeholders** (gradients / generated assets), and
    "Higgsfield Presets" / "Community Trends" sources render as disclosed scoped
    states — the reference's card sets are uncaptured.

## Evaluation limitations

14. **Identity drift is unmeasured quantitatively.** No face-embedding evaluation
    exists in wave 7; identity consistency is judged by human station review only
    (IDENTITY_EVALUATION.md). Reference-image identity transfer quality is therefore
    qualitative.
15. **No reference-quality baseline exists** — no reference outputs were captured, so
    "visual parity with Higgsfield" claims are limited to interface/functional parity
    plus honest judgment of our own outputs.
16. **ACCEPTANCE_CRITERIA.md items start NOT TESTED** and only flip on recorded
    evidence; item 11 (character replacement) is expected BLOCKED.

## Scope limitations

17. **Image refinement is regeneration-class only** — spec-edit + same-reference
    regenerate; dedicated edit routes (outfit-swap preserving identity, masked edits)
    are deferred (mission §5.4 Route 4 not built).
18. **Downstream integrations (Genjutsu / Cinema Studio hand-off) are out of wave-7
    scope** (published-spec capability; unobserved; deferred with the studio backlog).
19. **Cancellation/QUALITY_CHECK/REJECTED job states are not implemented** (mission
    §9.2 states the clone maps onto its simpler proven lifecycle —
    STATE_TRANSITIONS.md).
20. **Research pass coverage**: Gitee, OpenXLab, and Chinese-language systematic
    searches were not performed (OPEN_SOURCE_CATALOG.md); the catalog is a mission-
    shortlist-driven pass, not an exhaustive survey — and says so.
