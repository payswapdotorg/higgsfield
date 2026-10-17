"use client";

import * as React from "react";
import { Coins, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { UpgradeModalContext } from "@/components/studio/upgrade-modal";
import { useCreateGeneration, useFreeGens, useUser } from "@/hooks/api";
import { getModel } from "@/lib/pricing";
import { selectCost, useComposer } from "@/store/composer";

interface GenerateBarProps {
  onNeedUpgrade: (context: UpgradeModalContext) => void;
}

export function GenerateBar({ onNeedUpgrade }: GenerateBarProps) {
  const mode = useComposer((s) => s.mode);
  const prompt = useComposer((s) => s.prompt);
  const modelId = useComposer((s) => s.modelId);
  const resolution = useComposer((s) => s.resolution);
  const aspectRatio = useComposer((s) => s.aspectRatio);
  const durationSeconds = useComposer((s) => s.durationSeconds);
  const motion = useComposer((s) => s.motion);
  const steps = useComposer((s) => s.steps);
  const projectId = useComposer((s) => s.projectId);

  const cost = useComposer(selectCost);
  const model = getModel(modelId);

  const { data: user } = useUser();
  const { data: freeGens } = useFreeGens();
  const createGeneration = useCreateGeneration();

  const canGenerate = prompt.trim().length > 0;
  const pending = createGeneration.isPending;

  const breakdown = [
    `${cost} credits`,
    model?.name ?? modelId,
    resolution,
    mode === "video" ? `${durationSeconds}s` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const handleGenerate = () => {
    if (!canGenerate || pending) return;

    const credits = user?.credits ?? 0;
    if (credits < cost) {
      onNeedUpgrade({ requiredCredits: cost - credits });
      return;
    }

    createGeneration.mutate({
      project_id: projectId,
      mode,
      prompt: prompt.trim(),
      model: modelId,
      resolution,
      aspect_ratio: aspectRatio,
      duration_seconds: durationSeconds,
      motion,
      steps,
    });
  };

  const freeGensRemaining = freeGens?.free_gens_remaining;

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      {/* Cost breakdown */}
      <div className="flex min-w-0 flex-col gap-0.5">
        <p className="truncate text-xs text-zinc-400" aria-live="polite">
          {breakdown}
        </p>
        {typeof freeGensRemaining === "number" ? (
          <p className="text-xs text-zinc-500">
            {freeGensRemaining} free{" "}
            {freeGensRemaining === 1 ? "generation" : "generations"} remaining
          </p>
        ) : null}
      </div>

      {/* GENERATE */}
      <div className="flex shrink-0 items-center">
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={!canGenerate || pending}
                  aria-label={
                    canGenerate
                      ? `Generate for ${cost} credits`
                      : "Describe a scene first"
                  }
                  className="h-11 gap-2 rounded-full bg-white px-6 text-xs font-semibold uppercase tracking-wide text-black hover:bg-zinc-200 disabled:opacity-40 sm:px-8 sm:text-sm"
                >
                  {pending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Coins className="size-4" aria-hidden="true" />
                  )}
                  Generate
                  <span className="tabular-nums">{cost}</span>
                </Button>
              </span>
            </TooltipTrigger>
            {!canGenerate ? (
              <TooltipContent
                side="top"
                className="border-zinc-800 bg-zinc-900 text-zinc-200"
              >
                Describe a scene first
              </TooltipContent>
            ) : null}
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
