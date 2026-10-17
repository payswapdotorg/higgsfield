"use client";

import { useState } from "react";
import Link from "next/link";
import { Folder, Loader2, MoreVertical, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDeleteFolder, type FolderJson } from "@/hooks/use-folders";

/**
 * Folder card for the "My generations" library (HF-W2): cover = most recent done generation
 * in the folder (dashed placeholder with a Folder icon when empty), name + generations count
 * chip, and a hover-revealed action menu with a delete confirm (jobs move to trash).
 */
export function FolderCard({
  folder,
  coverAssetUrl,
}: {
  folder: FolderJson;
  coverAssetUrl: string | null;
}) {
  const deleteFolder = useDeleteFolder();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await deleteFolder(folder.id);
      toast.success("Folder deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete folder");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
    }
  };

  return (
    <article
      className="group relative rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
      aria-label={`Folder: ${folder.name}`}
    >
      <Link href={`/generate/folder/${folder.id}`} className="block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-muted">
          {coverAssetUrl ? (
            <img
              src={coverAssetUrl}
              alt={`Latest generation in ${folder.name}`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-3">
              <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed border-border">
                <Folder className="h-8 w-8 text-muted-foreground" aria-hidden />
              </div>
            </div>
          )}
        </div>
        <div className="space-y-1.5 p-3">
          <p className="truncate text-sm font-medium">{folder.name}</p>
          <Badge
            variant="secondary"
            className="font-normal tabular-nums text-muted-foreground"
          >
            {folder.recent_jobs_count} generation{folder.recent_jobs_count === 1 ? "" : "s"}
          </Badge>
        </div>
      </Link>

      {/* Action menu — top-right, revealed on hover / keyboard focus */}
      <div className="absolute right-2 top-2 z-10 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <DropdownMenu open={menuOpen} onOpenChange={(open) => !busy && setMenuOpen(open)}>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="h-7 w-7 rounded-full"
              aria-label={`Folder actions for ${folder.name}`}
              disabled={busy}
            >
              <MoreVertical className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" aria-hidden /> Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Delete confirm — jobs move to trash */}
      <AlertDialog open={confirmOpen} onOpenChange={(open) => !busy && setConfirmOpen(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete folder? Its generations move to trash — you can restore them from there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void confirmDelete();
              }}
              className="bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
