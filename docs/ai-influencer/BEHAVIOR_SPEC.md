# Behavior spec — Stage-D format

Mission §2.2 Stage-D specs for the nine core scenarios. Fields marked **[ev]** are
evidence-backed (node citation); **[spec]** are clone-side inferences/choices; **[published-spec]**
come from the reference's published description. Every "Unknowns" entry is genuinely
unknown for the reference product — wave 7 resolves them with tagged clone-side choices,
not by silent assumption.

---

## 1. Create character

**Feature:** Persist a new character from structured settings.
**Preconditions:**
- User is signed in (studio is private; StudioGate-wrapped). **[ev]** (surface behind auth in the clone; reference capture was authenticated)
- No generation is required to create the record. **[spec]** — reference persistence semantics uncaptured

**Action:**
- User fills the builder settings and saves. Reference affordance for "save" is uncaptured; the clone exposes `POST /api/characters {name?, spec}`. **[spec]**

**Expected:**
- A character record persists (name, spec JSON). **[spec]** (reference: published-spec: "saved configurations")
- Spec contains the 19 settings; `character_type` validated against the 9 captured options **[ev: 2104/142–166]**; the other 18 validated against curated `spec:` lists.
- No credits are burned, no job created at save time. **[spec]** — the only captured credit string (1.125, ev: 2252) is attached to Generate, implying creation itself is free.

**Unknowns:**
- Whether the reference persists characters per-user server-side at all vs browser-local (uncaptured).

## 2. Randomize

**Feature:** Randomize character settings.
**Preconditions:**
- Builder is open; no generation running. **[spec]**

**Action:**
- User activates Randomize. **[ev: button 295 "Randomize"]**

**Expected (mission §2.2 example, extended):**
- All applicable settings receive valid selections. **[spec]** (reference behavior beyond the button's existence is uncaptured)
- The selected-settings summary updates. **[spec]** (clone-side summary panel)
- The user can change individual selections afterward. **[spec]**
- No generation starts unless explicitly requested. **[spec]**

**Unknowns:**
- Whether the reference uses weighted randomization. (Uncaptured.)
- Whether some setting combinations are excluded (e.g. "Facial hair" × character types). (Uncaptured.)

## 3. Upload reference image

**Feature:** Optional identity-reference upload.
**Preconditions:**
- Builder is open. Upload is labelled Optional. **[ev: 129 "Optional", 132 "Upload your photo"]**

**Action:**
- User activates "Upload your photo", picks a face image, confirms authorization to use it. **[ev: button 132]** — the authorization step is `spec:` (mission §9.5 identity-protection requirement; the reference's actual consent UI is uncaptured; note the captured `ai_influencer_consent` key in the user-settings body, evidence: api-bodies-digest `settings`)

**Expected:**
- The reference image is stored on the character record (clone: data-URI string on the Character row). **[spec]**
- Subsequent generations receive it as identity conditioning. **[spec]**
- Removal possible via PATCH with `reference_image: null`. **[spec]**

**Unknowns:**
- Accepted formats/size limits in the reference. (Uncaptured.)
- Whether the reference transmits the raw image or an asset id (mission §2.2 Stage C question — network boundary uncaptured).

## 4. Generate portrait + full-body

**Feature:** One Generate action produces a close-up portrait and a full-body image of the same character.
**Preconditions:**
- Character settings present (saved or in-builder). **[spec]**
- Sufficient credits: 1.125. **[ev: 2252 "1.125 credits" attached to the Generate action]**
- No duplicate generation in flight for the same character (clone-side duplicate guard). **[spec]**

**Action:**
- User activates Generate. **[ev: button 297 "Generate"]**

**Expected:**
- Two jobs are created and burn a total of 1.125 credits atomically at submit time, split 0.5625 / 0.5625 across `influencer_portrait` + `influencer_fullbody`. **[ev: 2252 for the total] [spec: the split — the reference's internal accounting is uncaptured]**
- The spec is rendered deterministically into a natural-language prompt (clone prompt builder). **[spec]**
- With a reference image present, it conditions identity (OpenRouter multimodal message / zai images.generations.edit). **[spec]**
- Jobs progress queued → processing → done/failed; the UI polls and shows status; results attach to the character. **[spec]** (reference's async contract uncaptured; clone reuses its own Generation pipeline)
- Failure: retryable engine errors retry once (existing worker H2 semantics); non-retryable failures go terminal with the error visible; credits are not re-charged on retry. **[spec]** (existing clone pipeline law)

**Unknowns:**
- Whether the reference generates both images in one request or two. (Uncaptured.)
- Whether the reference bills the pair atomically or per image. (Uncaptured; only the total string exists, ev: 2252.)
- Reference latency/quality baselines. (Uncaptured.)

## 5. Save / reload character

**Feature:** Character settings and references survive navigation/refresh.
**Preconditions:**
- A character record exists. **[spec]**

**Action:**
- User leaves and returns to the studio (refresh / re-navigate).

**Expected:**
- `GET /api/characters` lists the user's characters; `GET /api/characters/[id]` returns the character with its spec, reference image and jobs. **[spec]**
- Reloading a character into the builder restores every setting. **[spec]** (published-spec: "revisit the character's parameters")

**Unknowns:**
- Whether the reference exposes a character library listing UI beyond the preset grid (ev: 341–395 presets are the reference's example of reusable characters; a "my characters" listing is uncaptured).

## 6. Regenerate

**Feature:** Re-run generation for an existing character, reusing its configuration.
**Preconditions:**
- Character exists, ideally with prior results. **[spec]**

**Action:**
- User activates Generate again on a saved character (optionally after editing settings).

**Expected:**
- The stored spec (not stale client state) is used. **[spec]**
- Credits burn again per generation (1.125 total). **[ev: 2252] [spec: re-billing on every generate]**
- New results attach to the character history without destroying old results. **[spec]**

**Unknowns:**
- Whether the reference's regenerate reuses seeds for reproducibility. (Uncaptured; clone stores seed per job — existing Generation column — and documents it.)

## 7. Motion preset → video

**Feature:** Animate a character with a motion preset into a share-ready video.
**Preconditions:**
- Character with at least a full-body/portrait asset to animate. **[spec]**
- Motion presets exist in the reference. **[ev: hero 326 "Choose a motion preset and watch them perform it in a video ready to share"; ev: Motion tab 126]** — the preset **list itself is uncaptured**.

**Action:**
- User selects a motion preset and triggers motion generation. (Reference affordance uncaptured; clone: `POST /api/characters/[id]/motion {preset}`.) **[spec]**

**Expected:**
- One video job (`influencer_motion`, model `wan2.2-i2v-flash`) runs image-to-video: the character asset + the preset's curated motion prompt. **[spec]** — matches the ev: hero copy semantics (preset → performed video)
- Measured engine behavior: real MP4 in ~43 s wall for a 5 s clip; output at an OSS signed URL valid ~24 h. **[measured: Task 77-78]**
- Credits burn per the clone-side motion cost (spec-curated — see API_CONTRACTS.md §motion). **[spec]**

**Unknowns:**
- The reference's motion preset names/count/preview media. (Uncaptured.)
- The reference's motion credit cost. (Uncaptured.)
- Whether the reference's motion route is full-body driving-video transfer (e.g. Wan-Animate-class) vs prompt-driven i2v — its engine is internal and unobservable; the clone route is prompt-prompt i2v because VACE/animate is unavailable on the gateway. **[measured: Task 77-78]**

## 8. Character library

**Feature:** Browse/inspect/reuse characters.
**Preconditions:**
- User has saved characters (clone) or browses the reference's preset gallery.

**Action (reference):**
- Browse preset cards, "View character sheet", "Recreate". **[ev: articles 341–395 ("AI Influencer 38/52/35/50/18/36/41/43/10/47"), buttons 343 et al. "View character sheet" / 344 et al. "Recreate"; preset source tabs 329/333/337]**

**Expected:**
- Clone: the Explore tab lists the user's characters in the card grid shape; character sheet = the character detail (spec + assets + jobs); Recreate = load the spec into the builder. **[spec]** — the reference's sheet/recreate flows themselves are uncaptured.
- Preset sources "Higgsfield Presets" / "Community Trends" render as disclosed scoped states until captured or curated. **[ev: tabs 333/337 exist] [spec: scoped handling]**

**Unknowns:**
- What the reference's character sheet contains (fields, media, lineage). (Uncaptured.)
- Whether "Recreate" seeds the full spec or a subset. (Uncaptured.)

## 9. History

**Feature:** Retrieve previous generations and their configurations.
**Preconditions:**
- Jobs exist for the user. **[ev: History tab 307 exists; the surface itself is uncaptured]**

**Action:**
- User switches to the History page view. **[ev: tablist 303 "Page view", tabs 304 Explore / 307 History]**

**Expected:**
- Clone: the history tab lists the user's influencer jobs (portrait/fullbody/motion) with status and result assets, per-character grouping via `GET /api/characters/[id]` (character + its jobs). **[spec]**

**Unknowns:**
- Whether reference history is global or per-character, paginated, filterable. (Uncaptured.)
