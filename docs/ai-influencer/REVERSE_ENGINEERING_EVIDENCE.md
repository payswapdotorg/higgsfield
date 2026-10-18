# Reverse-engineering evidence index

## Artifacts and what each proves

| Artifact | What it establishes | What it does NOT establish |
|---|---|---|
| `evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json` (evidence id `ev_c6df0ff81690880131885c05491849317dbe299412ec496a370c50e8011af57c`, captured 2026-10-17T08:02:40Z) | The interface skeleton of `https://higgsfield.ai/ai-influencer-studio`: creation-mode tabs (2078 → 124/126), the 19 settings headings (134–289) with the single captured option set (Character type, group 2104 → 142–166), upload control (129/132), Randomize/Generate (295/297) with "1.125 credits" (2252), Explore/History (303 → 304/307), the hero (322/326) promising motion-preset video, preset sources (328 → 329/333/337) and the 10 preset cards (341–395) with View-character-sheet/Recreate actions | Any backend behavior: **0 network requests captured** (`prior_activity_available: false`) — the generation contract, job lifecycle, persistence API and billing API of the reference are entirely unknown from this artifact |
| `evidence/rea-2026-10-17/api-bodies-digest.json` → `settings` body | The user-settings surface carries `ai_influencer_consent` / `ai_influencer_consented_at` keys — the reference has an AI-influencer-specific consent toggle (identity-reference authorization surface exists upstream) | The consent flow's UI or enforcement behavior |
| `evidence/rea-2026-10-17/api-bodies-digest.json` → `notices` body | ① The reference's job pipeline has an **`ai_influencer` job_set_type** (internal naming evidence for the influencer generation pipeline), with a live warning notice: "AI Influencer is facing issues due to high user load. Generation may fail, credits auto-refunded" — i.e. the reference **auto-refunds credits when generation fails**. ② The same notices body lists a **`wan2_2_animate_faceswap`** job_set_type — naming evidence that the reference platform runs wan2.2-animate-class face-swap jobs (supports our wan2.2-family engine choice; does NOT tell us which engine the influencer *motion* route itself uses) | Whether the clone's no-refund-on-retry law (existing pipeline) or a refund-on-terminal-failure law (per this notice) governs wave 7 — see OPEN_QUESTIONS.md Q15 |
| `src/components/studios/influencer/character-builder.tsx` + `influencer-studio.tsx` (wave-3A, with `// ev:` comments) | The exact node→UI mapping of the wave-3A honest shell; the canonical in-repo statement of which nodes exist | Anything beyond the capture (they deliberately render "Any" for uncaptured options) |
| `docs/route-parity-report.md` (Marketing/influencer studios section) | `/ai-influencer-studio` is a 1-key captured live route implemented 1:1 in the clone | Deeper studio routes (none captured) |
| Worklog Task 77-78 (engine probes) | **Live measured** engine facts: zai SDK image (real 1024×1024 JPEG, 63,228 ms), OpenRouter paid-text verified + all 12 image models 403 region-gated from the sandbox, DashScope-intl wan2.2 video (real MP4s, 30 s / 43 s wall; model availability list; size whitelist; async-task API mechanics; OSS ~24 h URLs), DashScope image-via-compatible-mode dead | Vercel-side OpenRouter image behavior (pending); any quality scoring (null by law) |
| This `docs/ai-influencer/` set | The wave-7 specification, contracts, benchmarks and decisions | — |

Capture limitations carried by the artifact itself (verbatim summary of its
`limitations` array): observation starts when REA attaches (prior network/console
activity unavailable); raw headers/bodies/cookies/storage/websocket payloads never
retained; source maps not fetched; URL-less scripts excluded; CDP attachment state and
browser host platform unobserved.

## Explicit unknowns (the known-unknowns register)

1. **18 uncaptured option sets** — Gender, Build, Hairstyle, Hair Color, Style,
   Ethnicity, Age, Skin color, Height, Proportions, Head shape, Neck, Eye shape, Eye
   color, Features, Facial hair, Distinctive features, Accessories (ev: headings
   169–289). Wave 7 ships curated `spec:` lists (4–10 options each, "Any" = unset).
2. **Motion preset list uncaptured** — the Motion tab (ev: 126) and the hero copy
   (ev: 326) prove motion presets exist; names, count, previews are unknown. Wave 7
   ships a curated `spec:` preset-prompt library.
3. **Generation API contract uncaptured** — 0 network rows. The reference's request
   shapes, sync/async semantics, polling, error bodies, progress reporting: unknown.
   Everything in API_CONTRACTS.md is a clone-side design.
4. Reference **job lifecycle** unknown → the clone maps its own pipeline onto the
   mission §9.2 model (STATE_TRANSITIONS.md).
5. **Character-sheet modal contents** unknown (ev: buttons 343 et al. only).
6. **Recreate flow semantics** unknown (ev: buttons 344 et al. only).
7. **History surface** unknown (ev: tab 307 only).
8. **Higgsfield Presets / Community Trends** card sets unknown (ev: tabs 333/337 only).
9. **Upload flow** (formats, limits, retention, deletion) unknown (ev: 129/132 only).
10. **Billing beyond 1.125** — no per-motion cost, no plan gating captured (ev: 2252
    is the only credit string).
11. **Preset card media** — CDN images not captured (wave-3A renders gradient tiles).
12. **Reference quality baselines** — no reference outputs captured; visual parity is
    judged only through the wave-7 evaluation protocol (IDENTITY_EVALUATION.md).
13. **Downstream integrations** (Genjutsu / Cinema Studio hand-off) — published-spec
    only, unobserved.

Nothing in this register may be silently "resolved" by invention: wave-7 resolutions
are always tagged `spec:` (clone-side curated) or left open in OPEN_QUESTIONS.md.
