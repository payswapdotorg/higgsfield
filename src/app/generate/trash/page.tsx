"use client";

import { useState } from "react";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SessionGate } from "@/components/session-gate";
import { JobCard } from "@/components/generations/job-card";
import { useJobs } from "@/hooks/use-jobs";
import { useTrashCount, useInvalidateJobQueries } from "@/hooks/use-trash-count";
import { api } from "@/lib/api";
import type { JobJson } from "@/lib/job-shape";

/**
 * Trashed generation card: read-only JobCard (no actions menu) + restore / delete-forever
 * row. Restore re-runs the usual invalidation so folders, trash count and the studio
 * "latest" grid refresh; delete-forever purges after an AlertDialog confirm.
 */
function TrashJobCard({ job }: { job: JobJson }) {
  const invalidate = useInvalidateJobQueries();
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const restore = async () => {
    setBusy(true);
    try {
      await api(`/api/jobs/${job.id}/restore`, { method: "POST" });
      await invalidate();
      toast.success("Restored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setBusy(false);
    }
  };

  const purge = async () => {
    setBusy(true);
    try {
      await api(`/api/jobs/${job.id}?purge=1`, { method: "DELETE" });
      await invalidate();
      toast.success("Deleted forever");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <JobCard job={job} showActions={false} />
      <div className="flex gap-2" role="group" aria-label={`Trash actions for ${job.prompt.slice(0, 40)}`}>
        <Button
          size="sm"
          variant="secondary"
          className="h-8 flex-1"
          disabled={busy}
          onClick={() => void restore()}
        >
          {busy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          ) : (
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          )}
          Restore
        </Button>
        <Button
          size="sm"
          variant="destructive"
          className="h-8 flex-1"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
          Delete forever
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={(open) => !busy && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete forever?</AlertDialogTitle>
            <AlertDialogDescription>
              This generation will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void purge();
              }}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TrashView() {
  const { data: trashData } = useTrashCount();
  const jobsQuery = useJobs({ trash: true, limit: 60 });

  const jobs = jobsQuery.data?.jobs ?? [];
  const count = trashData?.count;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-2 lg:py-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight">
          Trash
          <Badge variant="secondary" className="tabular-nums">
            {count ?? "…"}
          </Badge>
        </h1>
      </header>

      <section aria-label="Trashed generations" className="space-y-3 pb-8">
        {jobsQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading trash"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="aspect-[3/4] animate-pulse rounded-xl bg-muted" />
                <div className="h-8 animate-pulse rounded-lg bg-muted" />
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {jobs.map((job) => (
              <TrashJobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <Trash2 className="mx-auto h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 text-sm text-muted-foreground">Trash is empty</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Generations you trash will appear here before being deleted forever.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default function TrashPage() {
  return (
    <SessionGate>
      <TrashView />
    </SessionGate>
  );
}
