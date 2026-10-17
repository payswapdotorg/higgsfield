/**
 * HF-W3A model registry — the vendor/model inventory for the /explore catalog surface.
 *
 * Evidence source: evidence/rea-2026-10-17/surfaces/inspect-api.json
 * (root "Open Higgsfield AI | Official Higgsfield API Platform", 2577 a11y nodes).
 * Card shape per entry: group "Image models" (node 11374) / group "Video models"
 * (node 11640) → article → link "vendor / Model [N modes]" (e.g. 11171
 * 'bytedance / Seedance 2.5 5 modes') + heading "vendor / Model" (11173) +
 * paragraph blurb StaticText (11181) + price generic text (13241) + optional
 * StaticText badges 'Higgsfield Exclusive' (e.g. 11403) and 'Image'/'Video'
 * kind badges (e.g. 11379 / 11660).
 *
 * Per-model credit-pool cross-check: evidence/rea-2026-10-17/api-bodies-digest.json
 * → user body carries soul_credits, wan2_5_video_credits, text2keyframes_credits,
 * face_swap_credits, qwen_camera_control_credits, character_swap_credits — the
 * per-model pool fields confirming the Soul / Wan model families in the wallet model.
 *
 * Generate-able cross-ref: src/lib/catalog.ts MODEL_CATALOG (nano-banana-2,
 * cinema-studio-4, wan-2-2-animate-faceswap). Only "higgsfield / Cinema Studio 4.0"
 * (video group, node 11799/11801) has a MODEL_CATALOG counterpart (cinema-studio-4).
 * nano-banana-2 and wan-2-2-animate-faceswap have NO card on the captured /api
 * platform page (disclosed: the studio catalog and the platform catalog are
 * different surfaces in the live product).
 *
 * href policy (disclosed): the live card hrefs were not captured (the DOM spec
 * carries attribute_names only, no values). Cards link only to clone surfaces that
 * actually exist: generate-able model → "/" (Cinema Studio composer — plain link,
 * the studio takes no model param today); models with a clone studio surface →
 * that studio's route; everything else → null (inert catalog card, no fake links).
 */

import type { ModelKind } from "@/lib/catalog";

export interface RegistryModel {
  /** Clone-side slug derived deterministically from vendor + name. */
  slug: string;
  /** Evidence vendor prefix ("bytedance", "higgsfield", …). */
  vendor: string;
  /** Evidence model name ("Seedance 2.5"). */
  name: string;
  kind: ModelKind;
  /** Verbatim evidence blurb (paragraph StaticText on the card). */
  blurb: string;
  /** Evidence pricing line (generic text under the blurb), when captured. */
  priceNote?: string;
  /** Evidence "N modes" chip count, when captured. */
  modes?: number;
  /** Evidence "Higgsfield Exclusive" badge. */
  exclusive?: boolean;
  /** Cross-reference into MODEL_CATALOG when the model is generate-able in the clone. */
  catalogId?: string;
  /** Where the card links in the clone; null = inert catalog entry (no honest target). */
  href: string | null;
}

/**
 * Image models — ev: inspect-api.json group 11374 "Image models" (13 cards,
 * 9 model cards + 4 workflow cards; workflows are exported separately below).
 */
export const IMAGE_MODELS: RegistryModel[] = [
  // ev: card 10665 — link 11300 'Marketing Studio Image 3 modes', heading 11302,
  //     blurb 11308, price 13394; clone surface /marketing-studio (W3A).
  {
    slug: "marketing-studio-image",
    vendor: "higgsfield",
    name: "Marketing Studio Image",
    kind: "image",
    blurb: "Creates and edits campaign images up to 4K from text or images.",
    priceNote: "Now from $0.014 per image, 15% off, down from $0.016",
    modes: 3,
    href: "/marketing-studio",
  },
  // ev: card 10666 — link 11404 'higgsfield / AI Influencer', heading 11406,
  //     blurb 11411, price 13522 '$0.050 per image', badge 11403 'Higgsfield Exclusive';
  //     clone surface /ai-influencer-studio (W3A).
  {
    slug: "ai-influencer",
    vendor: "higgsfield",
    name: "AI Influencer",
    kind: "image",
    blurb:
      "Create one AI influencer character sheet. Human and animal modes. $0.05 per sheet.",
    priceNote: "$0.050 per image",
    exclusive: true,
    href: "/ai-influencer-studio",
  },
  // ev: card 10667 — link 11421 'xai / Grok Imagine 2.0', heading 11423,
  //     blurb 11428, price 13548 'from $0.040 per image'.
  {
    slug: "grok-imagine-2-0",
    vendor: "xai",
    name: "Grok Imagine 2.0",
    kind: "image",
    blurb:
      "Generates images and makes precise edits while preserving image details and visual consistency.",
    priceNote: "from $0.040 per image",
    href: null,
  },
  // ev: card 10668 — link 11441 'higgsfield / Soul 2 2 modes', heading 11443,
  //     blurb 11451, price 'from $0.003 per image', badge 'Higgsfield Exclusive';
  //     credit-pool cross-check: soul_credits in api-bodies-digest user body.
  {
    slug: "soul-2",
    vendor: "higgsfield",
    name: "Soul 2",
    kind: "image",
    blurb:
      "Generates realistic portraits and fashion images, with natural textures and curated editorial styles.",
    priceNote: "from $0.003 per image",
    modes: 2,
    exclusive: true,
    href: null,
  },
  // ev: card 10669 — link 11462 'ideogram / Ideogram 4.0', heading 11464,
  //     blurb 11469, price 13599 '$0.030 per image'.
  {
    slug: "ideogram-4-0",
    vendor: "ideogram",
    name: "Ideogram 4.0",
    kind: "image",
    blurb:
      "Generates and edits images with multilingual text for posters, packaging and other graphic layouts.",
    priceNote: "$0.030 per image",
    href: null,
  },
  // ev: card 10670 — link 11479 'recraft / Recraft 4.1 4 modes', heading 11481,
  //     blurb 11489, price 13625 '$0.035 per image'.
  {
    slug: "recraft-4-1",
    vendor: "recraft",
    name: "Recraft 4.1",
    kind: "image",
    blurb:
      "Generates images and illustrations using custom palettes and background colors to fit your brand.",
    priceNote: "$0.035 per image",
    modes: 4,
    href: null,
  },
  // ev: card 10671 — link 11501 'higgsfield / Soul Standard', heading 11503,
  //     blurb 11508, price 'from $0.094 per image', badge 'Higgsfield Exclusive';
  //     credit-pool cross-check: soul_credits in api-bodies-digest user body.
  {
    slug: "soul-standard",
    vendor: "higgsfield",
    name: "Soul Standard",
    kind: "image",
    blurb:
      "Generates fashion and lifestyle photos from text, with style presets for editorial and social content.",
    priceNote: "from $0.094 per image",
    exclusive: true,
    href: null,
  },
  // ev: card 10673 — link 11539 'alibaba / Qwen Image 3 2 modes', heading 11541,
  //     blurb 11549, price 'from $0.040 per image';
  //     credit-pool cross-check: qwen_camera_control_credits in the digest user body.
  {
    slug: "qwen-image-3",
    vendor: "alibaba",
    name: "Qwen Image 3",
    kind: "image",
    blurb:
      "Generates images from English or Chinese text, with enhanced prompts and resolution up to 2K.",
    priceNote: "from $0.040 per image",
    modes: 2,
    href: null,
  },
  // ev: card 10674 — link 11560 'alibaba / Z-Image Turbo', heading 11562,
  //     blurb 11567, price 13746 '$0.015 per image'.
  {
    slug: "z-image-turbo",
    vendor: "alibaba",
    name: "Z-Image Turbo",
    kind: "image",
    blurb:
      "Generates images quickly with clear Chinese and English text rendering and PNG output up to 2K.",
    priceNote: "$0.015 per image",
    href: null,
  },
];

/**
 * Video models — ev: inspect-api.json group 11640 "Video models" (15 cards,
 * 14 model cards + 1 Genjutsu workflow card exported below).
 */
export const VIDEO_MODELS: RegistryModel[] = [
  // ev: card 10678 — link 11647 'bytedance / Seedance 2.5 5 modes', heading 11649,
  //     blurb 11657, price 13875.
  {
    slug: "seedance-2-5",
    vendor: "bytedance",
    name: "Seedance 2.5",
    kind: "video",
    blurb: "Generates videos up to 30 seconds from text, image, video, or audio.",
    priceNote: "Now from $0.144 per second, 30% off, down from $0.206",
    modes: 5,
    href: null,
  },
  // ev: card 10679 — link 11674 'higgsfield / Genjutsu 2 modes', heading 11676,
  //     blurb 11684, price 13909, badge 'Higgsfield Exclusive'.
  {
    slug: "genjutsu",
    vendor: "higgsfield",
    name: "Genjutsu",
    kind: "video",
    blurb: "Swaps characters, locations, and styles in a video, keeping its motion.",
    priceNote: "Now from $0.159 per second, 50% off, down from $0.318",
    modes: 2,
    exclusive: true,
    href: null,
  },
  // ev: card 10680 — link 11699 'kling / Kling 3.0 10 modes', heading 11701,
  //     blurb 11709, price 13939.
  {
    slug: "kling-3-0",
    vendor: "kling",
    name: "Kling 3.0",
    kind: "video",
    blurb:
      "Generates multi-shot videos from text or images, with native audio and durations up to 15 seconds.",
    priceNote: "Now $0.042 per second, 50% off, down from $0.084",
    modes: 10,
    href: null,
  },
  // ev: card 10681 — link 11723 'minimax / MiniMax H3 3 modes', heading 11725,
  //     blurb 11733, price 13968.
  {
    slug: "minimax-h3",
    vendor: "minimax",
    name: "MiniMax H3",
    kind: "video",
    blurb:
      "Generates 2K videos up to 15 seconds using text, image, video, and optional audio reference files.",
    priceNote: "Now $0.065 per second, 50% off, down from $0.130",
    modes: 3,
    href: null,
  },
  // ev: card 10682 — link 11747 'alibaba / Wan 3.0 Prime 3 modes', heading 11749,
  //     blurb 11757, price 14000;
  //     credit-pool cross-check: wan2_5_video_credits in the digest user body (Wan family).
  {
    slug: "wan-3-0-prime",
    vendor: "alibaba",
    name: "Wan 3.0 Prime",
    kind: "video",
    blurb:
      "Generates videos from text or media references with fast processing and clips up to 30 seconds.",
    priceNote: "Now from $0.027 per second, 60% off, down from $0.068",
    modes: 3,
    href: null,
  },
  // ev: card 10683 — link 11772 'bytedance / Seedance 2.0 3 modes', heading 11774,
  //     blurb 11782, price 14030.
  {
    slug: "seedance-2-0",
    vendor: "bytedance",
    name: "Seedance 2.0",
    kind: "video",
    blurb:
      "Creates 4K video from text or media references. Supports up to 15 seconds with optional sound.",
    priceNote: "Now from $0.099 per second, 30% off, down from $0.141",
    modes: 3,
    href: null,
  },
  // ev: card 10684 — link 11799 'higgsfield / Cinema Studio 4.0', heading 11801,
  //     blurb 11806, price 'from $0.206 per second', badge 'Higgsfield Exclusive';
  //     the ONLY registry model that is generate-able in the clone
  //     (MODEL_CATALOG "cinema-studio-4", 80 credits — catalog.ts §1a).
  {
    slug: "cinema-studio-4",
    vendor: "higgsfield",
    name: "Cinema Studio 4.0",
    kind: "video",
    blurb: "Generates cinematic videos up to 30 seconds with automatic scene direction.",
    priceNote: "from $0.206 per second",
    exclusive: true,
    catalogId: "cinema-studio-4",
    href: "/",
  },
  // ev: card 10686 — link 11845 'alibaba / Wan 3.0 3 modes', heading 11847,
  //     blurb 11855, price 14128.
  {
    slug: "wan-3-0",
    vendor: "alibaba",
    name: "Wan 3.0",
    kind: "video",
    blurb:
      "Generates videos from text or images with native audio and adjustable duration up to 30 seconds.",
    priceNote: "Now from $0.020 per second, 60% off, down from $0.050",
    modes: 3,
    href: null,
  },
  // ev: card 10687 — link 11870 'lightricks / LTX 2.5 Fast 2 modes', heading 11872,
  //     blurb 11880, price 'from $0.090 per second'.
  {
    slug: "ltx-2-5-fast",
    vendor: "lightricks",
    name: "LTX 2.5 Fast",
    kind: "video",
    blurb:
      "Generates videos from text or images with native audio, camera motion controls and 4K resolution.",
    priceNote: "from $0.090 per second",
    modes: 2,
    href: null,
  },
  // ev: card 10688 — link 11892 'lightricks / LTX 2.5 Pro 2 modes', heading 11894,
  //     blurb 11902, price 'from $0.120 per second'.
  {
    slug: "ltx-2-5-pro",
    vendor: "lightricks",
    name: "LTX 2.5 Pro",
    kind: "video",
    blurb:
      "Generates videos from text or images with native audio, camera motion controls and 1080p output.",
    priceNote: "from $0.120 per second",
    modes: 2,
    href: null,
  },
  // ev: card 10689 — link 11914 'xai / Grok Imagine Video 1.5', heading 11916,
  //     blurb 11921, price 'from $0.080 per second'.
  {
    slug: "grok-imagine-video-1-5",
    vendor: "xai",
    name: "Grok Imagine Video 1.5",
    kind: "video",
    blurb:
      "Creates videos from text prompts or still images, with 1080p resolution and clips up to 15 seconds.",
    priceNote: "from $0.080 per second",
    href: null,
  },
  // ev: card 10690 — link 11933 'alibaba / Wan 2.7 3 modes', heading 11935,
  //     blurb 11943, price 14242.
  {
    slug: "wan-2-7",
    vendor: "alibaba",
    name: "Wan 2.7",
    kind: "video",
    blurb:
      "Generates videos from text or images with native audio and consistent characters across scenes.",
    priceNote: "Now from $0.050 per second, 50% off, down from $0.100",
    modes: 3,
    href: null,
  },
  // ev: card 10691 — link 11958 'alibaba / Happy Horse 1.1 3 modes', heading 11960,
  //     blurb 11968, price 14275.
  {
    slug: "happy-horse-1-1",
    vendor: "alibaba",
    name: "Happy Horse 1.1",
    kind: "video",
    blurb:
      "Generates videos from text or image references with output at 1080p and clips up to 15 seconds.",
    priceNote: "Now from $0.070 per second, 50% off, down from $0.140",
    modes: 3,
    href: null,
  },
  // ev: card 10692 — link 11983 'alibaba / Happy Horse 1.0 3 modes', heading 11985,
  //     blurb 11993, price 14308.
  {
    slug: "happy-horse-1-0",
    vendor: "alibaba",
    name: "Happy Horse 1.0",
    kind: "video",
    blurb:
      "Generates videos from text or image references with clips up to 15 seconds and 1080p resolution.",
    priceNote: "Now from $0.070 per second, 50% off, down from $0.140",
    modes: 3,
    href: null,
  },
];

/**
 * Workflow cards — ev: inspect-api.json "Workflows" heading (node 12003) +
 * "Workflows and agents" group (node 12011, empty in capture); the four workflow
 * cards themselves were captured inside the Image models group (nodes 11577-11620:
 * Product shots / Graphic ads / Marketplace design + higgsfield / Ads Studio at
 * 11521-11528) and one inside the Video models group (higgsfield / Genjutsu
 * transfer-motion workflow, card 10685 — link 12042, blurb 12049).
 * StaticText 'Workflow' kind badge (e.g. 11574/12024) distinguishes them from models.
 */
export interface RegistryWorkflow {
  slug: string;
  vendor: string | null;
  name: string;
  blurb: string;
  priceNote?: string;
  exclusive?: boolean;
  href: string | null;
}

export const WORKFLOWS: RegistryWorkflow[] = [
  // ev: card 10672 — link 11521 'higgsfield / Ads Studio', heading 11523,
  //     blurb 11528, price 'from $0.084 per image', badge 'Higgsfield Exclusive';
  //     clone surface /ads-studio (W3A).
  {
    slug: "ads-studio",
    vendor: "higgsfield",
    name: "Ads Studio",
    blurb:
      "From a simple brief to ready-to-use ads. Bring your product, describe your vision, and let Ads Studio handle the creative.",
    priceNote: "from $0.084 per image",
    exclusive: true,
    href: "/ads-studio",
  },
  // ev: card 10675 — link 11577 'Product shots', heading 11579, blurb 11582,
  //     price 'Now from $0.014 per image, 15% off, down from $0.016'.
  {
    slug: "product-shots",
    vendor: null,
    name: "Product shots",
    blurb:
      "Turns product photos into campaign images with presets for composition, lighting and visual style.",
    priceNote: "Now from $0.014 per image, 15% off, down from $0.016",
    href: "/ads-studio",
  },
  // ev: card 10676 — link 11596 'Graphic ads', heading 11598, blurb 11601,
  //     price 13808.
  {
    slug: "graphic-ads",
    vendor: null,
    name: "Graphic ads",
    blurb:
      "Creates ad creatives from a product photo, with presets that guide layout, typography and colors.",
    priceNote: "Now from $0.014 per image, 15% off, down from $0.016",
    href: "/ads-studio",
  },
  // ev: card 10677 — link 11615 'Marketplace design', heading 11617, blurb 11620,
  //     price 13835.
  {
    slug: "marketplace-design",
    vendor: null,
    name: "Marketplace design",
    blurb:
      "Creates listing images from a product photo, with preset styles designed for marketplace catalogs.",
    priceNote: "Now from $0.014 per image, 15% off, down from $0.016",
    href: "/ads-studio",
  },
  // ev: card 10685 (video group) — link 12042 'higgsfield / Genjutsu 2 modes',
  //     heading 12044, blurb 12049 'Transfer motion from a reference video to your
  //     characters, products, or clothes.', price 14379.
  {
    slug: "genjutsu-motion-transfer",
    vendor: "higgsfield",
    name: "Genjutsu",
    blurb: "Transfer motion from a reference video to your characters, products, or clothes.",
    priceNote: "Now from $0.159 per second, 50% off, down from $0.318",
    exclusive: true,
    href: null,
  },
];

/** Vendor → models map, evidence card order preserved. */
export const MODEL_REGISTRY: Record<string, RegistryModel[]> = {};

for (const m of [...IMAGE_MODELS, ...VIDEO_MODELS]) {
  (MODEL_REGISTRY[m.vendor] ??= []).push(m);
}

/** Deterministic hue for catalog card visuals (no Math.random — fnv1a of the slug). */
export function modelHue(slug: string): number {
  // fnv1a re-implemented inline to keep this module dependency-free of the rng util
  // (same algorithm as src/lib/seeded-rng.ts fnv1a).
  let hash = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    hash ^= slug.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash & 0x7fffffff) % 360;
}
