"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Clapperboard,
  Clock,
  Film,
  History,
  Loader2,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterBuilder } from "@/components/studios/influencer/character-builder";
import { useSession } from "@/hooks/use-session";
import { useWallet } from "@/hooks/use-wallet";
import { useUiStore } from "@/store/ui";
import { api, ApiError } from "@/lib/api";
import type { CharacterJson } from "@/lib/character-shape";
import type { JobJson } from "@/lib/job-shape";
import {
  MOTION_PRESETS,
  defaultSpec,
  type InfluencerSpec,
  type MotionPreset,
} from "@/lib/influencer-options";
import { modelHue } from "@/lib/model-registry";
import { cn } from "@/lib/utils";

/**
 * /ai-influencer-studio — the AI Influencer surface (private, StudioGate-wrapped),
 * wired to the HF-W7 backend (characters CRUD + sheet pipeline + motion pipeline).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json,
 * root "AI Influencer | Higgsfield", 813 a11y nodes):
 * - workspace region 301 'AI Influencer workspace' with tablist 303 'Page view'
 *   (tabs 304 'Explore' / 307 'History') — the History tab now renders the active
 *   character's linked jobs (image + video cards, newest first, status badges);
 * - hero: heading 322 'YOUR INFLUENCER, YOUR VIRAL HIT' (lines 323/324) +
 *   paragraph 326 'Build your AI influencer with the face, body, and style you
 *   want. Choose a motion preset and watch them perform it in a video ready to
 *   share' (verbatim);
 * - creation mode: tablist 2078 with tabs 124 'Create Influencer' / 126 'Motion';
 * - preset source tablist 328 with tabs 329 'AI Influencers' / 333 'Higgsfield
 *   Presets' / 337 'Community Trends' — kept as FILTERS: 'AI Influencers' lists
 *   the user's own characters (GET /api/characters), the two uncaptured sources
 *   render honest one-line empty states;
 * - preset articles 341-395 ('AI Influencer 38'… with 'View character sheet' /
 *   'Recreate') — the live CDN cards were not captured, so that gallery slot is
 *   taken by the user's own character library (click = view/select, i.e. the
 *   captured 'View character sheet' affordance; '+ New character' = create);
 * - settings panel: complementary 116 'AI Influencer settings' → see
 *   character-builder.tsx for its full evidence citations;
 * - credit cost: generic 2252 '1.125 credits' (the Generate action's badge).
 *
 * spec: clone-side choices (disclosed): the creation-mode tabs (ev: tablist 2078)
 * render at the top of the workspace (the live DOM nests them in the settings
 * panel) because the Motion tab is a workspace view here — the preset tiles +
 * video stage act on the active character; motion presets are the curated
 * MOTION_PRESETS library (reference list uncaptured — hero copy 326 confirms
 * presets exist) at 5 credits each; the wallet-balance chip mirrors the app-shell
 * topbar (useWallet) so burns are visible in-surface; polling follows the
 * use-jobs.ts law (2s interval, 1.15^n backoff cap 10s, stop when no queued/
 * processing jobs remain) but polls GET /api/characters/{id} — the character
 * detail route, whose GET also thaws the serverless job queue.
 */

const PRESET_SOURCES = ["ai-influencers", "higgsfield-presets", "community-trends"] as const;

const PRESET_SOURCE_LABELS: Record<(typeof PRESET_SOURCES)[number], string> = {
  "ai-influencers": "AI Influencers",
  "higgsfield-presets": "Higgsfield Presets",
  "community-trends": "Community Trends",
};

/** History-card labels for the three influencer job types (job_set_type → display). */
const JOB_TYPE_LABELS: Record<string, string> = {
  influencer_portrait: "Portrait",
  influencer_fullbody: "Full body",
  influencer_motion: "Motion video",
};

const MOTION_COST = 5; // spec: curated clone-side cost (src/lib/character-shape.ts)

interface CharacterDetailResponse {
  character: CharacterJson;
  jobs: JobJson[];
}

/** Stable short date (explicit locale → SSR/client render agreement). */
function formatDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
      new Date(iso)
    );
  } catch {
    return iso.slice(0, 10);
  }
}

function isJobActive(job: JobJson | null | undefined): boolean {
  return job?.status === "queued" || job?.status === "processing";
}

/** 402 {detail, needed, available} → the honest toast (mission law) + upgrade modal (app convention). */
function toastInsufficientCredits(err: ApiError) {
  const body = (err.body ?? {}) as { needed?: number; available?: number };
  toast.error(
    `Insufficient credits — needed ${body.needed ?? "?"}, available ${body.available ?? "?"}`
  );
}

// ── Small display pieces ──────────────────────────────────────────────────────

/** One character-sheet tile: portrait (1:1) or full body (2:3). */
function SheetTile({
  label,
  aspect,
  aspectClass,
  job,
  assetUrl,
  onRetry,
  busy,
}: {
  label: string;
  aspect: string;
  aspectClass: string;
  job: JobJson | null;
  assetUrl: string | null;
  onRetry: () => void;
  busy: boolean;
}) {
  const inFlight = isJobActive(job);
  const failed = job?.status === "failed";
  return (
    <figure
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label={`${label} render`}
    >
      <div className={cn("relative w-full bg-muted", aspectClass)}>
        {inFlight ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {job?.status === "queued" ? (
              <>
                <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">Queued…</span>
              </>
            ) : (
              <>
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
                <span className="text-xs text-muted-foreground">Rendering…</span>
              </>
            )}
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              {job?.status === "queued" ? (
                <Clock className="h-3 w-3" aria-hidden />
              ) : (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              )}
              {job?.status === "queued" ? "Queued" : "Rendering"}
            </span>
          </div>
        ) : failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
            <p className="line-clamp-3 text-xs text-muted-foreground">{job?.error ?? "Render failed"}</p>
            {/* Retry affordance = re-POST generate (a fresh 1.125-credit sheet). */}
            <Button size="sm" variant="secondary" onClick={onRetry} disabled={busy}>
              {busy ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
              ) : (
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" aria-hidden />
              )}
              Retry sheet
            </Button>
          </div>
        ) : assetUrl ? (
          // Plain img — data URI / fixture asset (the no-img-element rule is off in this config).
          <img
            src={assetUrl}
            alt={`${label} render`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground">
              No {label.toLowerCase()} yet — hit Generate
            </span>
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/80">{label}</span>
        <span className="shrink-0 tabular-nums">{aspect}</span>
      </figcaption>
    </figure>
  );
}

/** The Motion tab's video stage — the latest motion job (16:9). */
function MotionVideoStage({ job }: { job: JobJson | null }) {
  const inFlight = isJobActive(job);
  const failed = job?.status === "failed";
  return (
    <figure
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label="Motion video"
    >
      <div className="relative aspect-video w-full bg-muted">
        {job?.status === "done" && job.asset_url ? (
          <video
            src={job.asset_url}
            controls
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            aria-label="Motion video player"
          />
        ) : inFlight ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" aria-hidden />
            <span className="text-xs text-muted-foreground">Rendering motion video…</span>
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              {job?.status === "queued" ? "Queued" : "Rendering"}
            </span>
          </div>
        ) : failed ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
            <p className="line-clamp-3 text-xs text-muted-foreground">{job?.error ?? "Motion video failed"}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground">
              Pick a motion preset below to animate this character
            </span>
          </div>
        )}
      </div>
      <figcaption className="flex items-center justify-between gap-2 px-3 py-2 text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground/80">Motion video</span>
        <span className="shrink-0 tabular-nums">16:9</span>
      </figcaption>
    </figure>
  );
}

/** spec: curated motion preset tile — deterministic gradient art keyed on preset id. */
function MotionPresetTile({
  preset,
  busy,
  disabled,
  onClick,
}: {
  preset: MotionPreset;
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const hue = modelHue(preset.id);
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label={preset.label}
    >
      <div
        className="relative flex aspect-video items-end p-3"
        style={{
          background: `linear-gradient(160deg, hsl(${hue} 60% 50% / 0.5), hsl(${(hue + 45) % 360} 60% 35% / 0.15))`,
        }}
      >
        <Badge variant="secondary" className="max-w-full truncate bg-background/70 backdrop-blur-sm">
          {preset.label}
        </Badge>
      </div>
      <div className="p-3">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={onClick}
          disabled={disabled || busy}
        >
          {busy ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <Play className="mr-1.5 h-3.5 w-3.5" aria-hidden />
          )}
          Animate
          <span className="ml-1.5 tabular-nums">{MOTION_COST} credits</span>
        </Button>
      </div>
    </article>
  );
}

/** History tab card — image jobs render <img>, done video jobs render <video>. */
function HistoryJobCard({ job }: { job: JobJson }) {
  const label = JOB_TYPE_LABELS[job.job_set_type] ?? job.job_set_type;
  const inFlight = isJobActive(job);
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label={`${label} job, ${job.status}`}
    >
      <div
        className="relative w-full overflow-hidden bg-muted"
        style={{ aspectRatio: `${job.width} / ${job.height}` }}
      >
        {job.status === "done" && job.asset_url ? (
          job.kind === "video" ? (
            <video
              src={job.asset_url}
              controls
              loop
              muted
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
              aria-label={`${label} video`}
            />
          ) : (
            // Plain img — data URI / fixture asset (no-img-element rule off in this config).
            <img
              src={job.asset_url}
              alt={`${label} render`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )
        ) : inFlight ? (
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
              </>
            )}
          </div>
        ) : job.status === "failed" ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden />
            <p className="line-clamp-3 text-xs text-muted-foreground">{job.error ?? "Failed"}</p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center">
            <span className="text-xs text-muted-foreground">No asset</span>
          </div>
        )}
        {/* Status badge */}
        {inFlight && (
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
        {job.status === "done" && (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
            <Film className="h-3 w-3" aria-hidden /> Done
          </span>
        )}
        {/* Cost badge */}
        {job.cost > 0 && (
          <span className="absolute right-2 top-2 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur">
            {job.cost} cr
          </span>
        )}
      </div>
      <div className="space-y-1.5 p-3">
        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
          <span className="truncate font-medium text-foreground/80">{label}</span>
          <span className="shrink-0 tabular-nums">
            {job.aspect_ratio} · {formatDate(job.created_at)}
          </span>
        </div>
        <p className="line-clamp-2 text-xs leading-snug text-foreground/90">{job.prompt}</p>
      </div>
    </article>
  );
}

function EmptyScope({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{note}</p>
    </div>
  );
}

// ── The studio shell ─────────────────────────────────────────────────────────

export function InfluencerStudio() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const setUpgradeOpen = useUiStore((s) => s.setUpgradeOpen);
  const walletQuery = useWallet(signedIn);

  // Builder state (owned here so the character library can load a character in).
  const [spec, setSpec] = useState<InfluencerSpec>(() => defaultSpec());
  const [name, setName] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  // Studio state.
  const [pageView, setPageView] = useState<"explore" | "history">("explore");
  const [creationMode, setCreationMode] = useState<"create" | "motion">("create");
  const [presetSource, setPresetSource] = useState<(typeof PRESET_SOURCES)[number]>("ai-influencers");
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [motionBusy, setMotionBusy] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Character library (GET /api/characters).
  const libraryQuery = useQuery({
    queryKey: ["characters"],
    queryFn: () => api<{ characters: CharacterJson[] }>("/api/characters"),
    enabled: signedIn,
  });
  const characters = libraryQuery.data?.characters ?? [];

  // Character detail — the POLL route: GET returns {character, jobs} AND thaws
  // the serverless job queue (every poll advances it). Polling law mirrored
  // from use-jobs.ts: 2s interval, 1.15^n backoff capped 10s, stop when no
  // queued/processing jobs remain for this character.
  const detailQuery = useQuery({
    queryKey: ["character", activeCharacterId],
    queryFn: () => api<CharacterDetailResponse>(`/api/characters/${activeCharacterId}`),
    enabled: signedIn && !!activeCharacterId,
    refetchInterval: (query) => {
      const data = query.state.data as CharacterDetailResponse | undefined;
      if (!data?.jobs?.length) return false;
      const active = data.jobs.some((j) => j.status === "queued" || j.status === "processing");
      if (!active) return false;
      const n = Math.max(1, query.state.dataUpdateCount);
      return Math.min(2000 * Math.pow(1.15, n - 1), 10000);
    },
  });
  const character = detailQuery.data?.character ?? null;
  const jobs = detailQuery.data?.jobs ?? [];
  const latestJob = (type: string): JobJson | null => jobs.find((j) => j.job_set_type === type) ?? null;
  const portraitJob = latestJob("influencer_portrait");
  const fullBodyJob = latestJob("influencer_fullbody");
  const motionJob = latestJob("influencer_motion");

  const resetBuilder = () => {
    setSpec(defaultSpec());
    setName("");
    setReferenceImage(null);
    setActiveCharacterId(null);
  };

  /** Select a library character as active + load it into the builder. */
  const loadCharacterIntoBuilder = (c: CharacterJson) => {
    setActiveCharacterId(c.id);
    // Spec spread over defaults keeps all 19 keys even on stale/legacy rows.
    setSpec({ ...defaultSpec(), ...c.spec });
    setName(c.name === "Influencer" ? "" : c.name); // default name → empty field → placeholder
    setReferenceImage(c.reference_image);
  };

  // Auto-select the newest character once, so returning users see their sheet.
  const autoSelectedRef = useRef(false);
  useEffect(() => {
    if (autoSelectedRef.current || activeCharacterId || characters.length === 0) return;
    autoSelectedRef.current = true;
    loadCharacterIntoBuilder(characters[0]);
  }, [characters, activeCharacterId]);

  // The Generate action (ev: button 297 + node 2252 '1.125 credits'): sync the
  // builder onto the character (create when none is active, else PATCH), then
  // POST generate → the parent's detail poll picks the two queued jobs up.
  const generate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      let id = activeCharacterId;
      const trimmed = name.trim();
      if (!id) {
        const { character: created } = await api<{ character: CharacterJson }>("/api/characters", {
          method: "POST",
          body: { ...(trimmed ? { name: trimmed } : {}), spec },
        });
        id = created.id;
        setActiveCharacterId(id);
      }
      // Sync pass — the POST route accepts {name?, spec} only, so the reference
      // image rides in through this PATCH (explicit null clears it server-side).
      await api<{ character: CharacterJson }>(`/api/characters/${id}`, {
        method: "PATCH",
        body: {
          ...(trimmed ? { name: trimmed } : {}),
          spec,
          reference_image: referenceImage,
        },
      });
      const { jobs: queued } = await api<{ jobs: JobJson[] }>(`/api/characters/${id}/generate`, {
        method: "POST",
        body: {},
      });
      await queryClient.invalidateQueries({ queryKey: ["character", id] });
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(`Character sheet queued — ${queued.length} renders, 1.125 credits`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        toastInsufficientCredits(err);
        setUpgradeOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Generation failed");
      }
    } finally {
      setGenerating(false);
    }
  };

  // The Motion action (ev: hero 326): animate the active character's done
  // portrait with a preset (5 credits, spec:) → the detail poll renders the video.
  const animate = async (preset: MotionPreset) => {
    if (!activeCharacterId || motionBusy) return;
    setMotionBusy(preset.id);
    try {
      await api<{ job: JobJson }>(`/api/characters/${activeCharacterId}/motion`, {
        method: "POST",
        body: { preset_id: preset.id },
      });
      await queryClient.invalidateQueries({ queryKey: ["character", activeCharacterId] });
      await queryClient.invalidateQueries({ queryKey: ["wallet"] });
      toast.success(`Motion queued — ${preset.label}, ${MOTION_COST} credits`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        toastInsufficientCredits(err);
        setUpgradeOpen(true);
      } else {
        toast.error(err instanceof Error ? err.message : "Motion failed");
      }
    } finally {
      setMotionBusy(null);
    }
  };

  const deleteCharacter = async (id: string) => {
    setDeleting(true);
    try {
      await api(`/api/characters/${id}`, { method: "DELETE" });
      if (activeCharacterId === id) resetBuilder();
      await queryClient.invalidateQueries({ queryKey: ["characters"] });
      await queryClient.removeQueries({ queryKey: ["character", id] });
      toast.success("Character deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const confirmDeleteTarget = characters.find((c) => c.id === confirmDeleteId) ?? null;

  // Motion precondition: a selected character with a done portrait.
  const hasDonePortrait = !!character?.portrait_asset_url;
  const motionReady = !!character && hasDonePortrait;
  const sheetInFlight = isJobActive(portraitJob) || isJobActive(fullBodyJob);

  // sr-only live region: status changes (sheet / motion transitions).
  const statusParts: string[] = [];
  if (generating) statusParts.push("Queueing character sheet");
  else if (sheetInFlight) statusParts.push("Rendering character sheet");
  else if (character?.portrait_asset_url && character?.full_body_asset_url) {
    statusParts.push("Character sheet ready");
  }
  if (isJobActive(motionJob)) statusParts.push("Rendering motion video");
  else if (motionJob?.status === "done" && motionJob.asset_url) statusParts.push("Motion video ready");
  const statusMessage = statusParts.join(", ");

  return (
    <div className="mx-auto w-full max-w-7xl gap-6 space-y-6 py-2 lg:grid lg:grid-cols-[380px_1fr] lg:space-y-0 lg:py-4">
      {/* Settings panel — ev: complementary 116 'AI Influencer settings' */}
      <aside aria-label="AI Influencer settings" className="lg:sticky lg:top-20 lg:self-start">
        <CharacterBuilder
          spec={spec}
          onSpecChange={setSpec}
          name={name}
          onNameChange={setName}
          referenceImage={referenceImage}
          onReferenceImageChange={setReferenceImage}
          onGenerate={() => void generate()}
          generating={generating}
        />
      </aside>

      {/* Workspace — ev: region 301 'AI Influencer workspace' */}
      <main aria-label="AI Influencer workspace" className="min-w-0 space-y-6">
        {/* Page view tabs + wallet — ev: tablist 303 'Page view' (Explore / History) */}
        <div className="flex items-center justify-between gap-3">
          <div
            role="group"
            aria-label="Page view"
            className="flex overflow-hidden rounded-lg border border-border"
          >
            <button
              type="button"
              onClick={() => setPageView("explore")}
              aria-pressed={pageView === "explore"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                pageView === "explore"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Users className="h-4 w-4" aria-hidden />
              Explore
            </button>
            <button
              type="button"
              onClick={() => setPageView("history")}
              aria-pressed={pageView === "history"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                pageView === "history"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <History className="h-4 w-4" aria-hidden />
              History
            </button>
          </div>
          {/* spec: clone-side wallet chip (mirrors the app-shell topbar) — burns reflect live */}
          <div
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium tabular-nums"
            aria-label={`${walletQuery.data?.credits_balance ?? 0} credits in wallet`}
          >
            <Zap className="h-4 w-4 text-[var(--signal)]" aria-hidden />
            {walletQuery.isLoading ? "…" : (walletQuery.data?.credits_balance ?? 0)}
          </div>
        </div>

        {pageView === "explore" ? (
          <div className="space-y-6">
            {/* Hero — ev: heading 322 + paragraph 326 (verbatim) */}
            <header className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">
                <span className="block">YOUR INFLUENCER,</span>
                <span className="block">YOUR VIRAL HIT</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Build your AI influencer with the face, body, and style you want. Choose a motion preset
                and watch them perform it in a video ready to share
              </p>
            </header>

            {/* Creation mode — ev: tablist 2078 (tabs 124 'Create Influencer' / 126 'Motion') */}
            <div
              role="group"
              aria-label="Creation mode"
              className="flex overflow-hidden rounded-lg border border-border"
            >
              <button
                type="button"
                onClick={() => setCreationMode("create")}
                aria-pressed={creationMode === "create"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                  creationMode === "create"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Clapperboard className="h-4 w-4" aria-hidden />
                Create Influencer
              </button>
              <button
                type="button"
                onClick={() => setCreationMode("motion")}
                aria-pressed={creationMode === "motion"}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                  creationMode === "motion"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Play className="h-4 w-4" aria-hidden />
                Motion
              </button>
            </div>

            {creationMode === "create" ? (
              <div className="space-y-6">
                {/* Preset source filters — ev: tablist 328 (329 / 333 / 337) */}
                <div role="group" aria-label="Preset source" className="flex flex-wrap gap-2">
                  {PRESET_SOURCES.map((source) => {
                    const active = source === presetSource;
                    return (
                      <button
                        key={source}
                        type="button"
                        onClick={() => setPresetSource(source)}
                        aria-pressed={active}
                        className={cn(
                          "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card text-foreground/80 hover:border-foreground/25 hover:text-foreground"
                        )}
                      >
                        {PRESET_SOURCE_LABELS[source]}
                      </button>
                    );
                  })}
                </div>

                {presetSource === "ai-influencers" ? (
                  <section aria-label="Your AI Influencers" className="space-y-4">
                    {/* Character library — replaces the uncaptured preset gallery
                        (ev: articles 341-395); '+ New' resets the builder. */}
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                        Your characters
                      </h2>
                      <Button variant="outline" size="sm" onClick={resetBuilder}>
                        <Plus className="mr-1.5 h-3.5 w-3.5" aria-hidden />
                        New character
                      </Button>
                    </div>

                    {libraryQuery.isLoading ? (
                      <div className="scrollbar-slim flex gap-3 overflow-x-auto pb-2">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div key={i} className="h-20 w-44 shrink-0 animate-pulse rounded-xl bg-muted" />
                        ))}
                      </div>
                    ) : libraryQuery.isError ? (
                      <EmptyScope
                        label="Library unavailable"
                        note="Could not load your characters — reload the page to retry."
                      />
                    ) : characters.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No characters yet — build one in the panel and hit{" "}
                        <span className="font-semibold text-foreground">Generate</span>.
                      </p>
                    ) : (
                      <div className="scrollbar-slim flex gap-3 overflow-x-auto pb-2">
                        {characters.map((c) => {
                          const active = c.id === activeCharacterId;
                          const hue = modelHue(c.id);
                          return (
                            <article
                              key={c.id}
                              className={cn(
                                "relative shrink-0 rounded-xl border bg-card transition-colors",
                                active
                                  ? "border-primary/60 ring-1 ring-primary/40"
                                  : "border-border hover:border-foreground/20"
                              )}
                            >
                              <button
                                type="button"
                                onClick={() => loadCharacterIntoBuilder(c)}
                                aria-pressed={active}
                                className="flex w-44 items-center gap-3 p-2.5 pr-7 text-left"
                              >
                                {c.portrait_asset_url ? (
                                  // Plain img — resolved data URI / fixture asset.
                                  <img
                                    src={c.portrait_asset_url}
                                    alt={`${c.name} portrait`}
                                    className="h-12 w-12 shrink-0 rounded-lg border border-border object-cover"
                                  />
                                ) : (
                                  <span
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border text-sm font-bold"
                                    style={{
                                      background: `linear-gradient(160deg, hsl(${hue} 60% 50% / 0.4), hsl(${(hue + 45) % 360} 60% 35% / 0.1))`,
                                    }}
                                    aria-hidden
                                  >
                                    {c.name.slice(0, 1).toUpperCase()}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">{c.name}</span>
                                  <span className="block truncate text-[11px] text-muted-foreground">
                                    {formatDate(c.updated_at)}
                                  </span>
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(c.id)}
                                className="absolute right-1.5 top-1.5 rounded-full bg-background/80 p-1 text-muted-foreground backdrop-blur transition-colors hover:text-destructive"
                                aria-label={`Delete ${c.name}`}
                              >
                                <X className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </article>
                          );
                        })}
                      </div>
                    )}

                    {/* Character sheet — portrait (1:1) + full body (2:3), polled */}
                    {activeCharacterId ? (
                      detailQuery.isLoading && !character ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
                          <div className="aspect-[2/3] animate-pulse rounded-xl bg-muted" />
                        </div>
                      ) : character ? (
                        <section aria-label="Character sheet" className="space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                              {character.name} — character sheet
                            </h2>
                            <span className="text-[11px] tabular-nums text-muted-foreground">
                              {formatDate(character.updated_at)}
                            </span>
                          </div>
                          <div className="grid gap-4 sm:grid-cols-2">
                            <SheetTile
                              label="Portrait"
                              aspect="1:1"
                              aspectClass="aspect-square"
                              job={portraitJob}
                              assetUrl={character.portrait_asset_url}
                              onRetry={() => void generate()}
                              busy={generating}
                            />
                            <SheetTile
                              label="Full body"
                              aspect="2:3"
                              aspectClass="aspect-[2/3]"
                              job={fullBodyJob}
                              assetUrl={character.full_body_asset_url}
                              onRetry={() => void generate()}
                              busy={generating}
                            />
                          </div>
                        </section>
                      ) : detailQuery.isError ? (
                        <EmptyScope
                          label="Character unavailable"
                          note="This character could not be loaded — it may have been deleted. Pick another from the library."
                        />
                      ) : null
                    ) : (
                      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                        No character selected — build one in the settings panel and hit{" "}
                        <span className="font-semibold text-foreground">Generate</span>, or pick one
                        from your library above.
                      </p>
                    )}
                  </section>
                ) : presetSource === "higgsfield-presets" ? (
                  <EmptyScope
                    label="Higgsfield Presets"
                    note="This preset source exists in the live product (tab node 333) but its cards were not captured in the evidence survey."
                  />
                ) : (
                  <EmptyScope
                    label="Community Trends"
                    note="This preset source exists in the live product (tab node 337) but its cards were not captured in the evidence survey."
                  />
                )}
              </div>
            ) : (
              /* Motion mode — ev: hero 326 'Choose a motion preset and watch them
                 perform it in a video ready to share'. Precondition: the active
                 character must have a done portrait (the identity input). */
              <div className="space-y-6">
                {motionReady ? (
                  <>
                    <MotionVideoStage job={motionJob} />
                    <section aria-label="Motion presets" className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                        {MOTION_PRESETS.map((preset) => (
                          <MotionPresetTile
                            key={preset.id}
                            preset={preset}
                            busy={motionBusy === preset.id}
                            disabled={motionBusy !== null}
                            onClick={() => void animate(preset)}
                          />
                        ))}
                      </div>
                    </section>
                  </>
                ) : activeCharacterId && detailQuery.isLoading && !character ? (
                  <div className="aspect-video animate-pulse rounded-xl bg-muted" />
                ) : (
                  <div className="space-y-4">
                    <EmptyScope
                      label="Motion needs a character"
                      note="Create a character first — motion animates your character's portrait."
                    />
                    <div className="flex justify-center">
                      <Button variant="secondary" onClick={() => setCreationMode("create")}>
                        <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
                        Go to Create Influencer
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* History — ev: tab 307 'History': the active character's linked jobs
             (detail route), newest first, status badges. */
          <section aria-label="History" className="space-y-4">
            {activeCharacterId && detailQuery.isLoading && !character ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : activeCharacterId && character ? (
              <>
                <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {character.name} — history
                </h2>
                {jobs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No jobs yet for this character — generate a sheet or animate a motion preset.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                    {jobs.map((job) => (
                      <HistoryJobCard key={job.id} job={job} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Select or create a character to see its job history.
              </p>
            )}
          </section>
        )}

        {/* Provenance note — one honest line (the old demo-scope blocks are gone). */}
        <Card className="border-border bg-card">
          <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
            Layout and copy captured from the live AI Influencer studio (2026-10-17 evidence survey);
            the 18 non-captured option lists and the motion preset library are curated from the
            published spec (spec:) — Character type and all headings/copy are captured (ev:).
          </CardContent>
        </Card>

        {/* sr-only live region — sheet/motion status changes */}
        <p className="sr-only" aria-live="polite">
          {statusMessage}
        </p>

        {/* Delete confirm — the folder-card AlertDialog convention */}
        <AlertDialog
          open={confirmDeleteId !== null}
          onOpenChange={(open) => {
            if (!deleting && !open) setConfirmDeleteId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {confirmDeleteTarget?.name ?? "character"}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes the character. Linked renders stay in your generations
                history, but the character cannot be recovered.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault(); // keep the dialog open while deleting (folder-card law)
                  if (confirmDeleteId) void deleteCharacter(confirmDeleteId);
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden /> : null}
                <Trash2 className="mr-2 h-4 w-4" aria-hidden />
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}
