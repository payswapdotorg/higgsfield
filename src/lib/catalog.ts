/**
 * HF-W2 model catalog + aspect presets (spec constants).
 *
 * Evidence anchors (HF-W2 §1):
 * - slug `nano-banana-2`, job_set_type `nano_banana_2`, model_label "Nano Banana Pro" (§1c touring),
 *   "Generate 2" on /ai/image (§1a) → creditCost 2.
 * - "GENERATE 80" on Cinema Studio 4.0 (§1a) → creditCost 80.
 * - job_set_type `wan2_2_animate_faceswap` carries the §1e "Temporary Issues" warning badge.
 * Slugs for the other models and their costs (30) are clone-side catalog choices (disclosed).
 */
export type AspectRatio = "3:4" | "16:9" | "1:1";
export type Resolution = "1k" | "2k";
export type ModelKind = "image" | "video";

export interface ModelSpec {
  slug: string;
  label: string;
  jobSetType: string;
  kind: ModelKind;
  creditCost: number;
  aspects: AspectRatio[];
  defaultAspect: AspectRatio;
  resolutions: Resolution[];
  defaultResolution: Resolution;
  maxBatch: number;
  description: string;
}

export const MODEL_CATALOG: Record<string, ModelSpec> = {
  "nano-banana-2": {
    slug: "nano-banana-2",
    label: "Nano Banana Pro",
    jobSetType: "nano_banana_2",
    kind: "image",
    creditCost: 2,
    aspects: ["3:4", "16:9", "1:1"],
    defaultAspect: "3:4",
    resolutions: ["1k", "2k"],
    defaultResolution: "1k",
    maxBatch: 4,
    description: "Fast, high-fidelity text-to-image.",
  },
  "cinema-studio-4": {
    slug: "cinema-studio-4",
    label: "Cinema Studio 4.0",
    jobSetType: "cinema_studio_4",
    kind: "video",
    creditCost: 80,
    aspects: ["3:4", "16:9", "1:1"],
    defaultAspect: "16:9",
    resolutions: ["1k", "2k"],
    defaultResolution: "1k",
    maxBatch: 1,
    description: "Cinematic video generation with camera control.",
  },
  "wan-2-2-animate-faceswap": {
    slug: "wan-2-2-animate-faceswap",
    label: "Wan 2.2 Animate FaceSwap",
    jobSetType: "wan2_2_animate_faceswap",
    kind: "video",
    creditCost: 30,
    aspects: ["3:4", "16:9", "1:1"],
    defaultAspect: "16:9",
    resolutions: ["1k", "2k"],
    defaultResolution: "1k",
    maxBatch: 1,
    description: "Animate a portrait with face swap.",
  },
};

/**
 * Aspect presets drive width/height (§1a): 3:4 → 896×1200, 16:9 → 1200×672, 1:1 → 1024×1024 @1k;
 * @2k doubles them.
 */
export const ASPECT_PRESETS: Record<AspectRatio, Record<Resolution, { width: number; height: number }>> = {
  "3:4": { "1k": { width: 896, height: 1200 }, "2k": { width: 1792, height: 2400 } },
  "16:9": { "1k": { width: 1200, height: 672 }, "2k": { width: 2400, height: 1344 } },
  "1:1": { "1k": { width: 1024, height: 1024 }, "2k": { width: 2048, height: 2048 } },
};

export function presetFor(aspect: AspectRatio, resolution: Resolution): { width: number; height: number } {
  return ASPECT_PRESETS[aspect][resolution];
}

/** §1e job_set_notices (badge shape verbatim; tooltip text reconstructed — not in evidence). */
export interface JobSetNotice {
  job_set_types: string[];
  params: Record<string, never>;
  variant: "warning";
  badge: { label: string; tooltip: string };
}

export const JOB_SET_NOTICES: JobSetNotice[] = [
  {
    job_set_types: ["wan2_2_animate_faceswap"],
    params: {},
    variant: "warning",
    badge: {
      label: "Temporary Issues",
      tooltip:
        "wan2_2_animate_faceswap is experiencing temporary issues. Generations may fail or take longer than usual.",
    },
  },
];

export interface NoticeBadge {
  variant: string;
  badge: { label: string; tooltip: string };
}

export function noticesForJobSetType(jobSetType: string): NoticeBadge[] {
  return JOB_SET_NOTICES.filter((n) => n.job_set_types.includes(jobSetType)).map((n) => ({
    variant: n.variant,
    badge: n.badge,
  }));
}

/**
 * Pricing stub for the UPGRADE REQUIRED modal + /pricing page.
 * Free tier anchored to §1c (daily_credits = 10); paid tier values are placeholder demo values
 * (the digest body for monthly tiers was not present in the workspace — disclosed).
 */
export const PRICING_CONFIG = {
  planVersion: "v45.0.0",
  plans: [
    {
      id: "free",
      name: "Free",
      price: 0,
      period: "month",
      creditNote: "10 daily credits",
      mainFeatures: ["10 daily credits", "Nano Banana Pro image generations", "Community access"],
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      period: "month",
      creditNote: "5,000 credits / month",
      mainFeatures: ["5,000 credits monthly", "Cinema Studio 4.0 access", "Priority queue", "2k resolution"],
    },
  ],
} as const;
