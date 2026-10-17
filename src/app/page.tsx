"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, Image as ImageIcon, Loader2, Sparkles, Video, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SessionGate } from "@/components/session-gate";
import { JobCard } from "@/components/generations/job-card";
import { useJobs } from "@/hooks/use-jobs";
import { useFolders } from "@/hooks/use-folders";
import { useFreeGens } from "@/hooks/use-free-gens";
import { useSession } from "@/hooks/use-session";
import { useInvalidateJobQueries } from "@/hooks/use-trash-count";
import { api, ApiError } from "@/lib/api";
import {
  MODEL_CATALOG,
  presetFor,
  noticesForJobSetType,
  type AspectRatio,
} from "@/lib/catalog";
import { useStudioStore } from "@/store/studio";
import { useUiStore } from "@/store/ui";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  "Cinematic portrait of a woman in a neon-lit rainy Tokyo street at night, holding a transparent umbrella",
  "Astronaut standing in a vast red desert at golden hour, dramatic long shadow, film still",
  "Ballerina mid-leap surrounded by an explosion of flour, black studio background, dramatic rim lighting",
  "Retro-futuristic space station interior with orange sunset light through huge panoramic windows",
];

const ASPECTS: Array<{ value: AspectRatio; label: string; box: string }> = [
  { value: "3:4", label: "3:4", box: "h-8 w-6" },
  { value: "16:9", label: "16:9", box: "h-5 w-8" },
  { value: "1:1", label: "1:1", box: "h-7 w-7" },
];

function Studio() {
  const { modelSlug, aspect, resolution, batchSize, folderId, prompt, setModel, setAspect, setResolution, setBatchSize, setFolderId, setPrompt } =
    useStudioStore();
  const model = MODEL_CATALOG[modelSlug];
  const cost = model.creditCost * batchSize;
  const setUpgradeOpen = useUiStore((s) => s.setUpgradeOpen);
  const invalidate = useInvalidateJobQueries();
  const { data: session } = useSession();
  const { data: foldersData } = useFolders(!!session?.user);
  const { data: freeGens } = useFreeGens(!!session?.user);
  const jobsQuery = useJobs({ limit: 12 });
  const [generating, setGenerating] = useState(false);

  const freeRemaining =
    freeGens?.rewards?.free_generations.job_set_type === model.jobSetType
      ? freeGens.rewards.free_generations.remaining
      : 0;

  const generate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    try {
      const { width, height } = presetFor(aspect, resolution);
      const qs = folderId ? `?folder_id=${encodeURIComponent(folderId)}` : "";
      await api(`/api/jobs/${modelSlug}${qs}`, {
        method: "POST",
        body: {
          params: {
            prompt: prompt.trim(),
            aspect_ratio: aspect,
            resolution,
            batch_size: batchSize,
            is_storyboard: false,
            is_zoom_control: false,
            use_unlim: false,
            width,
            height,
            input_images: [],
          },
          use_unlim: false,
        },
      });
      setPrompt("");
      await invalidate();
      toast.success("Generation queued");
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        setUpgradeOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      }
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-10 py-4 lg:py-8">
      {/* Model picker */}
      <section aria-label="Model picker">
        <div className="flex flex-wrap gap-2">
          {Object.values(MODEL_CATALOG).map((m) => {
            const notice = noticesForJobSetType(m.jobSetType).length > 0;
            const active = m.slug === modelSlug;
            return (
              <button
                key={m.slug}
                type="button"
                onClick={() => setModel(m.slug)}
                aria-pressed={active}
                className={cn(
                  "flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground/80 hover:border-foreground/25 hover:text-foreground"
                )}
              >
                {m.kind === "image" ? (
                  <ImageIcon className="h-4 w-4" aria-hidden />
                ) : (
                  <Video className="h-4 w-4" aria-hidden />
                )}
                {m.label}
                <span className={cn("text-xs tabular-nums", active ? "text-primary-foreground/70" : "text-muted-foreground")}>
                  {m.creditCost} cr
                </span>
                {notice && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold text-black"
                    title="Temporary Issues — this model may fail or take longer"
                  >
                    <AlertTriangle className="h-3 w-3" aria-hidden />
                    Temporary Issues
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Prompt */}
      <section aria-label="Prompt">
        <Card className="border-border bg-card p-1">
          <label htmlFor="studio-prompt" className="sr-only">
            Describe your generation
          </label>
          <Textarea
            id="studio-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your shot — style, subject, lighting, camera move…"
            className="min-h-32 resize-none border-0 bg-transparent px-4 py-4 text-base shadow-none focus-visible:ring-0"
            maxLength={4000}
          />
          <div className="flex items-center justify-between gap-2 px-4 pb-3 pt-1">
            <span className="text-[11px] text-muted-foreground tabular-nums">{prompt.length}/4000</span>
            {prompt && (
              <button
                type="button"
                onClick={() => setPrompt("")}
                className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Clear
              </button>
            )}
          </div>
        </Card>
        <div className="mt-3 flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setPrompt(t)}
              className="max-w-full truncate rounded-full border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-foreground/25 hover:text-foreground"
            >
              {t.split(",")[0]}…
            </button>
          ))}
        </div>
      </section>

      {/* Controls */}
      <section aria-label="Generation settings" className="flex flex-wrap items-end gap-6">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Aspect ratio</Label>
          <div className="flex gap-2" role="group" aria-label="Aspect ratio">
            {ASPECTS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setAspect(a.value)}
                aria-pressed={aspect === a.value}
                className={cn(
                  "flex w-16 flex-col items-center gap-1.5 rounded-lg border px-2 py-2 transition-colors",
                  aspect === a.value
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                )}
              >
                <span className={cn("rounded-[3px] border-2", a.box, aspect === a.value ? "border-foreground" : "border-current")} />
                <span className="text-[11px] font-medium tabular-nums">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Resolution</Label>
          <div className="flex overflow-hidden rounded-lg border border-border" role="group" aria-label="Resolution">
            {(["1k", "2k"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setResolution(r)}
                aria-pressed={resolution === r}
                className={cn(
                  "px-4 py-2 text-sm font-medium uppercase transition-colors",
                  resolution === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Batch</Label>
          <div className="flex gap-1" role="group" aria-label="Batch size">
            {[1, 2, 3, 4].map((n) => {
              const disabled = n > model.maxBatch;
              return (
                <button
                  key={n}
                  type="button"
                  disabled={disabled}
                  onClick={() => setBatchSize(n)}
                  aria-pressed={batchSize === n}
                  title={disabled ? `${model.label} supports up to ${model.maxBatch}` : undefined}
                  className={cn(
                    "h-9 w-9 rounded-lg border text-sm font-medium tabular-nums transition-colors",
                    disabled && "cursor-not-allowed opacity-30",
                    batchSize === n
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  )}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <div className="min-w-44 space-y-2">
          <Label htmlFor="folder-select" className="text-xs text-muted-foreground">
            Save to folder
          </Label>
          <Select value={folderId ?? "none"} onValueChange={(v) => setFolderId(v === "none" ? null : v)}>
            <SelectTrigger id="folder-select" className="w-full bg-card" aria-label="Folder">
              <SelectValue placeholder="No folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No folder</SelectItem>
              {(foldersData?.folders ?? []).map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Generate row */}
      <section aria-label="Generate" className="flex items-center justify-between gap-4">
        {freeRemaining > 0 ? (
          <Badge className="gap-1.5 rounded-full border border-[var(--signal)]/40 bg-[var(--signal)]/10 text-[var(--signal)] hover:bg-[var(--signal)]/10">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {freeRemaining} free generation{freeRemaining === 1 ? "" : "s"} left
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">
            {model.description}
          </span>
        )}
        <Button
          size="lg"
          className="px-8 font-semibold"
          disabled={!prompt.trim() || generating}
          onClick={() => void generate()}
        >
          {generating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Zap className="mr-2 h-4 w-4" aria-hidden />
          )}
          Generate {cost}
        </Button>
      </section>

      {/* Latest generations */}
      <section aria-label="Latest generations" className="space-y-3 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Latest generations
          </h2>
          <Link href="/generate/all" className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
            View all →
          </Link>
        </div>
        {jobsQuery.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : jobsQuery.data?.jobs?.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jobsQuery.data.jobs.slice(0, 8).map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No generations yet — describe your shot above and hit <span className="font-semibold text-foreground">Generate {cost}</span>.
          </p>
        )}
      </section>
    </div>
  );
}

export default function Home() {
  return (
    <SessionGate>
      <Studio />
    </SessionGate>
  );
}
