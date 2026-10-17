"use client";

import { create } from "zustand";

interface UiState {
  upgradeOpen: boolean;
  setUpgradeOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  upgradeOpen: false,
  setUpgradeOpen: (upgradeOpen) => set({ upgradeOpen }),
}));
