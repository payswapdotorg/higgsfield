"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Loader2,
  MoreVertical,
  Play,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { api, ApiError } from "@/lib/api";
import { MODEL_CATALOG, presetFor } from "@/lib/catalog";
import type { JobJson } from "@/lib/job-shape";
import { useInvalidateJobQueries } from "@/hooks/use-trash-count";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

/**
 * Generation result card (HF-W2 §3.3): thumbnail, status chip (queued spinner / processing /
 * failed error), credit cost badge, notices badge, video badge, and the per-card action menu
 * (publish / retry / trash).
 */
export function JobCard({ job, showActions = true }: { job: JobJson; showActions?: boolean }) {
  const invalidate = useInvalidateJobQueries();
  const setUpgradeOpen = useUiStore((s) => s.setUpgradeOpen);
  const [busy, setBusy] = useState(false);
  const fundedByFree = job.credits_spent.some((s) => s.pool.startsWith("free_gens:"));

  const trash = async () => {
    setBusy(true);
    try {
      await api(`/api/jobs/${job.id}`, { method: "DELETE" });
      await invalidate();
      toast.success("Moved to trash");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    setBusy(true);
    try {
      await api(`/api/jobs/${job.id}/publish`, { method: "POST" });
      await invalidate();
      toast.success("Published to community");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  const retry = async () => {
    setBusy(true);
    try {
      const { width, height } = presetFor(
        job.aspect_ratio as "3:4" | "16:9" | "1:1",
        job.resolution as "1k" | "2k"
      );
      await api(`/api/jobs/${job.model_version}`, {
        method: "POST",
        body: {
          params: {
            prompt: job.prompt,
            aspect_ratio: job.aspect_ratio,
            resolution: job.resolution,
            batch_size: job.batch_size,
            is_storyboard: false,
            is_zoom_control: false,
            use_unlim: false,
            width,
            height,
            input_images: job.input_images,
          },
          use_unlim: false,
        },
      });
      await invalidate();
      toast.success("Generation queued");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setUpgradeOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
      aria-label={`Generation: ${job.prompt.slice(0, 60)}`}
    >
      <div
        className="relative w-full overflow-hidden bg-muted"
        style={{ aspectRatio: `${job.width} / ${job.height}` }}
      >
        {job.status === "done" && job.asset_url ? (
          // Local fixture assets (plain img is fine; the no-img-element rule is off in this config).
          <img
            src={job.asset_url}
            alt={job.prompt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
        ) : job.status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
            <p className="text-xs text-muted-foreground line-clamp-3">{job.error ?? "Generation failed"}</p>
            {showActions && (
              <Button size="sm" variant="secondary" onClick={() => void retry()} disabled={busy}>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden /> Retry
              </Button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {job.status === "queued" ? (
              <>
                <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">Queued…</span>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">Processing…</span>
                <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label="Generating">
                  <div className="h-full w-1/3 animate-[progressslide_1.2s_ease-in-out_infinite] rounded-full bg-foreground/60" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Status chip */}
        {(job.status === "queued" || job.status === "processing") && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            {job.status === "queued" ? (
              <Clock className="h-3 w-3" aria-hidden />
            ) : (
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
            )}
            {job.status === "queued" ? "Queued" : "Processing"}
          </span>
        )}
        {job.status === "failed" && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-destructive/90 px-2 py-0.5 text-[11px] font-medium text-white">
            <AlertTriangle className="h-3 w-3" aria-hidden /> Failed
          </span>
        )}

        {/* Cost badge */}
        {job.cost > 0 && (
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur",
              fundedByFree ? "bg-[var(--signal)]/90 text-white" : "bg-background/85"
            )}
          >
            {fundedByFree ? "FREE" : `${job.cost} cr`}
          </span>
        )}

        {/* Video badge */}
        {job.kind === "video" && job.status === "done" && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            <Play className="h-3 w-3" aria-hidden /> VIDEO
          </span>
        )}

        {/* Notices badge (§1e Temporary Issues) */}
        {job.notices.length > 0 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[11px] font-medium text-black">
                  <AlertTriangle className="h-3 w-3" aria-hidden />
                  {job.notices[0]?.badge?.label ?? "Notice"}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-48 text-xs">
                {job.notices[0]?.badge?.tooltip ?? ""}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Actions menu */}
        {showActions && job.status !== "failed" && (
          <div className="absolute right-2 top-9 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-7 w-7 rounded-full"
                  aria-label="Generation actions"
                  disabled={busy}
                >
                  <MoreVertical className="h-3.5 w-3.5" aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {job.status === "done" && !job.published_at && (
                  <DropdownMenuItem onClick={() => void publish()} className="cursor-pointer">
                    <Send className="mr-2 h-4 w-4" aria-hidden /> Publish to community
                  </DropdownMenuItem>
                )}
                {job.status === "done" && job.published_at && (
                  <DropdownMenuItem disabled>
                    <Send className="mr-2 h-4 w-4" aria-hidden /> Published
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => void trash()} className="cursor-pointer text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Move to trash
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="space-y-1.5 p-3">
        <p className="line-clamp-2 min-h-8 text-xs leading-snug text-foreground/90">{job.prompt}</p>
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium text-foreground/80">{job.model_label}</span>
          <span className="shrink-0 tabular-nums">
            {job.aspect_ratio} · {job.resolution}
            {job.batch_size > 1 ? ` · ×${job.batch_size}` : ""}
          </span>
        </div>
      </div>
    </article>
  );
}
