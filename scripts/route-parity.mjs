#!/usr/bin/env node
/**
 * HF-W3C C6 — the route-parity exit gate (wave-3 final).
 * HF-W5 update — curated scope extended with the settings-account + profile-pages
 * families (22 routes); the two deferred groups they occupied are removed.
 *
 * Order: docs/HF-PROGRAM/HF-WAVE3-PACKET.md → Sub-order 3C exit gate —
 * "route-inventory parity script: walk src/app for app-router routes, diff
 * against a curated allowlist derived from route-preload-manifest.json (the
 * /_private + /(public) trees that are in wave 1-3 scope), print
 * implemented/missing/extra, exit 0 when the curated scope is covered."
 *
 * Zero dependencies (node:fs / node:path only) — runnable under bun or node:
 *   bun scripts/route-parity.mjs   (or: node scripts/route-parity.mjs)
 *
 * How it works:
 *   1. APP side  — walks src/app for page.tsx files (the App Router page
 *      inventory). Dynamic segments [x] → :x, [...x] → *, route-group
 *      directories (group) are stripped from the URL, the src/app/api
 *      subtree (route handlers, not pages) is excluded, and non-page files
 *      (layout/error/loading/not-found) are ignored by construction.
 *   2. LIVE side — flattens evidence/rea-2026-10-17/route-preload-manifest.json
 *      (route key → preload asset list) into normalized live URL paths.
 *      Live key conventions normalized here, mirroring the TanStack route-id
 *      tree the manifest encodes:
 *        - group parens  (public) / (explore) / (home) / (mobile) … → stripped
 *          (pathless layout groups, contribute nothing to the URL);
 *        - leading `_`   _private / _tabs / _catalog / _template / _team … →
 *          stripped (pathless layout segments);
 *        - trailing `_`  mcp_ / effects_ / use_ / blogs_ / payment_ … → the
 *          segment is kept with the underscore dropped (`mcp_/$slug` →
 *          `/mcp/:slug` — the interpretation already established by the
 *          wave-3C implementation and verified by the station);
 *        - `$param` → `:param`; a bare `$` → `*`; duplicate trailing-slash
 *          keys collapse onto the same normalized path.
 *   3. CURATED SCOPE — the wave 1–3 in-scope allowlist below (one entry per
 *      live surface, with the app route that must implement it). Entries
 *      whose live path differs from the app path carry an explicit ALIAS
 *      note (disclosed clone-side conventions: /api→/api-docs rename,
 *      /asset→/assets, generate-tree flattening, community query-param tabs,
 *      effects detail slugs, collection fold). One entry is off-manifest
 *      (live /api — ground truth is surfaces/inspect-api.json, which the
 *      preload manifest does not carry) and marked liveAbsent.
 *   4. DEFERRED — the remaining live routes, grouped by pattern with a
 *      one-line reason each (wave 4+ / uncaptured surface / auth provider
 *      surface out of clone scope …). Anything that matches no group is
 *      reported as UNGROUPED so nothing can silently disappear.
 *
 * Exit code: 0 iff the curated scope is fully implemented (MISSING empty)
 * AND the curation itself is sound (no unknown live keys, no ungrouped
 * routes). Otherwise 1.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const APP_DIR = join(ROOT, "src", "app");
const MANIFEST = join(ROOT, "evidence", "rea-2026-10-17", "route-preload-manifest.json");

// ---------------------------------------------------------------------------
// 1. App-router page inventory (src/app walker)
// ---------------------------------------------------------------------------

/** src/app dir segment → URL segment (route groups stripped, [x] → :x). */
function appSegment(seg) {
  if (/^\(.*\)$/.test(seg)) return null; // route group — not in the URL
  if (/^\[\.\.\.(.*)\]$/.test(seg)) return "*"; // catch-all
  const dyn = /^\[(.*)\]$/.exec(seg);
  if (dyn) return `:${dyn[1]}`;
  return seg;
}

function walkApp(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      // The api subtree holds route handlers, not pages — excluded per the order.
      if (dir === APP_DIR && entry === "api") continue;
      walkApp(full, out);
    } else if (entry === "page.tsx") {
      const rel = relative(APP_DIR, dir);
      if (rel === "") {
        out.push("/");
        continue;
      }
      const segs = rel.split(sep).map(appSegment).filter((s) => s !== null);
      out.push("/" + segs.join("/"));
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// 2. Live manifest flattening + normalization
// ---------------------------------------------------------------------------

/** Live manifest route key → normalized live URL path. */
function normalizeLiveKey(key) {
  const segs = key.split("/").filter(Boolean);
  const out = [];
  for (const seg of segs) {
    if (/^\(.*\)$/.test(seg)) continue; // group parens — pathless
    if (seg.startsWith("_")) continue; // leading `_` — pathless layout
    let s = seg;
    if (s.length > 1 && s.endsWith("_")) s = s.slice(0, -1); // mcp_ → mcp quirk
    if (s === "$") s = "*";
    else if (s.startsWith("$")) s = ":" + s.slice(1);
    out.push(s);
  }
  return "/" + out.join("/");
}

// ---------------------------------------------------------------------------
// 3. Curated wave 1–3 in-scope allowlist
//    live: normalized manifest path (must exist — validated) | liveAbsent
//    app:  the app route that implements it (must exist → else MISSING)
//    note: alias / disclosure when the pair is not a literal match
// ---------------------------------------------------------------------------

const CURATED = [
  // --- home / studio / generate tree (waves 1–2) ---
  { live: "/", app: "/", note: "live (public)(explore)(home) group root — the clone serves the Cinema Studio composer at / (wave-1 architecture)" },
  { live: "/generate", app: "/", note: "live /generate is the $mode router into the per-model studio; the clone's studio surface is the Cinema Studio at / (wave-1 flattening, disclosed)" },
  { live: "/generate/all", app: "/generate/all" },
  { live: "/generate/:mode/:modelVersion/folders/:folderId", app: "/generate/folder/:folderId", note: "clone flattens the live $mode/$modelVersion segments (single-pipeline clone, disclosed)" },
  { live: "/generate/:mode/:modelVersion/trash", app: "/generate/trash", note: "same flattening as the folders route" },

  // --- community (wave 2 + 3C projects tab) — live tab routes are query params in the clone ---
  { live: "/community", app: "/community" },
  { live: "/community/generations", app: "/community", note: "live tab route → clone /community?tab=generations (query-param tabs, wave-2 convention)" },
  { live: "/community/contests", app: "/community", note: "→ /community?tab=contests" },
  { live: "/community/creators", app: "/community", note: "→ /community?tab=creators" },
  { live: "/community/creators-2", app: "/community", note: "live second creators page → the clone serves a single creators tab" },
  { live: "/community/originals", app: "/community", note: "→ /community?tab=originals (evidence-based stub — originals content uncaptured, 3B disclosure)" },
  { live: "/community/projects", app: "/community", note: "→ /community?tab=projects (OPEN PROJECTS static evidence view, HF-W3C C5)" },

  // --- pricing (wave 1) ---
  { live: "/pricing", app: "/pricing" },

  // --- explore (wave 3A) ---
  { live: "/explore", app: "/explore", note: "live /_private/explore is the in-app private surface; the clone page is public (3A disclosed choice)" },

  // --- ads-studio family (wave 3A) ---
  { live: "/ads-studio", app: "/ads-studio" },
  { live: "/ads-studio/all", app: "/ads-studio/all" },
  { live: "/ads-studio/ad-multiplier", app: "/ads-studio/ad-multiplier" },
  { live: "/ads-studio/b/:brandId", app: "/ads-studio/b/:brandId" },
  { live: "/ads-studio/brand-research/:brandId", app: "/ads-studio/brand-research/:brandId" },

  // --- marketing / influencer studios (wave 3A) ---
  { live: "/marketing-studio", app: "/marketing-studio" },
  { live: "/ai-influencer-studio", app: "/ai-influencer-studio" },

  // --- effects (wave 3B) ---
  { live: "/effects", app: "/effects" },
  { live: "/collection/effects", app: "/effects", note: "live /collection/effects grid folded into the clone /effects catalog (3B convention)" },
  { live: "/effects/use/:slug", app: "/effects/:slug", note: "live use-the-effect path flattened to /effects/:slug (3B \"grid + detail slugs\" convention — interpretive alias, disclosed)" },

  // --- canvas family (wave 3B) ---
  { live: "/canvas", app: "/canvas" },
  { live: "/canvas/:id", app: "/canvas/:id" },
  { live: "/canvas/:id/embed", app: "/canvas/:id/embed" },
  { live: "/canvas/templates/:templateId", app: "/canvas/templates/:templateId" },

  // --- edit family (wave 3B) ---
  { live: "/edit", app: "/edit" },
  { live: "/edit/:projectId", app: "/edit/:projectId" },
  { live: "/edit/avatar/:category", app: "/edit/avatar/:category" },
  { live: "/edit/canvas/:imageId", app: "/edit/canvas/:imageId" },

  // --- audio / assets (wave 3B) ---
  { live: "/audio", app: "/audio" },
  { live: "/asset", app: "/assets", note: "live singular /_private/asset → clone /assets (plural, 3B convention)" },

  // --- platform pages (wave 3C) ---
  {
    live: "/api",
    app: "/api-docs",
    liveAbsent: true,
    note: "DISCLOSED RENAME: the live page sits at /api (ground truth surfaces/inspect-api.json — absent from the preload manifest); src/app/api is this build's API route-handler namespace, so the page lives at /api-docs",
  },
  { live: "/mcp", app: "/mcp" },
  { live: "/mcp/:slug", app: "/mcp/:slug", note: "live /(public)/mcp_/$slug doc tree → routed placeholder (doc bodies uncaptured, disclosed)" },
  { live: "/academy", app: "/academy" },

  // --- contests (wave 3C C4) ---
  { live: "/contests/:contestSlug", app: "/contests/:slug" },
  { live: "/contests/:contestSlug/submissions", app: "/contests/:slug/submissions", note: "packet 3C orders a \"submissions route shell\" — routed shell with a visible uncaptured-gallery disclosure" },

  // --- settings-account (wave 5 — HF-W5; 14 routes) ---
  // Manifest keys /_private/me/settings{,/,_team} + the 13 children. The child
  // routes billing/members/organization/sub-workspaces/unlimited-access-history
  // live under the pathless _team layout on the live tree (normalized away).
  { live: "/me/settings", app: "/me/settings", note: "3 manifest keys collapse here (settings, settings/, settings/_team); layout is a disclosed clone-side choice — the live settings page was never captured (inspect-settings.json is a policy-filtered shell)" },
  { live: "/me/settings/billing", app: "/me/settings/billing", note: "live key /_private/me/settings/_team/billing (pathless _team layout flattened)" },
  { live: "/me/settings/cancel", app: "/me/settings/cancel" },
  { live: "/me/settings/gift", app: "/me/settings/gift" },
  { live: "/me/settings/members", app: "/me/settings/members", note: "live key /_private/me/settings/_team/members" },
  { live: "/me/settings/onboarding", app: "/me/settings/onboarding" },
  { live: "/me/settings/organization", app: "/me/settings/organization", note: "live key /_private/me/settings/_team/organization" },
  { live: "/me/settings/promo", app: "/me/settings/promo" },
  { live: "/me/settings/referrals", app: "/me/settings/referrals" },
  { live: "/me/settings/sessions", app: "/me/settings/sessions" },
  { live: "/me/settings/sub-workspaces", app: "/me/settings/sub-workspaces", note: "live key /_private/me/settings/_team/sub-workspaces" },
  { live: "/me/settings/subscription", app: "/me/settings/subscription" },
  { live: "/me/settings/unlimited-access-history", app: "/me/settings/unlimited-access-history", note: "live key /_private/me/settings/_team/unlimited-access-history" },
  { live: "/me/settings/usage", app: "/me/settings/usage" },

  // --- profile-pages (wave 5 — HF-W5; 8 routes) ---
  // Manifest keys /_private/profile/$username{,/} + children; blogs_/$slug uses
  // the trailing-_ normalization (blogs → /blogs/:slug, wave-3C convention).
  { live: "/profile/:username", app: "/profile/:username", note: "2 manifest keys collapse here (profile/$username, profile/$username/) — public profile layout from the captured /user/profile body; page layout itself is a disclosed clone-side choice" },
  { live: "/profile/:username/achievements", app: "/profile/:username/achievements", note: "honest shell — no badge/achievement payload captured (profile body: badge null, badges [])" },
  { live: "/profile/:username/blogs", app: "/profile/:username/blogs", note: "honest shell — no blog payload captured" },
  { live: "/profile/:username/blogs/:slug", app: "/profile/:username/blogs/:slug", note: "live key /_private/profile/$username/blogs_/$slug (trailing-_ quirk); honest shell — no blog post captured" },
  { live: "/profile/:username/generations", app: "/profile/:username/generations", note: "renders the user's published FeedPublications (community read-model)" },
  { live: "/profile/:username/projects", app: "/profile/:username/projects", note: "honest shell — aggregate totals real, public project payload uncaptured" },
  { live: "/profile/:username/projects/:projectSlug", app: "/profile/:username/projects/:projectSlug", note: "honest shell — project detail uncaptured" },
  { live: "/profile/:username/ranking", app: "/profile/:username/ranking", note: "honest shell — no leaderboard payload captured" },
];

// ---------------------------------------------------------------------------
// 4. Deferred live routes (out of wave 1–5 scope) — first match wins
// ---------------------------------------------------------------------------

const DEFERRED_GROUPS = [
  {
    name: "auth-provider",
    match: /^\/(auth|sign-in|oauth|discord-verify|email-verification)(\/|$)/,
    reason: "Auth provider surface (email/sso/oauth/token/verify flows) out of clone scope — the clone implements its own session API (src/app/api/auth/*).",
  },
  {
    name: "supercomputer",
    match: /^\/(supercomputer|debug\/supercomputer)(\/|$)/,
    reason: "The Supercomputer agent platform (chats, marketplace, apps, employees, skills, gaming, memory, connectors) — no surface spec captured; wave 4+ backlog.",
  },
  {
    name: "flow-tree",
    match: /^\/flow(\/|$)/,
    reason: "Legacy/alternate generation flows (avatar presets, fashion, photodump, speech, draw, mixed-media, shorts) — the wave-2 single-pipeline architecture (Cinema Studio + jobs API) is the clone's only generation path by design.",
  },
  {
    name: "academy-children",
    match: /^\/academy\//,
    reason: "Academy course catalog/player/certificate/saved surfaces uncaptured — wave-3C scope was the academy landing (per the packet).",
  },
  {
    name: "mobile-shell",
    match: /^\/(gallery|mobile\/|mob-explore|photodump\/mobile|upscale\/mobile|apps\/skin-enhancer\/mobile)/,
    reason: "Mobile app shell routes out of scope (responsive web clone).",
  },
  {
    name: "per-model-community",
    match:
      /^\/(kling-30-community|seedance-2-community|seedance-2-5-community|seedance-4k-community|mixed-media-community|mixed-media-presets|soul|wan-video|gpt-image-2-community|soul-cinema-community|soul-community|higgsfield-genjutsu-presets|nano-banana-pro-preview|collection\/|marketing-studio-community)(\/|$)|^\/:slug$/,
    reason: "Per-model community hubs, preset galleries and curated collections uncaptured — the community feed + /explore catalog carry the clone's discovery surface (wave 4+).",
  },
  {
    name: "billing-checkout",
    match:
      /^\/(checkout-first|pricing\/checkout|pricing\/dev|payment|renew|reactivate|verify-card|activate|business-domain-verification|special-offer|gift|enter-team|accept-invitation)(\/|$)/,
    reason: "Payment/billing/checkout provider surface out of scope — the clone's /pricing is informational (PRICING_CONFIG); no payment flows are cloned.",
  },
  {
    name: "onboarding-start",
    match: /^\/(start|welcome-quiz|onboarding|quiz|remote-quiz)(\/|$)/,
    reason: "Onboarding/start flows (per-tool start pages, quizzes) uncaptured — out of clone scope.",
  },
  {
    name: "redirect-probe-debug",
    match: /^\/(mcp-credits|mcp-pricing|touring-banner-probe|touring-results-probe|debug|blocked|device|explainer)(\/|$)/,
    reason: "Internal action-redirects, A/B probes, debug playgrounds and gate pages — not product surfaces (the mcp-credits/mcp-pricing redirects are disclosed in src/app/mcp/page.tsx).",
  },
  {
    name: "studio-backlog",
    match:
      /^\/(3d-jutsu|ai-host|ai\/image|ai\/video|faceless-studio|lipsync-studio|shorts-studio|seedance-4k|katana|popcorn|sora-trends|enterprise-studio|character|character-sheet|moodboard|mixed-media|upscale|video-edit|video-editor|layers|apps)(\/|$)/,
    reason: "Studio/tool surfaces beyond the wave 1–3 packet scopes (uncaptured specs) — wave 4+ backlog.",
  },
  {
    name: "generate-extras",
    match: /^\/generate\//,
    reason: "Live generate-tree extras (per-$mode addressing, settings, favorites, usage, elements, pricing modal, trash-item detail) — flattened away by the clone's wave-1 architecture (studio at /, library at /generate/all, flat folder/trash routes); not separately implemented.",
  },
  {
    name: "marketing-static",
    match: /^\/(about|contact|cookie-notice|trust|newsletter|quanta-demo|viral-effects|image-translations|original-series|locales|home)(\/|$)/,
    reason: "Static marketing/legal/editorial/localization pages (and the duplicate live /home entry route) out of clone scope.",
  },
  {
    name: "module-extras",
    match: /^\/(contests|community|mcp|effects|edit|marketing-studio)\//,
    reason:
      "Sub-surface routes of in-scope modules whose bodies were never captured: contest submission permalinks + literal slugs (adathon/apps — the clone's /contests/[slug] dynamic route serves the shape; those slugs are not seeded), community post permalinks, mcp bundles, effects examples/tests/use-index, the edit job-set editor, marketing-studio subpages — wave 4+ backlog.",
  },
  {
    name: "uncaptured-detail",
    match: /.*/,
    reason:
      "Remaining detail/sub-surface routes never captured in the 2026-10-17 survey (publication/post/share/motion permalinks, p/:id, share/folder, verify/:serial …) — wave 4+ backlog; every member is listed below so nothing is hidden.",
  },
];

// ---------------------------------------------------------------------------
// Diff & report
// ---------------------------------------------------------------------------

const appRoutes = walkApp(APP_DIR, []).sort();
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));
const live = new Map(); // normalized path → original keys
for (const key of Object.keys(manifest)) {
  const n = normalizeLiveKey(key);
  if (!live.has(n)) live.set(n, []);
  live.get(n).push(key);
}

const curationErrors = [];
const implemented = [];
const missing = [];
const consumed = new Set();

for (const entry of CURATED) {
  if (!entry.liveAbsent && !live.has(entry.live)) {
    curationErrors.push(`curated live path not in manifest: ${entry.live}`);
    continue;
  }
  if (!entry.liveAbsent) consumed.add(entry.live);
  if (appRoutes.includes(entry.app)) {
    implemented.push(entry);
  } else {
    missing.push(entry);
  }
}

const referencedApps = new Set(CURATED.map((c) => c.app));
const extra = appRoutes.filter((r) => !referencedApps.has(r));

// Deferred assignment (first matching group wins; the catch-all makes
// leftovers impossible, but UNGROUPED is still reported as a guard).
const deferred = [];
for (const [path] of live) {
  if (consumed.has(path)) continue;
  const group = DEFERRED_GROUPS.find((g) => g.match.test(path));
  if (!group) {
    deferred.push({ path, group: null });
    continue;
  }
  deferred.push({ path, group: group.name });
}
const ungrouped = deferred.filter((d) => d.group === null);

const grouped = new Map();
for (const d of deferred) {
  if (!grouped.has(d.group)) grouped.set(d.group, []);
  grouped.get(d.group).push(d.path);
}

// ----- output -----
const runDate = new Date().toISOString().slice(0, 10);
const pad = (s, n) => (s.length > n ? s.slice(0, n - 1) + "…" : s.padEnd(n));

console.log(`HF route-parity exit gate (wave-3 final C6 + wave-5 settings/profile extension) — run ${runDate}`);
console.log(`app pages walked     : ${appRoutes.length} (src/app page.tsx inventory; api subtree excluded)`);
console.log(`live manifest        : ${Object.keys(manifest).length} keys → ${live.size} normalized routes`);
console.log(`curated in-scope     : ${CURATED.length} entries (${CURATED.filter((c) => c.note).length} with alias/disclosure notes)`);
console.log("");

console.log(`IMPLEMENTED (matched pairs) — ${implemented.length}`);
for (const e of implemented) {
  const keys = e.liveAbsent ? "off-manifest" : `${live.get(e.live).length} key(s)`;
  console.log(`  ${pad(e.live, 44)} ↔ ${pad(e.app, 28)} [${keys}]${e.note ? "\n      ↳ " + e.note : ""}`);
}
console.log("");

console.log(`MISSING (in curated scope, no app route) — ${missing.length}`);
for (const e of missing) {
  console.log(`  ${e.live} → expected app route ${e.app}${e.note ? "\n      ↳ " + e.note : ""}`);
}
console.log("");

console.log(`EXTRA (app pages with no curated counterpart) — ${extra.length}`);
for (const r of extra) console.log(`  ${r} (no live counterpart in the curated scope — must be covered by an alias or removed)`);
console.log("");

console.log(`DEFERRED (live routes out of wave 1–5 scope) — ${deferred.length} routes in ${grouped.size} groups`);
for (const g of DEFERRED_GROUPS) {
  const members = grouped.get(g.name);
  if (!members) continue;
  console.log(`  ${g.name} (${members.length}): ${g.reason}`);
  for (const m of members.slice().sort()) console.log(`      ${m}`);
}
console.log("");

console.log(`CURATION ERRORS — ${curationErrors.length}`);
for (const e of curationErrors) console.log(`  ${e}`);
console.log(`UNGROUPED — ${ungrouped.length}`);
for (const u of ungrouped) console.log(`  ${u.path}`);
console.log("");

const ok = missing.length === 0 && curationErrors.length === 0 && ungrouped.length === 0;
console.log(
  `RESULT: ${ok ? "exit 0 — curated wave 1–5 scope fully implemented" : "exit 1 — gaps above must be fixed"}`,
);
process.exit(ok ? 0 : 1);
