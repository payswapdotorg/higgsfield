"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { FolderOpen, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
import { useDeleteFolder, type FolderJson } from "@/hooks/use-folders";
import { api } from "@/lib/api";

function FolderView() {
  const params = useParams<{ folderId: string }>();
  const folderId = typeof params?.folderId === "string" ? params.folderId : "";
  const router = useRouter();
  const deleteFolder = useDeleteFolder();

  const folderQuery = useQuery({
    queryKey: ["folder", folderId],
    queryFn: () => api<{ folder: FolderJson }>(`/api/folders/${folderId}`),
    enabled: !!folderId,
    retry: false,
  });
  const jobsQuery = useJobs({ folderId, limit: 60 }, !!folderId);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const folder = folderQuery.data?.folder;
  const jobs = jobsQuery.data?.jobs ?? [];

  const confirmDelete = async () => {
    if (!folderId || deleting) return;
    setDeleting(true);
    try {
      await deleteFolder(folderId);
      toast.success("Folder deleted");
      router.push("/generate/all");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
      setDeleting(false);
      setConfirmOpen(false);
    }
  };

  if (folderQuery.isLoading) {
    return (
      <div
        className="flex min-h-[40vh] items-center justify-center"
        role="status"
        aria-label="Loading folder"
      >
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
      </div>
    );
  }

  if (folderQuery.isError || !folder) {
    return (
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 py-24 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
          <FolderOpen className="h-5 w-5 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold">Folder not found</h1>
        <p className="text-sm text-muted-foreground">
          This folder was deleted or does not exist.
        </p>
        <Button asChild variant="secondary" size="sm">
          <Link href="/generate/all">Back to My generations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 py-2 lg:py-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/generate/all">My generations</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="max-w-48 truncate sm:max-w-none">{folder.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight">{folder.name}</h1>
          <p className="text-xs text-muted-foreground tabular-nums">
            {folder.recent_jobs_count} generation{folder.recent_jobs_count === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden />
          Delete folder
        </Button>
      </header>

      <section aria-label="Folder generations" className="space-y-3 pb-8">
        {jobsQuery.isLoading ? (
          <div
            role="status"
            aria-label="Loading generations"
            className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
          >
            {Array.from({ length: 4 }).map((_, i) => (
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
            <p className="text-sm text-muted-foreground">This folder is empty</p>
            <Link
              href="/"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--signal)] underline-offset-4 hover:underline"
            >
              Create a generation →
            </Link>
          </div>
        )}
      </section>

      {/* Delete confirm — jobs move to trash */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !deleting && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete folder? Its generations move to trash — you can restore them from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function FolderPage() {
  return (
    <SessionGate>
      <FolderView />
    </SessionGate>
  );
}
