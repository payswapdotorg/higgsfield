# Reference scope — what was captured vs not

Single REA capture of the reference surface, 2026-10-17T08:02:40.991Z (observation window
3000 ms, Chrome/143.0.7499.4):

- Artifact: `evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json`
- Evidence id: `ev_c6df0ff81690880131885c05491849317dbe299412ec496a370c50e8011af57c`
- Target: `https://higgsfield.ai/ai-influencer-studio` (title "AI Influencer | Higgsfield")
- Yield: 813 a11y nodes, 2456 DOM nodes, **0 network requests** (capture attached after
  page load; `network.prior_activity_available: false` — the generation-boundary traffic
  was never observed)

## Captured (observable structure)

| What | Evidence nodes | Notes |
|---|---|---|
| Settings panel region | ev: 116 (complementary "AI Influencer settings") | Left rail |
| Workspace region | ev: 301 (region "AI Influencer workspace") | Right/main area |
| Creation mode tabs | ev: tablist 2078 → tabs 124 "Create Influencer" / 126 "Motion" | Only the Create Influencer panel's content is in the tree; the Motion tab's panel content was **not** captured |
| Upload control | ev: 129 "Optional" StaticText + 132 button "Upload your photo" | Labelled optional; the upload flow itself (file picker → preview → transmission) is uncaptured |
| 19 settings headings | ev: 134–289, heading + collapse-button pairs | Character type 134/135, Gender 169/170, Build 176/177, Hairstyle 183/184, Hair Color 190/191, Style 197/198, Ethnicity 204/205, Age 211/212, Skin color 218/219, Height 225/226, Proportions 232/233, Head shape 239/240, Neck 246/247, Eye shape 253/254, Eye color 260/261, Features 267/268, Facial hair 274/275, Distinctive features 281/282, Accessories 288/289 |
| Character type option set (the ONLY captured option set) | ev: group 2104 → buttons 142 "Average", 145 "Bold", 148 "Extreme", 151 "Insect", 154 "Frog", 157 "Cat", 160 "Dog", 163 "Rodent", 166 "Bird" | 9 options |
| Randomize / Generate | ev: buttons 295 "Randomize" / 297 "Generate" | |
| Credit cost string | ev: generic 2252 "1.125 credits" (with StaticText 300 "1.125", status 2251) | Attached to the Generate action |
| Page view tabs | ev: tablist 303 "Page view" → tabs 304 "Explore" / 307 "History" | |
| Hero | ev: heading 322 "YOUR INFLUENCER, YOUR VIRAL HIT" + paragraph 326 "Build your AI influencer with the face, body, and style you want. Choose a motion preset and watch them perform it in a video ready to share." | The hero copy is the only motion-preset evidence — it confirms motion presets exist and produce share-ready video |
| Preset source tabs | ev: tablist 328 → tabs 329 "AI Influencers" / 333 "Higgsfield Presets" / 337 "Community Trends" | |
| Preset cards (10) | ev: articles 341–395 — "AI Influencer 38/52/35/50/18/36/41/43/10/47", each with an image (342 et al.), button "View character sheet" (343 et al.) and button "Recreate" (344 et al.), inside tabpanel 2297 | Images are CDN assets — not captured |

## Not captured (explicit)

1. **The 18 option sets** other than Character type — they live in closed dropdowns
   (heading + collapse-button only in the a11y tree). Wave 7 ships curated lists tagged
   `spec:` (4-10 options each, "Any" = unset default).
2. **Motion tab panel / motion preset list** — tab 126 exists; no panel content, no
   preset names, no preset count. Wave 7's motion preset library is `spec:`.
3. **Generation API contract** — 0 network requests captured. Request/response shapes,
   sync-vs-async, job polling, error bodies: all unknown for the reference. The clone's
   contracts (API_CONTRACTS.md) are clone-side designs, not recovered reference APIs.
4. **Character sheet modal** ("View character sheet" buttons 343 et al. → flow uncaptured).
5. **Recreate flow** (buttons 344 et al. → uncaptured; presumably re-seeds the builder —
   `published-spec:` "revisit the character's parameters").
6. **History surface** (tab 307 exists; no history UI captured).
7. **Higgsfield Presets / Community Trends card sets** (tabs 333/337 exist; only the
   "AI Influencers" set has cards in the tree).
8. **Upload flow internals** — accepted formats, size limits, preview, retention.
9. **Download affordances** — `published-spec:` says results are downloadable; no
   captured control.
10. **Reference job lifecycle** — states, progress, cancellation: all unknown; the
    clone maps its own lifecycle onto the mission §9.2 model (STATE_TRANSITIONS.md).
11. **Pricing beyond the single "1.125 credits" string** (ev: 2252) — no per-motion cost,
    no plan gating captured.
12. **Downstream integrations** — `published-spec:` claims characters can be passed to
    Genjutsu and Cinema Studio; not observed.

## Published-spec claims (blog description, Oct 3 2026 — not observed in the capture)

Used as requirements baseline per the mission document §1: 19 configurable settings;
close-up **portrait + full-body** outputs; optional identity-reference upload;
randomization; saved configurations / character reuse; regenerate; download; motion
transfer and object replacement as first-class workflows; integration with other
creative workflows. These are tagged `published-spec:` wherever cited.

## Honest bottom line

The capture proves the **interface skeleton** (tabs, 19 settings, 9 Character-type
options, upload/upload-optional, randomize/generate, 1.125 credits, Explore/History,
10 preset cards with character-sheet/recreate actions, and the hero promise of
motion-preset video). It proves nothing about the reference's generation contract,
motion preset contents, option sets beyond Character type, or persistence semantics —
those are clone-side designs under the wave-7 `spec:` doctrine.
