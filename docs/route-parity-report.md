# Route-parity exit gate report — wave-3 final (HF-W3C C6)

Run date: **2026-10-17** · Gate: `scripts/route-parity.mjs` (zero-dep, bun/node)
· Branch: `hf/wave-3c-platform` · Result: **exit 0**

The wave-3 final exit gate ordered by `docs/HF-PROGRAM/HF-WAVE3-PACKET.md`
(sub-order 3C): walk `src/app` for App-Router pages, flatten the live
`evidence/rea-2026-10-17/route-preload-manifest.json` route tree, diff against
the curated wave 1–3 scope, and print implemented / missing / extra / deferred.
This report is the formatted record of the final (post-gap-fix) run; the raw
stdout is reproducible with `bun scripts/route-parity.mjs`.

## Summary

| Measure | Count |
|---|---|
| App pages walked (`src/app/**/page.tsx`, api subtree excluded) | **32** |
| Live manifest keys → normalized live routes | 364 → **330** |
| Curated in-scope entries | **40** (17 carry alias/disclosure notes) |
| IMPLEMENTED (matched pairs) | **40** |
| MISSING (in curated scope, no app route) | **0** — after the C6 gap fix |
| EXTRA (app pages with no curated counterpart) | **0** |
| DEFERRED (out of wave 1–3 scope) | **291** routes in 16 groups |
| Curation errors / ungrouped routes | 0 / 0 |

**Gate history:** first run (before the fix) found exactly one MISSING entry —
`/contests/:contestSlug/submissions → /contests/:slug/submissions` (the packet's
3C order says "with submissions route shell"; worker 58's detail page carried
the disclosure in-page but the route did not exist). Fixed by
`src/app/contests/[slug]/submissions/page.tsx` (routed shell, visible
uncaptured-gallery disclosure, `notFound()` for unknown slugs) plus enabling the
detail page's 'View submissions' affordance (ev: inspect-contests.json 6918) to
link to it. Re-run: exit 0.

## Normalization conventions (how live keys map to URLs)

The manifest keys are the live TanStack route tree, not URLs. The gate
normalizes them as follows (each rule is applied in `normalizeLiveKey`):

- **Group parens** — `(public)`, `(explore)`, `(home)`, `(mobile)`,
  `(action-redirects)`, `(redirects)`, `(static)`, `(team-actions)` → stripped
  (pathless layout groups, contribute nothing to the URL).
- **Leading `_` segments** — `_private`, `_tabs`, `_catalog`, `_template`,
  `_team` → stripped (pathless layouts). E.g. `/_private/ads-studio` →
  `/ads-studio`; `/(public)/community/_tabs/contests` → `/community/contests`.
- **Trailing `_` quirk** — `mcp_`, `effects_`, `use_`, `blogs_`, `ai-host_`,
  `payment_`, `supercomputer_` … → the segment is kept with the underscore
  dropped: `/(public)/mcp_/$slug` → `/mcp/:slug` (the interpretation the
  wave-3C implementation established and the station verified).
- **Params** — `$x` → `:x`; a bare `$` → `*` (unnamed catch-all).
- **Trailing slashes** — dropped (except root); duplicate keys
  (`/x` + `/x/`) collapse onto one normalized route (364 → 330).

App-side conventions: `[x]` → `:x`, `[...x]` → `*`, `(group)` route-group
directories stripped, `src/app/api/**` (route handlers) excluded, non-page
files ignored.

## IMPLEMENTED — the curated wave 1–3 scope (40 matched pairs)

Legend: *keys* = number of manifest keys that collapse onto the live path;
entries with a note are ALIAS pairs (disclosed clone-side convention, live
path ≠ app path).

### Home / studio / generate tree (waves 1–2)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/` (`/(public)/(explore)/(home)/`) | `/` | 2 | The clone serves the Cinema Studio composer at `/` (wave-1 architecture) |
| `/generate` (`/_private/generate`) | `/` | 2 | Live `/generate` is the `$mode` router into the per-model studio; the clone's studio surface is the Cinema Studio at `/` (wave-1 flattening, disclosed) |
| `/generate/all` | `/generate/all` | 1 | — |
| `/generate/:mode/:modelVersion/folders/:folderId` | `/generate/folder/:folderId` | 1 | Clone flattens the live `$mode/$modelVersion` segments (single-pipeline clone, disclosed) |
| `/generate/:mode/:modelVersion/trash` | `/generate/trash` | 1 | Same flattening as the folders route |

### Community (wave 2 + 3C projects tab) — live tab routes are query params

| Live route | App route | keys | Note |
|---|---|---|---|
| `/community` (`/(public)/community/_tabs`) | `/community` | 2 | — |
| `/community/generations` | `/community` | 1 | → `/community?tab=generations` (query-param tabs, wave-2 convention) |
| `/community/contests` | `/community` | 1 | → `/community?tab=contests` |
| `/community/creators` | `/community` | 1 | → `/community?tab=creators` |
| `/community/creators-2` | `/community` | 1 | Live second creators page → the clone serves a single creators tab |
| `/community/originals` | `/community` | 1 | → `/community?tab=originals` (evidence-based stub — originals content uncaptured, 3B disclosure) |
| `/community/projects` | `/community` | 1 | → `/community?tab=projects` (OPEN PROJECTS static evidence view, HF-W3C C5) |

### Pricing / explore (waves 1, 3A)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/pricing` | `/pricing` | 1 | — |
| `/explore` (`/_private/explore`) | `/explore` | 1 | Live `/_private/explore` is the in-app private surface; the clone page is public (3A disclosed choice) |

### Ads-studio family (wave 3A)

| Live route | App route | keys |
|---|---|---|
| `/ads-studio` | `/ads-studio` | 2 |
| `/ads-studio/all` | `/ads-studio/all` | 1 |
| `/ads-studio/ad-multiplier` | `/ads-studio/ad-multiplier` | 1 |
| `/ads-studio/b/:brandId` | `/ads-studio/b/:brandId` | 1 |
| `/ads-studio/brand-research/:brandId` | `/ads-studio/brand-research/:brandId` | 1 |

### Marketing / influencer studios (wave 3A)

| Live route | App route | keys |
|---|---|---|
| `/marketing-studio` | `/marketing-studio` | 2 |
| `/ai-influencer-studio` | `/ai-influencer-studio` | 1 |

### Effects (wave 3B)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/effects` | `/effects` | 1 | — |
| `/collection/effects` | `/effects` | 1 | Live `/collection/effects` grid folded into the clone `/effects` catalog (3B convention) |
| `/effects/use/:slug` (`effects_/use_/$slug`) | `/effects/:slug` | 1 | Live use-the-effect path flattened to `/effects/:slug` (3B "grid + detail slugs" convention — interpretive alias, disclosed) |

### Canvas family (wave 3B)

| Live route | App route | keys |
|---|---|---|
| `/canvas` | `/canvas` | 1 |
| `/canvas/:id` | `/canvas/:id` | 2 |
| `/canvas/:id/embed` | `/canvas/:id/embed` | 1 |
| `/canvas/templates/:templateId` | `/canvas/templates/:templateId` | 1 |

### Edit family (wave 3B)

| Live route | App route | keys |
|---|---|---|
| `/edit` | `/edit` | 1 |
| `/edit/:projectId` | `/edit/:projectId` | 1 |
| `/edit/avatar/:category` | `/edit/avatar/:category` | 1 |
| `/edit/canvas/:imageId` | `/edit/canvas/:imageId` | 2 |

### Audio / assets (wave 3B)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/audio` | `/audio` | 1 | — |
| `/asset` (`/_private/asset`) | `/assets` | 1 | Live singular → clone plural `/assets` (3B convention) |

### Platform pages (wave 3C)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/api` | `/api-docs` | off-manifest | **DISCLOSED RENAME** — the live page sits at `/api` (ground truth `surfaces/inspect-api.json`; the route is absent from the preload manifest); `src/app/api` is this build's API route-handler namespace, so the page lives at `/api-docs` |
| `/mcp` | `/mcp` | 1 | — |
| `/mcp/:slug` (`/(public)/mcp_/$slug`) | `/mcp/:slug` | 1 | Live `mcp_/$slug` doc tree → routed placeholder (doc bodies uncaptured, disclosed) |
| `/academy` | `/academy` | 3 | — |

### Contests (wave 3C C4 + C6 gap fix)

| Live route | App route | keys | Note |
|---|---|---|---|
| `/contests/:contestSlug` | `/contests/:slug` | 1 | — |
| `/contests/:contestSlug/submissions` | `/contests/:slug/submissions` | 1 | Packet 3C orders a "submissions route shell" — **the C6 gap**: implemented as a routed shell with a visible uncaptured-gallery disclosure |

## Alias / disclosure notes (the full list)

1. **`/api` → `/api-docs` (rename).** The live Open Platform page sits at
   `/api`; this Next.js build reserves `src/app/api/` for API route handlers
   (auth/jobs/folders/…), so the page lives at `/api-docs` and the nav labels
   it "API". Disclosed in `src/app/api-docs/page.tsx` and the app-shell nav
   comment.
2. **`/_private/asset` → `/assets` (plural).** 3B naming convention.
3. **Generate-tree flattening.** Live `/generate` + `/generate/$mode/$modelVersion`
   (the per-model studio addressing) map onto the clone's wave-1 architecture:
   Cinema Studio at `/`, library at `/generate/all`, flat `/generate/folder/:folderId`
   and `/generate/trash`. Per-mode/settings/favorites/usage/elements routes are
   deferred (see below).
4. **Community tabs as query params.** The live `community/_tabs/*` routes
   render as `/community?tab=…` in the clone (wave-2 convention);
   `creators-2` (the live second creators page) has no separate clone route.
5. **Effects slugs.** The clone's `/effects/:slug` detail convention (from the
   3B order: "grid + detail slugs") is paired with the live
   `effects_/use_/$slug` use-the-effect path; `/collection/effects` folds into
   `/effects`. Interpretive aliases, disclosed.
6. **`/explore` visibility.** Live `/_private/explore` is the in-app private
   surface; the clone page is public (3A disclosed choice — it doubles as the
   model-catalog surface).
7. **`/mcp/:slug`.** Routed placeholder — the `mcp_/$slug` doc bodies were
   never captured; the page renders the slug verbatim plus a demo-scope note.
8. **`/contests/:slug/submissions`.** Routed shell with the
   uncaptured-gallery disclosure; the submission-detail permalink
   (`…/submissions/$submissionId`) is deferred.

## DEFERRED — live routes out of wave 1–3 scope (291 routes, 16 groups)

Grouped with one-line reasons; members listed exhaustively (nothing is hidden —
the gate reports UNGROUPED routes as errors, and there are none).

### auth-provider (19)
Auth provider surface (email/sso/oauth/token/verify flows) out of clone scope —
the clone implements its own session API (`src/app/api/auth/*`).

`/auth` · `/auth/email/sign-in` · `/auth/email/sign-up` · `/auth/email/verify`
· `/auth/forgot-password` · `/auth/login` · `/auth/logout` · `/auth/sign-in`
· `/auth/sign-up` · `/auth/sso` · `/auth/sso-callback` · `/discord-verify`
· `/discord-verify/callback` · `/email-verification` · `/oauth`
· `/oauth/consent` · `/oauth/consent/mock-checkout` · `/sign-in`

(the verify-email flow `/verify/:serial` lands in the uncaptured-detail group
below — first-match-wins ordering)

### supercomputer (42)
The Supercomputer agent platform (chats, marketplace, apps, employees, skills,
gaming, memory, connectors) — no surface spec captured; wave 4+ backlog.

`/supercomputer` · `/supercomputer/*` · `/supercomputer/:chatId`
· `/supercomputer/apps` · `/supercomputer/apps/:appId`
· `/supercomputer/apps/:appId/edit` · `/supercomputer/apps/:appId/view`
· `/supercomputer/apps/all` · `/supercomputer/connectors`
· `/supercomputer/create-employees` · `/supercomputer/debug/chat`
· `/supercomputer/embed` · `/supercomputer/employees/:employeeId`
· `/supercomputer/employees/:employeeId/edit`
· `/supercomputer/faceless-channel` · `/supercomputer/files`
· `/supercomputer/games/:gameId` · `/supercomputer/gaming`
· `/supercomputer/gaming/all` · `/supercomputer/incognito`
· `/supercomputer/marketplace/*` · `/supercomputer/marketplace/apps`
· `/supercomputer/marketplace/apps/:appId`
· `/supercomputer/marketplace/employees`
· `/supercomputer/marketplace/employees/:employeeId`
· `/supercomputer/marketplace/employees/shared/:shareSlug`
· `/supercomputer/marketplace/employees/shorts-maker`
· `/supercomputer/marketplace/published`
· `/supercomputer/marketplace/skills/:skillId`
· `/supercomputer/marketplace/skills/higgsfield-explainer`
· `/supercomputer/memory` · `/supercomputer/new` · `/supercomputer/plugin`
· `/supercomputer/plugin/connected` · `/supercomputer/pricing`
· `/supercomputer/projects` · `/supercomputer/projects/:projectId`
· `/supercomputer/shared/:code` · `/supercomputer/skills`
· `/supercomputer/skills/:skillId` · `/supercomputer/websites`
· `/debug/supercomputer/:folderId`

### flow-tree (29)
Legacy/alternate generation flows (avatar presets, fashion, photodump, speech,
draw, mixed-media, shorts) — the wave-2 single-pipeline architecture (Cinema
Studio + jobs API) is the clone's only generation path by design.

`/flow` · `/flow/avatar/:view/:category` · `/flow/avatar/history`
· `/flow/avatar/preset` · `/flow/avatar/preset/infinite-talk`
· `/flow/avatar/preset/kling` · `/flow/avatar/preset/kling-lipsync`
· `/flow/avatar/preset/sync-so` · `/flow/avatar/preset/v2`
· `/flow/avatar/preset/wan` · `/flow/avatar/prompt`
· `/flow/avatar/prompt/audio` · `/flow/draw` · `/flow/fashion`
· `/flow/fashion/character` · `/flow/fashion/clothing`
· `/flow/fashion/generation` · `/flow/fashion/photoset` · `/flow/image`
· `/flow/image/avatar/:category` · `/flow/image/character`
· `/flow/mixed-media` · `/flow/photodump` · `/flow/photodump/character`
· `/flow/photodump/generation` · `/flow/photodump/template`
· `/flow/shorts-studio` · `/flow/speech` · `/flow/speech/prompt`

### settings-account (14)
Account/billing/team settings surface uncaptured (inspect-settings.json is a
404 capture); wave 4+.

`/me/settings` · `/me/settings/billing` · `/me/settings/cancel`
· `/me/settings/gift` · `/me/settings/members` · `/me/settings/onboarding`
· `/me/settings/organization` · `/me/settings/promo`
· `/me/settings/referrals` · `/me/settings/sessions`
· `/me/settings/sub-workspaces` · `/me/settings/subscription`
· `/me/settings/unlimited-access-history` · `/me/settings/usage`

### profile-pages (8)
Per-creator public profile pages (blogs, rankings, projects, achievements)
uncaptured — the community creators tab carries the clone's creator surface.

`/profile/:username` · `/profile/:username/achievements`
· `/profile/:username/blogs` · `/profile/:username/blogs/:slug`
· `/profile/:username/generations` · `/profile/:username/projects`
· `/profile/:username/projects/:projectSlug` · `/profile/:username/ranking`

### academy-children (7)
Academy course catalog/player/certificate/saved surfaces uncaptured — wave-3C
scope was the academy landing (per the packet).

`/academy/apps/:app` · `/academy/courses` · `/academy/courses/:course`
· `/academy/courses/:course/:lesson` · `/academy/courses/:course/certificate`
· `/academy/faq` · `/academy/saved`

### mobile-shell (8)
Mobile app shell routes out of scope (responsive web clone).

`/apps/skin-enhancer/mobile` · `/gallery` · `/mob-explore` · `/mobile/audio`
· `/mobile/video` · `/mobile/video/reframe` · `/photodump/mobile`
· `/upscale/mobile`

### per-model-community (21)
Per-model community hubs, preset galleries and curated collections uncaptured —
the community feed + `/explore` catalog carry the clone's discovery surface
(wave 4+).

`/:slug` (`/(public)/(explore)/$slug`) · `/gpt-image-2-community`
· `/higgsfield-genjutsu-presets` · `/kling-30-community`
· `/marketing-studio-community` · `/mixed-media-community`
· `/mixed-media-community/:publicationId`
· `/mixed-media-presets/preset/:presetId`
· `/mixed-media-presets/publication/:publicationId`
· `/nano-banana-pro-preview` · `/nano-banana-pro-preview/:publicationId`
· `/seedance-2-5-community` · `/seedance-2-community`
· `/seedance-4k-community` · `/soul` · `/soul-cinema-community`
· `/soul-community` · `/soul/:styleId` · `/soul/job/:jobId` · `/wan-video`
· `/wan-video/:publicationId`

### billing-checkout (24)
Payment/billing/checkout provider surface out of scope — the clone's `/pricing`
is informational (PRICING_CONFIG); no payment flows are cloned.

`/accept-invitation` · `/accept-invitation/logout` · `/activate/access`
· `/business-domain-verification` · `/checkout-first/<9 GUID routes>`
· `/checkout-first/return` · `/enter-team` · `/gift` · `/payment`
· `/payment/free-trial` · `/pricing/checkout/:plan` · `/pricing/dev`
· `/reactivate` · `/renew` · `/special-offer` · `/verify-card`

### onboarding-start (11)
Onboarding/start flows (per-tool start pages, quizzes) uncaptured — out of
clone scope.

`/onboarding` · `/quiz` · `/remote-quiz/:quizId` · `/start` · `/start/agent`
· `/start/edit-image` · `/start/genjutsu` · `/start/imagine` · `/start/katana`
· `/start/katana/:slug` · `/welcome-quiz`

### redirect-probe-debug (14)
Internal action-redirects, A/B probes, debug playgrounds and gate pages — not
product surfaces (the mcp-credits/mcp-pricing redirects are disclosed in
`src/app/mcp/page.tsx`).

`/blocked` · `/debug/card-playground` · `/debug/library-feed-states`
· `/debug/seedance-2-5-modals` · `/debug/sso-domains-field` · `/debug/upsell`
· `/device` · `/explainer` · `/mcp-credits` · `/mcp-credits/:id`
· `/mcp-pricing` · `/mcp-pricing/:id` · `/touring-banner-probe`
· `/touring-results-probe`

### studio-backlog (47)
Studio/tool surfaces beyond the wave 1–3 packet scopes (uncaptured specs) —
wave 4+ backlog.

`/3d-jutsu` · `/3d-jutsu/:projectId` · `/ai-host` · `/ai-host/channel/:channelId`
· `/ai-host/channels` · `/ai-host/new` · `/ai/image` · `/ai/video` · `/apps`
· `/apps/:slug` · `/apps/:slug/view` · `/apps/link-to-video-ad` · `/apps/shots`
· `/apps/skin-enhancer` · `/apps/skin-enhancer/desktop` · `/apps/whats-next`
· `/apps/zooms` · `/character` · `/character-sheet` · `/character/kion`
· `/character/upload` · `/character/upload/:characterId`
· `/enterprise-studio` · `/faceless-studio`
· `/faceless-studio/channel/:channelId` · `/faceless-studio/channels`
· `/faceless-studio/new` · `/katana` · `/layers` · `/layers/:projectId`
· `/layers/:projectId/:versionId` · `/lipsync-studio`
· `/lipsync-studio/avatar/select`
· `/lipsync-studio/avatar/select/horizontal/:category`
· `/lipsync-studio/avatar/select/vertical/:category`
· `/lipsync-studio/select-template` · `/mixed-media` · `/moodboard`
· `/moodboard/upload` · `/popcorn` · `/seedance-4k` · `/shorts-studio`
· `/sora-trends` · `/upscale` · `/upscale/desktop` · `/video-edit`
· `/video-editor`

### generate-extras (8)
Live generate-tree extras (per-`$mode` addressing, settings, favorites, usage,
elements, pricing modal, trash-item detail) — flattened away by the clone's
wave-1 architecture (studio at `/`, library at `/generate/all`, flat
folder/trash routes); not separately implemented.

`/generate/:mode` · `/generate/:mode/:modelVersion`
· `/generate/:mode/:modelVersion/settings`
· `/generate/:mode/:modelVersion/trash/*` · `/generate/elements`
· `/generate/favorites` · `/generate/pricing` · `/generate/usage`

### marketing-static (12)
Static marketing/legal/editorial/localization pages (and the duplicate live
`/home` entry route) out of clone scope.

`/about` · `/contact` · `/cookie-notice` · `/home` · `/image-translations`
· `/locales/:locale` · `/newsletter` · `/original-series`
· `/original-series/:serialSlug/:episodeSlug` · `/quanta-demo` · `/trust`
· `/viral-effects`

### module-extras (17)
Sub-surface routes of in-scope modules whose bodies were never captured:
contest submission permalinks + literal slugs (adathon/apps — the clone's
`/contests/[slug]` dynamic route serves the shape; those two slugs are not
seeded), community post permalinks, mcp bundles, effects examples/tests/
use-index, the edit job-set editor, marketing-studio subpages — wave 4+
backlog.

`/community/posts` · `/community/posts/:publicationId`
· `/contests/:contestSlug/submissions/:submissionId` · `/contests/adathon`
· `/contests/apps` · `/edit/canvas/:imageId/:jobSetId`
· `/effects/:invalidSegment/*` · `/effects/examples/:presetSlug`
· `/effects/examples/:presetSlug/:sampleId` · `/effects/tests`
· `/effects/tests/effects` · `/effects/use` · `/marketing-studio/favorites`
· `/marketing-studio/generations` · `/marketing-studio/preset/:slug`
· `/marketing-studio/projects` · `/mcp/bundles/:id`

### uncaptured-detail (10)
Remaining detail/sub-surface routes never captured in the 2026-10-17 survey
(publication/post/share/motion permalinks, `/p/:id`, `/share/folder`,
`/verify/:serial`, the live brand-research index that 3A linked past, the
catch-the-pulse collection) — wave 4+ backlog; every member is listed.

`/ads-studio/brand-research` · `/collection/catch-the-pulse`
· `/motion/:motionId` · `/motion/:motionId/:sampleId` · `/p/:id`
· `/post/:postId` · `/publications/:publicationId` · `/share/:id`
· `/share/folder` · `/verify/:serial`

## Verification (post-fix, this run)

- `bun scripts/route-parity.mjs` → **exit 0** (MISSING 0 · EXTRA 0 ·
  curation errors 0 · ungrouped 0)
- `bun run lint` → 0 · `bunx tsc --noEmit` → 0
- New route curls: `/contests/higgsfield-global-film-festival/submissions`,
  `/contests/higgsfield-seedance-2-contest/submissions`,
  `/contests/make-your-action-scene/submissions` → 200 (SSR carries
  "Submissions", "N projects submitted", the demo-scope disclosure, and the
  real `submissions_count` — 8,752 for make-your-action-scene);
  `/contests/unknown-xyz/submissions` → 404 (`notFound()`)
- 22-route regression sweep (all wave-3 surfaces + `/`, `/community`,
  `/generate/*`) → all 200; test battery on a clean :3111 server:
  **20 pass / 0 fail / 121 expects**
