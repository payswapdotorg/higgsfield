"use client";

import { create } from "zustand";
import type { AspectRatio, Resolution } from "@/lib/catalog";

interface StudioState {
  modelSlug: string;
  aspect: AspectRatio;
  resolution: Resolution;
  batchSize: number;
  folderId: string | null;
  prompt: string;
  setModel: (slug: string) => void;
  setAspect: (aspect: AspectRatio) => void;
  setResolution: (resolution: Resolution) => void;
  setBatchSize: (n: number) => void;
  setFolderId: (id: string | null) => void;
  setPrompt: (prompt: string) => void;
}

export const useStudioStore = create<StudioState>((set) => ({
  modelSlug: "nano-banana-2",
  aspect: "3:4",
  resolution: "1k",
  batchSize: 1,
  folderId: null,
  prompt: "",
  setModel: (modelSlug) =>
    set((state) => ({
      modelSlug,
      // Clamp batch to the new model's maximum.
      batchSize: Math.min(state.batchSize, modelSlug === "nano-banana-2" ? 4 : 1),
    })),
  setAspect: (aspect) => set({ aspect }),
  setResolution: (resolution) => set({ resolution }),
  setBatchSize: (batchSize) => set({ batchSize }),
  setFolderId: (folderId) => set({ folderId }),
  setPrompt: (prompt) => set({ prompt }),
}));
