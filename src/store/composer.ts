"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  computeCreditCost,
  DEFAULT_VIDEO_CONFIG,
  getModel,
  type AspectRatio,
  type GenerationMode,
} from "@/lib/pricing";

export interface FilmSetupState {
  camera: string;
  palette: string;
  lighting: string;
}

/** The slice of ComposerState that is persisted to localStorage. */
export interface PersistedComposerState {
  mode: GenerationMode;
  prompt: string;
  modelId: string;
  resolution: string;
  aspectRatio: AspectRatio;
  durationSeconds: number;
  motion: boolean;
  steps: number;
  filmSetup: FilmSetupState;
  projectId: string | null;
}

export interface ComposerState extends PersistedComposerState {
  // Actions (not persisted)
  setMode: (mode: GenerationMode) => void;
  setPrompt: (prompt: string) => void;
  setModel: (modelId: string) => void;
  setResolution: (resolution: string) => void;
  setAspectRatio: (aspectRatio: AspectRatio) => void;
  setDuration: (seconds: number) => void;
  setMotion: (motion: boolean) => void;
  setSteps: (steps: number) => void;
  setFilmSetup: (key: keyof FilmSetupState, value: string) => void;
  setProjectId: (projectId: string | null) => void;
}

export const DEMO_PROMPT =
  "A serene mountain lake at sunrise, mist rising off the water, cinematic photography";

const DEFAULT_MODEL_BY_MODE: Record<GenerationMode, string> = {
  video: "cinema-studio-4",
  image: "nano-banana-pro",
};

export const useComposer = create<ComposerState>()(
  persist<ComposerState, [], [], PersistedComposerState>(
    (set) => ({
      mode: DEFAULT_VIDEO_CONFIG.mode,
      prompt: DEMO_PROMPT,
      modelId: DEFAULT_VIDEO_CONFIG.modelId,
      resolution: DEFAULT_VIDEO_CONFIG.resolution,
      aspectRatio: DEFAULT_VIDEO_CONFIG.aspectRatio,
      durationSeconds: DEFAULT_VIDEO_CONFIG.durationSeconds,
      motion: DEFAULT_VIDEO_CONFIG.motion,
      steps: DEFAULT_VIDEO_CONFIG.steps,
      filmSetup: {
        camera: "Auto",
        palette: "Auto",
        lighting: "Auto",
      },
      projectId: null,

      setMode: (mode) =>
        set((state) => {
          const model = getModel(state.modelId);
          // Swap to the mode's default model when the current model's kind
          // no longer matches the active mode.
          const modelId =
            model && model.kind === mode
              ? state.modelId
              : DEFAULT_MODEL_BY_MODE[mode];
          return { mode, modelId };
        }),

      setPrompt: (prompt) => set({ prompt }),

      setModel: (modelId) => set({ modelId }),

      setResolution: (resolution) => set({ resolution }),

      setAspectRatio: (aspectRatio) => set({ aspectRatio }),

      setDuration: (durationSeconds) => set({ durationSeconds }),

      setMotion: (motion) => set({ motion }),

      setSteps: (steps) => set({ steps }),

      setFilmSetup: (key, value) =>
        set((state) => ({
          filmSetup: { ...state.filmSetup, [key]: value },
        })),

      setProjectId: (projectId) => set({ projectId }),
    }),
    {
      name: "hf-composer-v1",
      storage: createJSONStorage<PersistedComposerState>(() => localStorage),
      // Hydration happens explicitly on the client (see studio layout) so
      // SSR markup and the first client render stay in sync.
      skipHydration: true,
      partialize: (state): PersistedComposerState => ({
        mode: state.mode,
        prompt: state.prompt,
        modelId: state.modelId,
        resolution: state.resolution,
        aspectRatio: state.aspectRatio,
        durationSeconds: state.durationSeconds,
        motion: state.motion,
        steps: state.steps,
        filmSetup: state.filmSetup,
        projectId: state.projectId,
      }),
    },
  ),
);

/**
 * Derives the GENERATE credit cost for the current composer state using the
 * shared pricing contract.
 */
export function selectCost(state: ComposerState): number {
  return computeCreditCost({
    mode: state.mode,
    modelId: state.modelId,
    resolution: state.resolution,
    durationSeconds: state.durationSeconds,
    motion: state.motion,
    steps: state.steps,
  });
}
