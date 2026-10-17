# Wave-5 worker worklog — account settings + public profiles (HF-W5)

Branch `hf/wave-5-settings` · delivered 2026-10-17 · **wave-5 worker** (9 commits,
`dcabf85` → `aac6363`) + **this records worker** (Task 68 — reconstruction of the
delivery record + the README commit). The prior worker's session was cut by its
deadline *after* the last code commit (`aac6363`) but *before* the records phase:
the README wave-5 edit sat uncommitted in the working tree and this worklog had not
been written. Nothing was lost — the code, the commit messages and the in-code
evidence citations carry the whole story; this record reconstructs it, and every
claim below was re-verified against the committed code in this session (Task 67's
station verification record is cited verbatim in its own section).

Scope per the Task-66 dispatch: the two evidence-feasible families out of the
291-route deferred backlog — **settings-account (14 routes)** + **profile-pages
(8 routes)** — built evidence-anchored (verbatim captured bodies) with disclosed
clone-side layouts and honest shells where payloads were never captured. The
remaining ~269 uncaptured routes stay deferred (supercomputer + studio-backlog
groups are NOT buildable without new REA captures).

Evidence anchors (verified in this session):

- `evidence/rea-2026-10-17/api-bodies-digest.json` — top-level keys:
  `jobs-accessible, profile, wallet, touring, pricing-config, notices, features,
  promo, contests, settings, user, user-meta`. Wave-5 consumed
  **settings / profile / user / wallet / pricing-config**.
- `evidence/rea-2026-10-17/route-preload-manifest.json` — 364 keys → 330
  normalized routes. Wave-5 consumed the `/_private/me/settings{,/,/_team}` +
  13-children subtree (16 keys) and the `/_private/profile/$username{,/}` +
  7-children subtree (9 keys, incl. the `blogs_/$slug` trailing-_ key).
- `evidence/rea-2026-10-17/net-capture-with-auth-headers.jsonl` —
  `/fnf/user/settings`, `/fnf/user/profile` (also `/workspaces/settings`,
  `/datetime-settings`, `/banner/settings`) are **GET 200 with reqBody null on
  every captured row** ⇒ read-only surfaces, zero mutation contracts to invent.

## C1 — schema (commit dcabf85)

- `prisma/schema.prisma`: **User gains the captured `/fnf/user/profile` field set**
  (digest → `profile`): `avatarUrl, backgroundImageUrl, bio, headline`, the six
  social-handle columns, `showFullName` (default false), `fullName`, `location`,
  `badge` (singular, captured null), `badges` (JSON string, default `"[]"` — SQLite
  has no list columns), `totalProjectsViews`, `totalProjectsLikes`. Field names map
  1:1 onto the captured snake_case keys; values for un-seeded users stay
  null/0/false exactly like the captured fresh account.
- **New `UserSettings` model** — the `/fnf/user/settings` consent body verbatim key
  set (digest → `settings`, the 12 keys): `mediaConsent/mediaConsentedAt`,
  `audioConsent` (nullable — **tri-state** in the capture, null = never asked) +
  stamp, `unlimitedSettings` (JSON string, captured null), `hasImageAuto`
  (default true — a state flag, not a consent), `characterSheetsConsent` + stamp,
  `aiInfluencerConsent` + stamp, `supercomputerLlmConsent` + stamp. Both model
  doc-comments cite the digest entry and the GET-only net-capture fact.
- `db:push` applied idempotently with `DATABASE_URL=file:../db/hf.db` pinning
  (wave-4 DISCLOSURE 1 discipline — the ambient-env hijack).

## C2 — seed (commit c1bddaf)

- `demo_creator` gains a captured-style profile (bio/headline are clone-side demo
  values; the remaining fields null — mirroring the captured fresh-account nulls)
  and a `UserSettings` row carrying the captured settings-body values **verbatim**
  (every consent false/null, `unlimited_settings` null, `has_image_auto` true).
- **Captured-operator fixture**: user `radiatingcapybara1609`
  (`full_name` "yaslen Catty", `show_full_name` false, the cloudfront webp
  `avatar_url`, badges [], totals 0 — username/full_name/show_full_name/avatar_url
  verbatim from digest → `profile`). Clearly marked **FIXTURE** in a block comment:
  `.local` placeholder email, not a live account; exists so `/profile/[username]`
  renders the exact captured shape.
- Seed counts gain `settings`; `db:seed` run twice → identical counts (idempotent).
  Final counts (station-verified): 10 users, 1 settings row, 15 gens, 12 pubs,
  3 contests.

## C3 — API (commit bbec81d)

- `GET /api/user/settings` — the 12-key consent body verbatim; guest 401; the
  consent row is created with captured defaults on first read. **GET-only** (no
  mutation handler — reqBody null in every captured row).
- `GET /api/user/profile` — own 21-key profile body verbatim.
- `GET /api/profile/[username]` — same shape for any seeded user; unknown → 404.
- `src/lib/account-bodies.ts` (new) — the `/fnf/user` + `/fnf/wallet` bodies
  extracted to a shared server-side lib (single source of truth between the API
  routes and the settings pages). `/api/user` extended with the captured
  **subscription-state keys** (`billing_period, is_cancel_inited, plan_ends_at,
  next_credit_allocation_at, cohort, promo_state, has_unlim, auto_publish, lang,
  is_gift_subscription, pause_* fields, workspace_* fields`) carrying the
  **captured free-plan values verbatim** (billing_period null, promo_state
  "inactive", cohort "tier_1", workspace private/owner) — the surveyed operator
  was on the free plan; paid-plan states are never invented. The unused
  placeholder `billing:{}` key was dropped.
- `src/lib/profile-shape.ts` / `settings-shape.ts` — the verbatim snake_case body
  builders (+ `getOrCreateUserSettings`); `src/lib/pricing-plans.ts` — the captured
  **pricing-config v45.0.0** free+pro tree (the digest string truncates at 20,000
  characters — exactly the `free` and `pro` plan objects are brace-complete; see
  DISCLOSURE 10); `src/lib/page-auth.ts` — `pageUser()`, the server-component
  session read (cookie via `next/headers`) the SSR pages need.
- curl receipts recorded in the commit message: guest 401 ×2, authed
  settings/profile verbatim, public profile 200 + unknown 404.

## C4 — /me/settings surface (commit 4c7d72e, 14 routes, server-rendered)

- `layout.tsx` + `src/components/settings/settings-nav.tsx` — sidebar/tab rail
  listing the 13 manifest children (route list verbatim from
  `/_private/me/settings{,/_team/…}`; the pathless `_team` layout is flattened to
  `/me/settings/*`). **The layout itself is a DISCLOSED clone-side choice** —
  `surfaces/inspect-settings.json` is a policy-filtered shell (completeness.status
  `policy_filtered`; the settings page layout was never captured; README § evidence
  line notes the settings surface is uncaptured).
- `page.tsx` (index): **Profile & personal info** card — the captured
  `/user/profile` body verbatim (avatar, @username, full_name only when
  `show_full_name`, bio/headline/location/6 social handles/badges/totals/joined
  date) — plus **Content & AI consents** card — the five captured switches
  (Media / Audio / Character sheets / AI influencer / Supercomputer LLM consent)
  rendered as **inert** `<Switch disabled>` with a visible "Not captured —
  read-only surface" / "switches are read-only" `DisclosureCard` pair. Every edit
  affordance (Edit profile button etc.) is disabled with the same rationale.
- `subscription`: plan_type + credit pools + the captured subscription-state keys +
  a plan comparison from `src/lib/pricing-plans.ts` (free+pro only; checkout NOT
  cloned — Compare-plans links to the informational `/pricing`).
- `billing`: wallet body verbatim + honest no-invoices empty state · `usage`:
  credit totals + per-model pools + analytics-uncaptured empty state · `promo`:
  promo_state/cohort (captured user-body values) + honest empty state.
- `members / organization / sub-workspaces / unlimited-access-history / gift /
  referrals / cancel / onboarding / sessions`: **honest `UncapturedShell` tabs** —
  visible "uncaptured surface — shell only" disclosure, the real captured
  user-body facts where they exist (workspace_type/role, has_unlim,
  is_cancel_inited, is_gift_subscription), nothing invented.
- All pages server-rendered via `pageUser()`; guests get the `SignInGate` card
  (mirrors SessionGate, ends in `router.refresh()` so the SSR body appears without
  a manual reload). Authed curl sweep 14/14 → 200.

## C5 — /profile/[username] surface (commit c2f014c, 8 routes, server-rendered)

- `page.tsx` (index): public layout from the captured `/user/profile` body verbatim
  (`ProfileHeader` — avatar, @username, **full_name ONLY when show_full_name**
  (captured operator: false, so "Full name hidden" is the faithful render), bio,
  headline, 6 social handles, badges, totals, joined date) + a real
  latest-generations preview (`UserGenerationsGrid`, limit 6). Layout composition
  disclosed as clone-side (profile layout never captured — route-manifest only;
  no `inspect-profile*.json` exists in the survey).
- `generations`: that user's published `FeedPublication`s — the **same community
  read-model** as the feed tab (`FeedPublication ⟕ Generation`), reusing the shared
  community `FeedCard`; honest empty state when none.
- `projects` + `projects/[projectSlug]`: honest shells (aggregate totals real;
  public project payloads uncaptured) · `blogs` + `blogs/[slug]`: honest shells
  (no blog payload/model; `blogs_/$slug` trailing-_ normalization per the wave-3C
  gate convention) · `achievements`: honest shell (captured `badge: null,
  badges: []`) · `ranking`: honest shell (no leaderboard payload captured).
- Unknown username → `notFound()` (404) on every route (incl. `generateMetadata`).
  Curl sweep 8/8 → 200, unknown → 404; SSR greps verified seeded usernames render
  and `full_name` stays suppressed while `show_full_name` false.

## C6 — navigation wiring (commit 9f0feaf)

- `src/components/app-shell.tsx`: the account menu (avatar trigger) gains a
  **Settings → /me/settings** item (comment cites the `/_private/me/settings`
  family; the entry itself is clone-side wiring of the captured route family).
- `src/components/community/creators-tab.tsx`: avatar+name block and a Profile
  ghost button link to `/profile/[username]`; **Follow stays a sibling, never
  nested inside the link** (a11y).

## C7 — route-parity gate (commit db653fc)

- `scripts/route-parity.mjs`: curated scope **+22 entries** (settings-account 14 +
  profile-pages 8) with alias notes (3-key collapse on `/me/settings`
  (settings, settings/, settings/_team), pathless `_team` flattening on 5 children,
  `blogs_/$slug` trailing-_ quirk, 2-key collapse on `/profile/:username`, and the
  honest-shell/layout disclosures per entry); the settings-account + profile-pages
  DEFERRED_GROUPS removed — **16 → 14 groups** (the dispatch predicted 15 — miscount,
  disclosed; see DISCLOSURE 6).
- `docs/route-parity-report.md` rewritten for the wave-5 run: **54 app pages ·
  62 curated entries (31 with notes) · IMPLEMENTED 62 / MISSING 0 / EXTRA 0 /
  DEFERRED 269 in 14 groups** · wave-5 verification receipts + the wave-3 record
  kept for history. Gate exit 0.

## C8 + C9 — battery (commits 869c4da, aac6363)

- `tests/api.test.ts` +4 cases ("HF-W5 settings + profile bodies — verbatim key
  sets"), all **verbatim body-shape assertions** (see DISCLOSURE 9):
  1. `/api/user/settings` — exact **12-key** consent body + captured fresh-account
     values (audio_consent null, has_image_auto true, supercomputer_llm_consent
     false); guest 401 first.
  2. `/api/user/profile` — exact **21-key** profile body; `badges` `[]`,
     `show_full_name` false.
  3. `/api/user` — captured subscription-state keys (billing_period null,
     promo_state "inactive", cohort "tier_1", workspace private/owner).
  4. `/api/profile/[username]` — seeded `demo_creator` 200; captured-operator
     fixture `radiatingcapybara1609` (full_name "yaslen Catty" + show_full_name
     false); unknown → 404.
- Battery grew 19 → **23 api tests** (123 expects; full battery 23 api + 1 e2e +
  4 hardening = **28**). DATABASE_URL pin required — the ambient-env hijack
  reproduced exactly as wave-4 disclosed (unpinned run fails against the wrong db
  file).
- `aac6363`: the 4 cases' emails realigned onto the battery's `hf-w2-test-`
  cleanup prefix (`cleanupTestUsers` deletes by prefix) so no stray users linger
  between runs; strays from the first run were purged (users back to the seeded 10).

## Station verification record (Task 67 — TL station, clean-room)

- **verify.mjs PASS 5/5**: lint 0 · tsc 0 · build 0 (standalone copy ok) ·
  route-parity **IMPLEMENTED 62 / MISSING 0 / EXTRA 0 / DEFERRED 269 in 14
  groups** · battery **28 pass / 0 fail**.
- **All 22 new routes curl 200** on :3111 (`/me/settings` + 13 children,
  `/profile/[username]` + 6 children + `blogs/[slug]`); unknown username → 404.
- **Browser-verified**: settings index renders the 13-child nav + evidence-faithful
  profile card ("Full name hidden (show_full_name: false)") + all **5 consent
  switches as read-only inert** (Media/Audio/Character sheets/AI
  influencer/Supercomputer LLM) + the GET-only disclosure paragraph; Account menu
  carries the Settings item; `/profile/aurora_frames/generations` renders that
  user's 2 published FeedPublication generations; **zero page errors** (only the
  pre-existing benign React list-key dev warning documented in Task 65).
- **db:push + db:seed idempotent** (10 users, 1 settings row, 15 gens, 12 pubs,
  3 contests).
- **OOM note**: the sandbox OOM-killer killed the dev server during a rapid
  22-route compile sweep; the battery's clean relaunch + paced sweep ran green —
  **not a code defect**.

## Records phase (this worker, Task 68)

- Committed the prior worker's uncommitted README wave-5 update (title → waves
  1–4 complete + wave 5, the account-settings/public-profile families table, parity
  **62/0/0 · 269 deferred in 14 groups**, deferred-count 291→269) together with
  this worklog — single docs commit on `hf/wave-5-settings`.
- No source, schema, seed, script or test file was touched by this worker.

## DISCLOSURES

1. **Settings page layout is a clone-side choice** — the live settings page was
   never captured: `surfaces/inspect-settings.json` is a policy-filtered shell
   (completeness.status `policy_filtered`, zero a11y nodes for the settings URL)
   and the README evidence line states the settings surface is uncaptured. The
   sidebar/13-child nav composition follows the wave 1–3 app-shell patterns; the
   **route list** is verbatim from the manifest; only labels/ordering are the
   clone's. Disclosed in `settings-nav.tsx`, the settings layout and every page
   header comment.
2. **All edit affordances are inert** — the capture is GET-only
   (`reqBody: null` on every row for `/fnf/user/profile`, `/fnf/user/settings`,
   `/workspaces/settings`, `/datetime-settings`, `/banner/settings`), so the clone
   ships GET-only handlers and renders the Edit-profile button and all consent
   switches disabled, each with a visible "Not captured — read-only surface"
   `DisclosureCard` explaining the rationale. No save/consent mutation is invented.
3. **Team/billing child tabs are honest empty-state shells** — members,
   organization, sub-workspaces, unlimited-access-history, gift, referrals, cancel,
   onboarding, sessions: the captured operator is a single-owner **free-plan**
   private workspace, and zero bodies for these surfaces were captured. Each ships
   as an `UncapturedShell` with a visible "uncaptured surface — shell only"
   disclosure plus the real captured user-body facts where they exist
   (workspace_type/role, has_unlim, is_cancel_inited, is_gift_subscription).
4. **Profile achievements/blogs/ranking are disclosed shells** — the captured
   profile body carries `badge: null, badges: []` and zero project/blog/leaderboard
   payloads; those tabs (and projects/projects/[projectSlug] detail) render honest
   shells with the manifest key cited, nothing invented.
5. **SIX social handles modeled, not 8** — the captured body carries exactly six
   (instagram/twitter/youtube/tiktok/discord/linkedin); the dispatch text said
   "8 social handles" but **the evidence is the contract** — six is what is
   modeled. Carried by the `prisma/schema.prisma` User doc-comment and asserted by
   the 21-key profile body test.
6. **The parity report discloses the dispatch's 16→14 group miscount** — the
   dispatch predicted "now-15 groups"; the actual arithmetic is 16 − 2 = **14**
   (removing settings-account + profile-pages from the wave-3 sixteen). The gate
   is the source of truth: **269 deferred routes in 14 groups**, exit 0.
7. **`full_name` correctly hidden per `show_full_name: false`** — the captured
   operator body carries both `full_name: "yaslen Catty"` and
   `show_full_name: false`; the API body keeps the key (evidence-faithful) while
   both the settings profile card and the public profile header render "Full name
   hidden (show_full_name: false)" — exactly the live product's behavior. Verified
   by SSR greps (station) and asserted in test 4.
8. **The seed adds the captured-operator fixture user `radiatingcapybara1609`** —
   marked as a **captured fixture** in a block comment (`.local` placeholder email,
   verbatim username/full_name/show_full_name/avatar_url from digest → `profile`),
   so `/profile/[username]` renders the exact captured shape. It is a fixture
   styled after the captured operator account, not a live account.
9. **4 new battery tests are verbatim body-shape assertions** — exact key-set
   `Object.keys(...).sort()` equality (12-key settings body, 21-key profile body)
   plus captured fresh-account values, the captured free-plan subscription-state
   keys, and the fixture/404 path. No mutation endpoints exist to test (GET-only
   capture). The follow-up commit (`aac6363`) realigned the test emails onto the
   `hf-w2-test-` cleanup prefix and purged first-run strays.
10. **pricing-config v45.0.0 truncation** — the digest string cuts off at 20,000
    characters mid-JSON; exactly the `free` and `pro` plan objects are
    brace-complete, so only those two render in the subscription plan comparison
    (the tail hints at a team/seats plan never fully captured — nothing beyond the
    capture is invented). It supplements, not replaces, the wave-1 PRICING_CONFIG
    stub that `/pricing` keeps using.
11. **Clone-side profile-record mapping** — the live product keeps the profile
    record separate from the account; the clone stores the profile fields on the
    User row, so `created_at` and `account_created_at` both map onto
    `user.createdAt` and `updated_at` onto `user.updatedAt` (disclosed in
    `src/lib/profile-shape.ts` and the settings index header).
12. **No push, no merge** — branch `hf/wave-5-settings` left for station
    verification + certified merge (commits `dcabf85` → `c1bddaf` → `bbec81d` →
    `4c7d72e` → `c2f014c` → `9f0feaf` → `db653fc` → `869c4da` → `aac6363` + this
    records/docs commit). This records worker wrote documentation only.
