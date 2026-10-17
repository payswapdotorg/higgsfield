"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Clapperboard, Layers, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderCard } from "@/components/generations/folder-card";
import { useFolders } from "@/hooks/use-folders";
import { useJobs } from "@/hooks/use-jobs";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/**
 * /edit — Image Edit landing (private).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-edit.json, 455 a11y nodes):
 * - eyebrow StaticText 18135 'HIGGSFIELD LAYERS';
 * - hero heading 18136 'TURN FLAT IMAGES INTO EDITABLE LAYERS.' (lines 18137
 *   'TURN FLAT IMAGES' + 18138 'INTO EDITABLE LAYERS.');
 * - hero paragraph 18140 'Turn flat images into editable layers. Separate,
 *   edit, and rebuild any image. Every element, now yours to edit.' (verbatim);
 * - capability carousel: 5 labelled images 18121/18123/18125/18127/18129
 *   (RELIGHT, INPAINT, LAYER DECOMPOSITION, EDIT TEXT, EFFECTS) + buttons
 *   18130 'Previous capability' / 18132 'Next capability' — rendered as an
 *   interactive client-side carousel in evidence order (deterministic tiles;
 *   no captured capability media);
 * - button 18141 'Upload Media' — the upload→layers flow was NOT captured →
 *   visibly scoped (disabled + note), with an honest Cinema Studio CTA;
 * - sectionheader 18145: heading 18146 'My projects' — the LIVE capture shows
 *   the empty state (18150 'Your edit projects will appear here' + 18152
 *   'Upload an image to separate it into editable layers — every project you
 *   start is saved here.'). Per the wave-3B order this clone section lists
 *   the signed-in user's folders via the EXISTING folders API (same pattern
 *   as /ads-studio/all) with a disclosed no-edit-surface note.
 */

/** ev: capability images 18121-18129 — labels verbatim, evidence order. */
const CAPABILITIES = [
  { label: "RELIGHT", nodeId: 18121 },
  { label: "INPAINT", nodeId: 18123 },
  { label: "LAYER DECOMPOSITION", nodeId: 18125 },
  { label: "EDIT TEXT", nodeId: 18127 },
  { label: "EFFECTS", nodeId: 18129 },
] as const;

export function EditLanding() {
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const foldersQuery = useFolders(signedIn);
  const jobsQuery = useJobs({ limit: 60 }, signedIn);

  const folders = foldersQuery.data?.folders ?? [];
  const jobs = jobsQuery.data?.jobs ?? [];

  const [capability, setCapability] = useState(0);
  const prevCapability = () => setCapability((i) => (i - 1 + CAPABILITIES.length) % CAPABILITIES.length);
  const nextCapability = () => setCapability((i) => (i + 1) % CAPABILITIES.length);
  const active = CAPABILITIES[capability]!;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-10 py-2 lg:py-4">
      <header className="space-y-5">
        {/* ev: StaticText 18135 'HIGGSFIELD LAYERS' */}
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          HIGGSFIELD LAYERS
        </p>
        {/* ev: heading 18136, lines 18137/18138 */}
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          TURN FLAT IMAGES
          <br />
          INTO EDITABLE LAYERS.
        </h1>
        {/* ev: paragraph 18140 verbatim */}
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Turn flat images into editable layers. Separate, edit, and rebuild any image. Every
          element, now yours to edit.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* ev: button 18141 'Upload Media' — uncaptured flow → scoped */}
          <Button size="lg" disabled aria-describedby="upload-media-scope">
            <Upload className="mr-2 h-4 w-4" aria-hidden />
            Upload Media
          </Button>
          {/* Honest CTA into the wave-2 pipeline */}
          <Button asChild size="lg" variant="secondary">
            <Link href="/">
              <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
              Continue in Cinema Studio
            </Link>
          </Button>
        </div>
        <p id="upload-media-scope" className="max-w-xl text-xs leading-relaxed text-amber-600 dark:text-amber-400">
          Demo scope: the upload→layers pipeline (image separation into editable layers) was not
          captured in the evidence survey, so the upload button is inert rather than faked. Cinema
          Studio remains the real generation pipeline.
        </p>
      </header>

      {/* ev: capability carousel — images 18121-18129 + buttons 18130/18132 */}
      <section aria-labelledby="capabilities-heading" className="space-y-4">
        <h2 id="capabilities-heading" className="text-lg font-semibold tracking-tight">
          Capabilities
        </h2>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div
            role="group"
            aria-roledescription="carousel"
            aria-label="Image Edit capabilities"
            className="relative flex aspect-[16/9] items-center justify-center"
            style={{
              background: `linear-gradient(135deg, hsl(${200 + capability * 24} 60% 45% / 0.28), transparent 70%)`,
            }}
          >
            <div className="flex flex-col items-center gap-3 p-6 text-center">
              <Layers className="h-10 w-10 text-foreground/70" aria-hidden />
              <p className="text-xl font-bold tracking-wide sm:text-2xl">{active.label}</p>
              <p className="max-w-md text-xs text-muted-foreground">
                Capability {capability + 1} of {CAPABILITIES.length} · labels captured verbatim
                (nodes {active.nodeId})
              </p>
            </div>
            {/* ev: buttons 18130 'Previous capability' / 18132 'Next capability' */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute left-3 rounded-full"
              aria-label="Previous capability"
              onClick={prevCapability}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-3 rounded-full"
              aria-label="Next capability"
              onClick={nextCapability}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </Button>
          </div>
          <div className="flex items-center justify-center gap-2 p-3">
            {CAPABILITIES.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => setCapability(i)}
                aria-label={`Show ${c.label}`}
                aria-current={i === capability}
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
                  i === capability
                    ? "bg-[var(--signal)] text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ev: sectionheader 18145, heading 18146 'My projects' */}
      <section aria-labelledby="my-projects-heading" className="space-y-4 pb-8">
        <div className="space-y-1">
          <h2 id="my-projects-heading" className="text-lg font-semibold tracking-tight">
            My projects
          </h2>
          {/* ev: live empty-state paragraphs 18150 + 18152, shown when no folders exist */}
          {foldersQuery.isSuccess && folders.length === 0 && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Your edit projects will appear here</p>
              <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
                Upload an image to separate it into editable layers — every project you start is
                saved here.
              </p>
            </div>
          )}
        </div>

        {/* Visible disclosed note — the clone folder model has no edit surface
            (same check as /ads-studio/all: GET /api/folders has no surface field) */}
        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-2 p-4 text-sm">
            <p className="font-medium">
              <span className="font-semibold text-amber-500">Demo scope:</span> this build&rsquo;s
              folder model has no edit-surface distinction
            </p>
            <p className="leading-relaxed text-muted-foreground">
              The live product files edit projects separately; the clone&rsquo;s folders API returns
              folders without a surface field, so every project folder you own is listed here
              (covers = latest done generation). Nothing is filtered or faked.
            </p>
          </CardContent>
        </Card>

        {foldersQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading projects"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : folders.length > 0 ? (
          <div
            className={cn(
              "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
              folders.length > 8 && "scrollbar-slim max-h-96 overflow-y-auto pr-1"
            )}
          >
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                folder={folder}
                coverAssetUrl={
                  jobs.find(
                    (j) => j.folder_id === folder.id && j.status === "done" && j.asset_url
                  )?.asset_url ?? null
                }
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <Layers className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">
              No project folders yet — every generation you save to a folder shows up here.
            </p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--signal)] underline-offset-4 hover:underline"
            >
              Create your first generation →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
