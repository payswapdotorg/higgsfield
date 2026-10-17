"use client";

import Link from "next/link";
import { ArrowLeft, Folder as FolderIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderCard } from "@/components/generations/folder-card";
import { useFolders } from "@/hooks/use-folders";
import { useJobs } from "@/hooks/use-jobs";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/**
 * /ads-studio/all — Ads Studio projects list (private).
 *
 * Evidence: the live route is /_private/ads-studio/all (route-preload-manifest.json);
 * its surface was not captured. Heading "All projects" follows the studio-family
 * evidence string (inspect-marketing-studio.json node 2916, button 'All projects').
 *
 * DISCLOSED clone-side limitation (checked before building): the clone folder
 * model has NO ads-surface distinction — GET /api/folders (src/app/api/folders/
 * route.ts) returns id / name / recent_jobs_count / created_at with no surface
 * field (the live product posts folders with surface:"cinematic_studio" etc.).
 * Therefore this page lists ALL project folders of the signed-in user with a
 * visible disclosed note, instead of filtering to an ads surface that does not
 * exist in the clone's data model.
 */
export function AdsAllProjects() {
  const { data: session } = useSession();
  const signedIn = !!session?.user;
  const foldersQuery = useFolders(signedIn);
  const jobsQuery = useJobs({ limit: 60 }, signedIn);

  const folders = foldersQuery.data?.folders ?? [];
  const jobs = jobsQuery.data?.jobs ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 py-2 lg:py-4">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">All projects</h1>
          <p className="text-sm text-muted-foreground">Ads Studio project folders</p>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/ads-studio">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Ads Studio
          </Link>
        </Button>
      </header>

      {/* Visible disclosed note — the clone folder model has no ads surface */}
      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="flex flex-col gap-2 p-4 text-sm">
          <p className="font-medium">
            <span className="font-semibold text-amber-500">Demo scope:</span> this build&rsquo;s folder model
            has no ads-surface distinction
          </p>
          <p className="leading-relaxed text-muted-foreground">
            The live product files each project under a surface (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">surface: "ads_studio"</code>), but the
            clone&rsquo;s folders API returns folders without a surface field — so every project folder you
            own is listed here, not just ads projects. Nothing is filtered or faked.
          </p>
        </CardContent>
      </Card>

      <section aria-label="Project folders" className="space-y-3 pb-8">
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
            <FolderIcon className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
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

      <footer className="border-t border-border pt-4">
        <p className="text-xs text-muted-foreground">
          Folders are the clone&rsquo;s project model (shared with My generations) —{" "}
          <Link
            href="/generate/all"
            className="underline underline-offset-4 hover:text-foreground"
          >
            open the full generations library
          </Link>
          .
        </p>
      </footer>
    </div>
  );
}
