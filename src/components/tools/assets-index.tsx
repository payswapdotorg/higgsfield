"use client";

import Link from "next/link";
import { FolderOpen, ImageIcon, PackageOpen, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/hooks/use-jobs";
import { useSession } from "@/hooks/use-session";
import type { JobJson } from "@/lib/job-shape";
import { cn } from "@/lib/utils";

/**
 * /assets — Assets index (private).
 *
 * Evidence: the live product carries an 'Assets' topbar entry with a folder
 * icon (inspect-effects.json link 19977 'Folder icon Assets'; identical nav
 * nodes in inspect-canvas.json 22471 / inspect-edit.json 18109 /
 * inspect-audio.json 1037) and the route /_private/asset
 * (route-preload-manifest.json). The assets-page surface itself was NOT
 * captured — per the wave-3B order this is a simple index over the EXISTING
 * done generations via the reused jobs hook (useJobs from
 * src/hooks/use-jobs.ts — GET /api/jobs/accessible; no new API routes).
 *
 * Each asset card: thumbnail (asset_url of a done generation), model chip +
 * status chip (order: "model/status chips"), and a link to its folder view
 * (/generate/folder/{folder_id}); generations without a folder link to the
 * full library (/generate/all) — disclosed clone-side fallback.
 */

export function AssetsIndex() {
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const jobsQuery = useJobs({ limit: 200 }, signedIn);

  const jobs = jobsQuery.data?.jobs ?? [];
  // Assets = done generations with a rendered asset (order: "over EXISTING done generations")
  const assets = jobs.filter((j) => j.status === "done" && j.asset_url);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 py-2 lg:py-4">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <FolderOpen className="h-4 w-4 text-[var(--signal)]" aria-hidden />
          {/* ev: topbar label 'Assets' (folder icon) — inspect-effects.json 19977 */}
          Assets
        </div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Assets</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Every done generation in this build — each asset files into its project folder.
        </p>
      </header>

      {/* Visible disclosed note: the live assets surface was not captured */}
      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-2 p-4 text-sm">
          <p className="font-medium">
            <span className="font-semibold text-amber-500">Demo scope:</span> index over your
            existing generations
          </p>
          <p className="leading-relaxed text-muted-foreground">
            The live Assets page surface was not captured in the evidence survey (only its topbar
            entry and route key <code className="rounded bg-muted px-1 py-0.5 text-xs">/_private/asset</code>{" "}
            were). This index therefore lists this build&rsquo;s done generations from the existing
            jobs API — no separate asset store is invented.
          </p>
        </CardContent>
      </Card>

      <section aria-label="Asset grid" className="space-y-4 pb-8">
        {jobsQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading assets"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : assets.length > 0 ? (
          <div
            className={cn(
              "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4",
              assets.length > 12 && "scrollbar-slim max-h-[38rem] overflow-y-auto pr-1"
            )}
          >
            {assets.map((job) => (
              <AssetCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <PackageOpen className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No assets yet</p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              Done generations with a rendered asset appear here. Generate something in Cinema
              Studio first.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/">Open Cinema Studio</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}

function AssetCard({ job }: { job: JobJson }) {
  const folderHref = job.folder_id ? `/generate/folder/${job.folder_id}` : "/generate/all";

  return (
    <article
      className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
      aria-label={`Asset: ${job.prompt.slice(0, 60)}`}
    >
      <Link href={folderHref} className="block focus-visible:outline-none">
        <div
          className="relative w-full overflow-hidden bg-muted"
          style={{ aspectRatio: `${job.width} / ${job.height}` }}
        >
          {/* Local fixture assets (plain img is fine; no-img-element is off in this config) */}
          <img
            src={job.asset_url ?? ""}
            alt={job.prompt}
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          {job.kind === "video" && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <Play className="h-3 w-3" aria-hidden /> VIDEO
            </span>
          )}
          {job.kind === "image" && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
              <ImageIcon className="h-3 w-3" aria-hidden /> IMAGE
            </span>
          )}
        </div>
        <div className="space-y-2 p-3">
          <p className="line-clamp-2 min-h-8 text-xs leading-snug text-foreground/90">
            {job.prompt}
          </p>
          {/* Model + status chips (order: "model/status chips") */}
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="max-w-full truncate px-1.5 text-[10px] font-medium">
              {job.model_label}
            </Badge>
            <Badge
              variant="outline"
              className="px-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400"
            >
              {job.status}
            </Badge>
          </div>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <FolderOpen className="h-3 w-3" aria-hidden />
            {job.folder_id ? "Open in folder" : "Open in library"}
          </p>
        </div>
      </Link>
    </article>
  );
}
