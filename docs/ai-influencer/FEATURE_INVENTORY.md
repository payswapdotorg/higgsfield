# Feature inventory — functional parity matrix

Mission §1.1 matrix, extended with three status columns: the **reference-evidence basis**
(citation or published-spec/spec tag), **clone status before wave 7** (wave-3A shell,
Phase-0 audit Task 77-78), and the **wave-7 target**. Parity dimensions per mission §1.2
(interface / functional / visual / production) are measured separately — see
ACCEPTANCE_CRITERIA.md.

| # | Capability | Required behavior | Reference-evidence basis | Clone before wave 7 | Wave-7 target |
|---|---|---|---|---|---|
| 1 | Character creation | Generate a distinctive virtual influencer from structured settings | ev: 19 settings headings 134–289; ev: 2104 Character-type options 142–166; published-spec: portrait+full-body outputs | Builder renders 19 settings; only Character type selectable; Generate **disabled** (no job, no API) | Character persisted via `POST /api/characters` (spec JSON); generate burns 1.125 credits (ev: 2252) creating portrait + full-body jobs |
| 2 | Fine-grained customization | Configure appearance, face, body, hair, accessories | ev: headings 169–289 (18 controls); option sets **uncaptured** | 18 selects locked to "Any" (honest shell) | 18 curated option lists (`spec:`, 4–10 options each, "Any" = unset default) persisted in the character spec |
| 3 | Randomization | Valid, interesting combination of settings | ev: button 295 "Randomize" | Randomizes Character type only (deterministic fnv1a) | Randomizes all 19 settings from the provenance-tagged option library |
| 4 | Optional identity reference | Use an authorized uploaded face as an identity anchor | ev: 129 "Optional" + 132 "Upload your photo"; flow uncaptured | Upload button disabled with disclosed note | `PATCH /api/characters/[id]` accepts `reference_image` (data-URI); passed to the image provider as identity conditioning |
| 5 | Portrait generation | Convincing close-up | published-spec: (blog); ev: Generate 297 | Missing | `influencer_portrait` job via image provider (openrouter / zai / mock) |
| 6 | Full-body generation | Same character, full-body composition | published-spec: (blog) | Missing | `influencer_fullbody` job, same spec + reference |
| 7 | Identity consistency | Preserve recognizable facial/physical characteristics across assets | published-spec: (mission §1.1); measurement protocol = IDENTITY_EVALUATION.md | Missing | Reference-image conditioning (OpenRouter multimodal messages / zai images.generations.edit); quantitative scoring **deferred** (documented) |
| 8 | Reproducibility | Save settings + references to recreate/revise | published-spec: "revisit the character's parameters, regenerate" | Missing (client state only, lost on reload) | Character record persists spec + reference image; regenerate reuses stored spec |
| 9 | Character library | Save, inspect, select, reuse characters | ev: preset cards 341–395 with "View character sheet" (343 et al.) / "Recreate" (344 et al.); published-spec: reuse | Preset tiles are gradient placeholders; sheet/recreate disabled | `GET /api/characters` (mine) + per-character detail with jobs; recreate = load spec into builder (`spec:` semantics) |
| 10 | Image refinement | Change clothing/setting/pose without unnecessary identity drift | published-spec: (mission §1.1) | Missing | Wave 7 scope: regenerate with edited spec + same reference (full editing-route evaluation deferred — see KNOWN_LIMITATIONS.md) |
| 11 | Motion transfer | Animate character using a motion reference | ev: hero 326 "Choose a motion preset and watch them perform it in a video ready to share"; ev: Motion tab 126; preset list **uncaptured** | Missing entirely | `POST /api/characters/[id]/motion` → `wan2.2-i2v-flash` i2v with curated preset-prompt library (`spec:`); measured 43 s real MP4 (Task 77-78) |
| 12 | Object replacement | Replace an element in a video preserving unrelated content | published-spec: (mission §1.1); reference implementation route unknown | Missing | **BLOCKED** — DashScope gateway lacks wanx2.1-vace / wan2.2-animate (Task 77-78 probe); disclosed as unavailable |
| 13 | Export | Download usable images and videos | published-spec: (blog) | Missing | Asset URLs served from job results (OSS URL 24 h expiry caveat — KNOWN_LIMITATIONS.md) |
| 14 | History | Retrieve previous generations + configurations | ev: History tab 307; surface uncaptured | Empty-scope stub | `GET /api/characters/[id]` → character + its jobs; studio History tab lists them |
| 15 | Integration | Pass characters to other creative workflows | published-spec: Genjutsu / Cinema Studio | Missing | Out of wave-7 scope (downstream surfaces are separate deferred groups); documented |

## Status summary

- **Capabilities 1–11, 13–14**: wave-7 build scope (functional parity, engines measured live).
- **Capability 12 (object replacement)**: blocked at the provider level — the only
  credible hosted route (`wanx2.1-vace` / `wan2.2-animate`) does not exist on the
  DashScope intl gateway (Task 77-78), and self-hosted VACE is out of deployment scope.
  Disclosed, not faked.
- **Capability 15 (integration)**: deferred with the studio-backlog groups (route-parity
  report).
- **Visual parity** (realism/identity quality vs the reference): measured only via the
  wave-7 evaluation protocol (human station review); automated identity metrics deferred —
  see IDENTITY_EVALUATION.md and KNOWN_LIMITATIONS.md.
