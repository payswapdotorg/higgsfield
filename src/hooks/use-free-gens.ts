"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface FreeGensResponse {
  eligible: boolean;
  can_skip: boolean;
  rewards: {
    free_generations: {
      amount: number;
      job_set_type: string;
      model_label: string;
      claimed: boolean;
      expires_at: string | null;
      /** Additive clone-side key (disclosed) — used for the studio hint. */
      remaining: number;
    };
  } | null;
  existing: unknown;
  flows: unknown[];
}

export function useFreeGens(enabled = true) {
  return useQuery({
    queryKey: ["free-gens"],
    queryFn: () => api<FreeGensResponse>("/api/user/free-gens/v2"),
    enabled,
    retry: false,
  });
}
