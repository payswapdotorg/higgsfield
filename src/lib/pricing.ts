/**
 * HF Studio — shared generation pricing contract (Wave 1).
 *
 * Credit cost constants mirrored from the captured Cinema Studio surface:
 * default video config (Cinema Studio 4.0 / 1080p / 16:9 / 5s / motion On /
 * steps 1) renders a GENERATE cost of exactly 80 credits.
 *
 * Determinism: constants only — no wall-clock, no randomness.
 */

export type GenerationMode = "image" | "video";

export interface ModelDef {
  id: string;
  name: string;
  kind: GenerationMode;
  baseCredits: number;
  blurb: string;
}

export const MODELS: ModelDef[] = [
  {
    id: "cinema-studio-4",
    name: "Cinema Studio 4.0",
    kind: "video",
    baseCredits: 80,
    blurb: "Flagship cinematic video model",
  },
  {
    id: "seedance-4k",
    name: "Seedance 4K",
    kind: "video",
    baseCredits: 100,
    blurb: "Ultra-high-definition motion",
  },
  {
    id: "higgsfield-soul",
    name: "Higgsfield Soul",
    kind: "video",
    baseCredits: 90,
    blurb: "Emotion-first character performance",
  },
  {
    id: "wan-3-0",
    name: "WAN 3.0",
    kind: "video",
    baseCredits: 60,
    blurb: "Fast iterative drafts",
  },
  {
    id: "genjutsu",
    name: "Genjutsu",
    kind: "video",
    baseCredits: 70,
    blurb: "Stylized anime motion",
  },
  {
    id: "kling",
    name: "Kling",
    kind: "video",
    baseCredits: 55,
    blurb: "Reliable all-round videogen",
  },
  {
    id: "nano-banana-pro",
    name: "Nano Banana Pro",
    kind: "image",
    baseCredits: 10,
    blurb: "Photoreal stills in seconds",
  },
];

export interface ResolutionDef {
  id: string;
  multiplier: number;
}

export const RESOLUTIONS: ResolutionDef[] = [
  { id: "720p", multiplier: 0.5 },
  { id: "1080p", multiplier: 1 },
  { id: "4k", multiplier: 2.2 },
];

export const ASPECT_RATIOS = ["16:9", "9:16", "1:1", "4:5"] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export interface DurationDef {
  seconds: number;
  multiplier: number;
}

export const DURATIONS: DurationDef[] = [
  { seconds: 5, multiplier: 1 },
  { seconds: 10, multiplier: 1.9 },
];

export interface StepDef {
  steps: number;
  multiplier: number;
}

export const STEP_OPTIONS: StepDef[] = [
  { steps: 1, multiplier: 1 },
  { steps: 2, multiplier: 1.5 },
  { steps: 4, multiplier: 2 },
];

export const MAX_REFERENCES = 50;

export interface CostInput {
  mode: GenerationMode;
  modelId: string;
  resolution: string;
  durationSeconds: number;
  motion: boolean;
  steps: number;
}

export function getModel(id: string): ModelDef | undefined {
  return MODELS.find((m) => m.id === id);
}

export function computeCreditCost(input: CostInput): number {
  const model = getModel(input.modelId) ?? MODELS[0];
  const resolution =
    RESOLUTIONS.find((r) => r.id === input.resolution) ?? RESOLUTIONS[1];
  const steps =
    STEP_OPTIONS.find((s) => s.steps === input.steps) ?? STEP_OPTIONS[0];

  if (input.mode === "image") {
    return Math.round(model.baseCredits * resolution.multiplier * steps.multiplier);
  }

  const duration =
    DURATIONS.find((d) => d.seconds === input.durationSeconds) ?? DURATIONS[0];
  // Motion is a quality toggle — cost-neutral so the captured default
  // (Cinema Studio 4.0 / 1080p / 5s / On) prices at exactly 80 credits.
  return Math.round(
    model.baseCredits * resolution.multiplier * duration.multiplier * steps.multiplier,
  );
}

export const DEFAULT_VIDEO_CONFIG = {
  mode: "video" as GenerationMode,
  modelId: "cinema-studio-4",
  resolution: "1080p",
  aspectRatio: "16:9" as AspectRatio,
  durationSeconds: 5,
  motion: true,
  steps: 1,
};

export const DEFAULT_IMAGE_CONFIG = {
  mode: "image" as GenerationMode,
  modelId: "nano-banana-pro",
  resolution: "1080p",
  aspectRatio: "1:1" as AspectRatio,
  steps: 1,
};
