/**
 * HF-W5 — the captured pricing-config v45.0.0 plan tree, verbatim.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `pricing-config`
 * (the digest string carries versions.v45.0.0.monthly.plans). The captured blob is
 * truncated at 20,000 characters mid-JSON: the `free` and `pro` plan objects are
 * COMPLETE (brace-matched during extraction); the plans object itself is cut off
 * after `pro` (the tail hints at a team/seats plan that was never fully captured).
 * Only free + pro are therefore rendered — nothing beyond the capture is invented.
 * This tree supplements (not replaces) the wave-1 PRICING_CONFIG stub in
 * src/lib/catalog.ts, which the /pricing page keeps using.
 */
export interface PlanFeature {
  id: string;
  text: string;
  status: "included" | "limited" | "excluded" | string;
  tooltip?: string;
  badges?: Array<{ label: string; color: string }>;
}

export interface PlanUnlimitedAccess {
  title: string;
  features: PlanFeature[];
}

export interface CapturedPlan {
  tagline: string;
  credits: {
    amount: number;
    label: string;
    tooltip?: string;
    promoItems?: Array<{ prefix: string; text: string; isBold: boolean }>;
  };
  mainFeatures: PlanFeature[];
  unlimitedAccess: PlanUnlimitedAccess;
}

export const PRICING_PLAN_VERSION = "v45.0.0";

/** The complete captured plans, verbatim (free + pro only — see the file header). */
export const PRICING_PLANS_TREE: Record<"free" | "pro", CapturedPlan> = {
  free: {
    tagline: "Get started with AI content creation",
    credits: { amount: 0, label: "Limited daily credits" },
    mainFeatures: [
      { id: "access-models", text: "Access to selected models only", status: "limited", tooltip: "Access to selected video and image models" },
      { id: "concurrent", text: "Concurrent generations", status: "excluded" },
      { id: "all-features", text: "Access to all features", status: "excluded" },
      { id: "early-access", text: "Early access to advanced AI features", status: "excluded" },
      { id: "discount-credits", text: "Discount for extra credits", status: "excluded" },
      { id: "one-more-unlimited", text: "Turn one more model into 365 Unlimited", status: "excluded" },
    ],
    unlimitedAccess: {
      title: "UNLIMITED ACCESS",
      features: [
        { id: "image-gen", text: "Unlimited Image generations", status: "excluded" },
        { id: "nano-banana", text: "Unlimited Nano Banana", status: "excluded" },
        { id: "flux2-flex", text: "Unlimited FLUX.2 Flex", status: "excluded" },
        { id: "seedream-4-5", text: "Unlimited Seedream 4.5", status: "excluded" },
        { id: "minimax-hailuo", text: "Unlimited Minimax Hailuo 2.3 Fast", status: "excluded" },
        { id: "nano-banana-pro", text: "Unlimited Nano Banana Pro", status: "excluded" },
        { id: "kling-2-6", text: "Unlimited Kling 2.6", status: "excluded" },
      ],
    },
  },
  pro: {
    tagline: "For consistent and easy AI content creation",
    credits: {
      amount: 1000,
      label: "credits/mo.",
      tooltip: "~4800 images or ~200 videos or ~60 character generations",
      promoItems: [
        { prefix: "= 600", text: "Nano Banana Pro Generations", isBold: true },
        { prefix: "~ 200", text: " Kling 3.0 videos", isBold: true },
      ],
    },
    mainFeatures: [
      { id: "concurrent", text: "Parallel generations: up to 3 Videos, 4 Images", status: "included", tooltip: "Run up to 3 videos and 4 image generations simultaneously" },
      { id: "feature-1781742504420", text: "Access to all Seedance models", status: "included" },
      { id: "access-models", text: "Access to all models & features", status: "included", tooltip: "Access to all video and image models, including premium models" },
      { id: "early-access", text: "Early access to advanced AI features", status: "included", tooltip: "Get early access to new AI models and features before general release" },
      { id: "feature-1782583532564", text: "Access to unlimited marketplace", status: "included" },
      { id: "lowest-cost", text: "Lowest cost per credit", status: "excluded" },
    ],
    unlimitedAccess: {
      title: "365-DAY UNLIMITED & FREE GENS ",
      features: [
        { id: "feature-soul-v2-cinema", text: "Soul V2 & Cinema", status: "included", badges: [{ label: "3,000 FREE GENS", color: "primary" }], tooltip: "Free Gens for Soul V2 and Soul Cinema Studio\nBuy until: Oct 18\nAvailable on web" },
        { id: "feature-seedream-5-lite", text: "Seedream 5.0 Lite", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for Seedream 5.0 lite (2K/3K)\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
        { id: "feature-flux2-pro", text: "Flux.2 Pro (1K)", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for Flux.2 Pro (1K)\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
        { id: "seedream-4-5", text: "Seedream 4.5", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for Seedream 4.5 (2K/4K)\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
        { id: "nano-banana", text: "Nano Banana", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for Nano Banana\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
        { id: "feature-kling-o1", text: "Kling O1 Image", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for Kling O1 Image\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
        { id: "feature-gpt-image", text: "GPT Image", status: "included", badges: [{ label: "365 UNLIMITED", color: "primary" }], tooltip: "Get unlimited generations for GPT Image\nBuy until: Oct 18\nAvailable for 1 year after purchase on web" },
      ],
    },
  },
};
