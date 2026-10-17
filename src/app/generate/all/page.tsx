"use client";

import { useState } from "react";
import Link from "next/link";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SessionGate } from "@/components/session-gate";
import { JobCard } from "@/components/generations/job-card";
import { FolderCard } from "@/components/generations/folder-card";
import { useJobs } from "@/hooks/use-jobs";
import { useFolders, useCreateFolder } from "@/hooks/use-folders";
import { cn } from "@/lib/utils";

function MyGenerations() {
  const foldersQuery = useFolders();
  const jobsQuery = useJobs({ limit: 60 });
  const createFolder = useCreateFolder();

  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const folders = foldersQuery.data?.folders ?? [];
  const jobs = jobsQuery.data?.jobs ?? [];

  const create = async () => {
    const name = folderName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      await createFolder(name);
      toast.success("Folder created");
      setFolderName("");
      setNewFolderOpen(false);
    } catch (err) {
      // 409 duplicate-name (and any other) API error → surface the detail message
      toast.error(err instanceof Error ? err.message : "Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 py-2 lg:py-4">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">My generations</h1>
        <Button onClick={() => setNewFolderOpen(true)}>
          <FolderPlus className="h-4 w-4" aria-hidden />
          New folder
        </Button>
      </header>

      {/* Folders */}
      {folders.length > 0 && (
        <section aria-label="Folders" className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Folders
          </h2>
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
        </section>
      )}

      {/* All generations */}
      <section aria-label="All generations" className="space-y-3 pb-8">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          All generations
        </h2>
        {jobsQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading generations"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing here yet — everything you create lands in this library.
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

      {/* New folder dialog */}
      <Dialog
        open={newFolderOpen}
        onOpenChange={(open) => {
          if (creating) return;
          setNewFolderOpen(open);
          if (!open) setFolderName("");
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New folder</DialogTitle>
            <DialogDescription>Group related generations into a folder.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void create();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="new-folder-name">Folder name</Label>
              <Input
                id="new-folder-name"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Neon city project"
                autoFocus
                maxLength={80}
                disabled={creating}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setNewFolderOpen(false)}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!folderName.trim() || creating}>
                {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function AllGenerationsPage() {
  return (
    <SessionGate>
      <MyGenerations />
    </SessionGate>
  );
}
