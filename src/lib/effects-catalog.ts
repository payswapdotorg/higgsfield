/**
 * HF-W3B visual-effects catalog — the named-effect inventory for the /effects
 * public surface and the /effects/[slug] detail pages.
 *
 * Evidence source: evidence/rea-2026-10-17/surfaces/inspect-effects.json
 * (root "Visual Effects", 1235 a11y nodes). Page structure per the capture:
 * - hero heading 19992 'VISUAL EFFECTS' (StaticText 19993);
 * - navigation 19994 'Effects' — the page's own quick-link strip over the
 *   effect names, with ' new' badges on 7 entries (AGAMEMNON 20041,
 *   FALLEN ANGEL 20046, BULLET TIME 20049, CYCLOPE 20054, PIGEONS 20077,
 *   PEARL EARRING 20086, SKATEDOG 20093);
 * - region 20102 'VFX gallery' → single list 21767 → 50 figure cards in
 *   document order (listitems 21769…22258). Each card = figure (e.g. 20103)
 *   → link 'View {Name}' (e.g. 20105 'View Floating fall') + heading
 *   '{NAME}' (e.g. 20106 'FLOATING FALL') + link 'Generate' (e.g. 20108).
 *   No per-effect description/blurb or category text was captured.
 *
 * Catalog policy (disclosed):
 * - 50 gallery cards name only 45 unique effects — five names repeat
 *   (FLOATING FALL 20106/20370, CUTOUT 20226/20354, EYES IN 20258/20306,
 *   VANISH 20402 duplicate of 20242, INFINITE CLONES 20394/20474; the live
 *   page's own quick-nav 19994 repeats them too). EFFECTS_CATALOG keeps one
 *   entry per unique name in first-occurrence order and records every
 *   gallery occurrence node id in `occurrences`.
 * - 'new' flags come ONLY from the quick-nav badge text ('AGAMEMNON new' …);
 *   no other promotion state is invented.
 * - The gallery has NO captured sub-sections (one flat list under region
 *   20102 'VFX gallery') — so the clone renders a single gallery section;
 *   no category grouping is fabricated.
 * - No per-effect description, media, or href values were captured (the DOM
 *   spec carries attribute names only). Detail pages render the name +
 *   what IS captured (View/Generate affordances) with a visible note.
 */

export interface EffectEntry {
  /** Clone-side slug derived deterministically from the evidence name. */
  slug: string;
  /** Verbatim evidence heading text (uppercase, e.g. 'FLOATING FALL'). */
  name: string;
  /** Verbatim evidence card-link text ('View Floating fall'). */
  viewLabel: string;
  /** True when the quick-nav carries the '{name} new' badge (7 effects). */
  isNew: boolean;
  /** Every gallery figure node id that carries this effect name. */
  occurrences: number[];
  /** Heading node id of the first occurrence. */
  headingNodeId: number;
  /** 'View …' link node id of the first occurrence. */
  viewNodeId: number;
}

// ev: inspect-effects.json — region 20102 'VFX gallery', list 21767, figures
//     in document order; names + 'View …' labels verbatim; occurrences list
//     every repeated card; isNew from quick-nav 19994 badge links.
export const EFFECTS_CATALOG: EffectEntry[] = [
  {
    slug: "floating-fall",
    name: "FLOATING FALL",
    viewLabel: "View Floating fall",
    isNew: false,
    occurrences: [20103, 20367],
    headingNodeId: 20106,
    viewNodeId: 20105,
  },
  {
    slug: "high-flip",
    name: "HIGH FLIP",
    viewLabel: "View High flip",
    isNew: false,
    occurrences: [20111],
    headingNodeId: 20114,
    viewNodeId: 20113,
  },
  {
    slug: "burning-man",
    name: "BURNING MAN",
    viewLabel: "View Burning man",
    isNew: false,
    occurrences: [20119],
    headingNodeId: 20122,
    viewNodeId: 20121,
  },
  {
    slug: "scrapbook-collage",
    name: "SCRAPBOOK COLLAGE",
    viewLabel: "View Scrapbook collage",
    isNew: false,
    occurrences: [20127],
    headingNodeId: 20130,
    viewNodeId: 20129,
  },
  {
    slug: "comic",
    name: "COMIC",
    viewLabel: "View Comic",
    isNew: false,
    occurrences: [20135],
    headingNodeId: 20138,
    viewNodeId: 20137,
  },
  {
    slug: "frozen-in-motion",
    name: "FROZEN IN MOTION",
    viewLabel: "View Frozen in motion",
    isNew: false,
    occurrences: [20143],
    headingNodeId: 20146,
    viewNodeId: 20145,
  },
  {
    slug: "particles",
    name: "PARTICLES",
    viewLabel: "View Particles",
    isNew: false,
    occurrences: [20151],
    headingNodeId: 20154,
    viewNodeId: 20153,
  },
  {
    slug: "pigeons",
    name: "PIGEONS",
    viewLabel: "View Pigeons",
    isNew: true, // ev: quick-nav link 20077 'PIGEONS new'
    occurrences: [20159],
    headingNodeId: 20162,
    viewNodeId: 20161,
  },
  {
    slug: "pearl-earring",
    name: "PEARL EARRING",
    viewLabel: "View Pearl earring",
    isNew: true, // ev: quick-nav link 20086 'PEARL EARRING new'
    occurrences: [20167],
    headingNodeId: 20170,
    viewNodeId: 20169,
  },
  {
    slug: "studio-slide",
    name: "STUDIO SLIDE",
    viewLabel: "View Studio slide",
    isNew: false,
    occurrences: [20175],
    headingNodeId: 20178,
    viewNodeId: 20177,
  },
  {
    slug: "incline",
    name: "INCLINE",
    viewLabel: "View Incline",
    isNew: false,
    occurrences: [20183],
    headingNodeId: 20186,
    viewNodeId: 20185,
  },
  {
    slug: "act-natural",
    name: "ACT NATURAL",
    viewLabel: "View Act natural",
    isNew: false,
    occurrences: [20191],
    headingNodeId: 20194,
    viewNodeId: 20193,
  },
  {
    slug: "monster-dab",
    name: "MONSTER DAB",
    viewLabel: "View Monster dab",
    isNew: false,
    occurrences: [20199],
    headingNodeId: 20202,
    viewNodeId: 20201,
  },
  {
    slug: "clones",
    name: "CLONES",
    viewLabel: "View Clones",
    isNew: false,
    occurrences: [20207],
    headingNodeId: 20210,
    viewNodeId: 20209,
  },
  {
    slug: "earth-zoom",
    name: "EARTH ZOOM",
    viewLabel: "View Earth zoom",
    isNew: false,
    occurrences: [20215],
    headingNodeId: 20218,
    viewNodeId: 20217,
  },
  {
    slug: "cutout",
    name: "CUTOUT",
    viewLabel: "View Cutout",
    isNew: false,
    occurrences: [20223, 20351],
    headingNodeId: 20226,
    viewNodeId: 20225,
  },
  {
    slug: "mighty-fighter",
    name: "MIGHTY FIGHTER",
    viewLabel: "View Mighty fighter",
    isNew: false,
    occurrences: [20231],
    headingNodeId: 20234,
    viewNodeId: 20233,
  },
  {
    slug: "vanish",
    name: "VANISH",
    viewLabel: "View Vanish",
    isNew: false,
    occurrences: [20239, 20399],
    headingNodeId: 20242,
    viewNodeId: 20241,
  },
  {
    slug: "moonwalk",
    name: "MOONWALK",
    viewLabel: "View Moonwalk",
    isNew: false,
    occurrences: [20247],
    headingNodeId: 20250,
    viewNodeId: 20249,
  },
  {
    slug: "eyes-in",
    name: "EYES IN",
    viewLabel: "View Eyes in",
    isNew: false,
    occurrences: [20255, 20303],
    headingNodeId: 20258,
    viewNodeId: 20257,
  },
  {
    slug: "street-colossus",
    name: "STREET COLOSSUS",
    viewLabel: "View Street colossus",
    isNew: false,
    occurrences: [20263],
    headingNodeId: 20266,
    viewNodeId: 20265,
  },
  {
    slug: "melting",
    name: "MELTING",
    viewLabel: "View Melting",
    isNew: false,
    occurrences: [20271],
    headingNodeId: 20274,
    viewNodeId: 20273,
  },
  {
    slug: "architecture-wave",
    name: "ARCHITECTURE WAVE",
    viewLabel: "View Architecture wave",
    isNew: false,
    occurrences: [20279],
    headingNodeId: 20282,
    viewNodeId: 20281,
  },
  {
    slug: "agamemnon",
    name: "AGAMEMNON",
    viewLabel: "View Agamemnon",
    isNew: true, // ev: quick-nav link 20041 'AGAMEMNON new'
    occurrences: [20287],
    headingNodeId: 20290,
    viewNodeId: 20289,
  },
  {
    slug: "cyclope",
    name: "CYCLOPE",
    viewLabel: "View Cyclope",
    isNew: true, // ev: quick-nav link 20054 'CYCLOPE new'
    occurrences: [20295],
    headingNodeId: 20298,
    viewNodeId: 20297,
  },
  {
    slug: "canvas",
    name: "CANVAS",
    viewLabel: "View Canvas",
    isNew: false,
    occurrences: [20311],
    headingNodeId: 20314,
    viewNodeId: 20313,
  },
  {
    slug: "tracking",
    name: "TRACKING",
    viewLabel: "View Tracking",
    isNew: false,
    occurrences: [20319],
    headingNodeId: 20322,
    viewNodeId: 20321,
  },
  {
    slug: "lsd",
    name: "LSD",
    viewLabel: "View LSD",
    isNew: false,
    occurrences: [20327],
    headingNodeId: 20330,
    viewNodeId: 20329,
  },
  {
    slug: "blue-depth",
    name: "BLUE DEPTH",
    viewLabel: "View Blue depth",
    isNew: false,
    occurrences: [20335],
    headingNodeId: 20338,
    viewNodeId: 20337,
  },
  {
    slug: "wild-ride",
    name: "WILD RIDE",
    viewLabel: "View Wild ride",
    isNew: false,
    occurrences: [20343],
    headingNodeId: 20346,
    viewNodeId: 20345,
  },
  {
    slug: "world-morphing",
    name: "WORLD MORPHING",
    viewLabel: "View World morphing",
    isNew: false,
    occurrences: [20359],
    headingNodeId: 20362,
    viewNodeId: 20361,
  },
  {
    slug: "stop-world",
    name: "STOP WORLD",
    viewLabel: "View Stop world",
    isNew: false,
    occurrences: [20375],
    headingNodeId: 20378,
    viewNodeId: 20377,
  },
  {
    slug: "bullet-time",
    name: "BULLET TIME",
    viewLabel: "View Bullet time",
    isNew: true, // ev: quick-nav link 20049 'BULLET TIME new'
    occurrences: [20383],
    headingNodeId: 20386,
    viewNodeId: 20385,
  },
  {
    slug: "infinite-clones",
    name: "INFINITE CLONES",
    viewLabel: "View Infinite clones",
    isNew: false,
    occurrences: [20391, 20471],
    headingNodeId: 20394,
    viewNodeId: 20393,
  },
  {
    slug: "superstar",
    name: "SUPERSTAR",
    viewLabel: "View Superstar",
    isNew: false,
    occurrences: [20407],
    headingNodeId: 20410,
    viewNodeId: 20409,
  },
  {
    slug: "skatedog",
    name: "SKATEDOG",
    viewLabel: "View Skatedog",
    isNew: true, // ev: quick-nav link 20093 'SKATEDOG new'
    occurrences: [20415],
    headingNodeId: 20418,
    viewNodeId: 20417,
  },
  {
    slug: "smash-and-grab",
    name: "SMASH AND GRAB",
    viewLabel: "View Smash and grab",
    isNew: false,
    occurrences: [20423],
    headingNodeId: 20426,
    viewNodeId: 20425,
  },
  {
    slug: "selfception",
    name: "SELFCEPTION",
    viewLabel: "View Selfception",
    isNew: false,
    occurrences: [20431],
    headingNodeId: 20434,
    viewNodeId: 20433,
  },
  {
    slug: "lacewalker",
    name: "LACEWALKER",
    viewLabel: "View Lacewalker",
    isNew: false,
    occurrences: [20439],
    headingNodeId: 20442,
    viewNodeId: 20441,
  },
  {
    slug: "boarding-pass",
    name: "BOARDING PASS",
    viewLabel: "View boarding pass", // verbatim — lowercase 'b' in the evidence link
    isNew: false,
    occurrences: [20447],
    headingNodeId: 20450,
    viewNodeId: 20449,
  },
  {
    slug: "lidar-transition",
    name: "LIDAR TRANSITION",
    viewLabel: "View Lidar transition",
    isNew: false,
    occurrences: [20455],
    headingNodeId: 20458,
    viewNodeId: 20457,
  },
  {
    slug: "fallen-angel",
    name: "FALLEN ANGEL",
    viewLabel: "View Fallen angel",
    isNew: true, // ev: quick-nav link 20046 'FALLEN ANGEL new'
    occurrences: [20463],
    headingNodeId: 20466,
    viewNodeId: 20465,
  },
  {
    slug: "windows",
    name: "WINDOWS",
    viewLabel: "View Windows",
    isNew: false,
    occurrences: [20479],
    headingNodeId: 20482,
    viewNodeId: 20481,
  },
  {
    slug: "fairytale-castle",
    name: "FAIRYTALE CASTLE",
    viewLabel: "View Fairytale castle",
    isNew: false,
    occurrences: [20487],
    headingNodeId: 20490,
    viewNodeId: 20489,
  },
  {
    slug: "palette",
    name: "PALETTE",
    viewLabel: "View Palette",
    isNew: false,
    occurrences: [20495],
    headingNodeId: 20498,
    viewNodeId: 20497,
  },
];

/** Slug → entry lookup (detail pages). */
export function effectBySlug(slug: string): EffectEntry | undefined {
  return EFFECTS_CATALOG.find((e) => e.slug === slug);
}

/** The 7 'new' effects (quick-nav badge order, ev: links 20041…20093). */
export const NEW_EFFECTS: EffectEntry[] = EFFECTS_CATALOG.filter((e) => e.isNew);

/**
 * Deterministic hue for effect card visuals (no Math.random — fnv1a of the
 * slug, same algorithm as src/lib/model-registry.ts modelHue).
 */
export function effectHue(slug: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash & 0x7fffffff) % 360;
}
