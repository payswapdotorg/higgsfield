"use client";

import { ImagePlus, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MAX_REFERENCES } from "@/lib/pricing";

export function ReferencesTab() {
  return (
    <div className="p-4 sm:p-5">
      <div
        role="region"
        aria-label="Reference uploads"
        className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 p-10 text-center"
      >
        <ImagePlus className="size-8 text-zinc-500" aria-hidden="true" />
        <p className="text-sm font-medium text-zinc-200">
          Drop reference images here
        </p>
        <p className="text-xs text-zinc-500">
          0/{MAX_REFERENCES} references used
        </p>
        <TooltipProvider delayDuration={200}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled
                  className="mt-1 border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-300"
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  Upload
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="border-zinc-800 bg-zinc-900 text-zinc-200"
            >
              Reference uploads land in Wave 2
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
