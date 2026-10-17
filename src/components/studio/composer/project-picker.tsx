"use client";

import * as React from "react";
import { Check, ChevronDown, Folder, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { thinScrollbar } from "@/components/studio/scrollbar";
import { useCreateFolder, useFolders } from "@/hooks/api";
import { useComposer } from "@/store/composer";
import { cn } from "@/lib/utils";

export function ProjectPicker() {
  const { data, isLoading } = useFolders();
  const createFolder = useCreateFolder();
  const projectId = useComposer((s) => s.projectId);
  const setProjectId = useComposer((s) => s.setProjectId);

  const folders = data?.items ?? [];
  const autoCreatedRef = React.useRef(false);

  // Auto-create the first project once, only after a successful load of an
  // empty list (mirrors the captured POST body "New project").
  React.useEffect(() => {
    if (!data || autoCreatedRef.current) return;
    if (data.items.length === 0) {
      autoCreatedRef.current = true;
      createFolder.mutate({ name: "New project" });
    }
  }, [data, createFolder]);

  // Repair a stale persisted project selection.
  React.useEffect(() => {
    if (!data || data.items.length === 0) return;
    const stillExists = data.items.some((folder) => folder.id === projectId);
    if (!projectId || !stillExists) {
      setProjectId(data.items[0].id);
    }
  }, [data, projectId, setProjectId]);

  const activeFolder = folders.find((folder) => folder.id === projectId);
  const label = activeFolder?.name ?? "New project";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Project: ${label}. Open project picker`}
          className="inline-flex h-8 max-w-56 items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600"
        >
          <Folder className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-72 border-zinc-800 bg-zinc-900 p-0 text-zinc-100"
      >
        <div className="border-b border-zinc-800 px-3 py-2.5">
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
            My projects
          </span>
        </div>

        <div className="p-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-100 hover:bg-zinc-800"
            onClick={() => createFolder.mutate({ name: "New project" })}
            disabled={createFolder.isPending}
          >
            <Plus className="size-3.5" aria-hidden="true" />
            Create new project
          </Button>
        </div>

        <div
          className={cn(
            "max-h-64 overflow-y-auto px-2 pb-2",
            thinScrollbar,
          )}
          role="listbox"
          aria-label="Projects"
        >
          {isLoading ? (
            <>
              <Skeleton className="h-9 w-full rounded-lg bg-zinc-800/70" />
              <Skeleton className="h-9 w-full rounded-lg bg-zinc-800/70" />
              <Skeleton className="h-9 w-full rounded-lg bg-zinc-800/70" />
            </>
          ) : folders.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-500">
              No projects yet.
            </p>
          ) : (
            folders.map((folder) => {
              const active = folder.id === projectId;
              return (
                <button
                  key={folder.id}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => setProjectId(folder.id)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    active
                      ? "bg-zinc-800/80 font-medium text-zinc-100"
                      : "text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100",
                  )}
                >
                  <span className="truncate">{folder.name}</span>
                  {folder.access_mode === "private" ? (
                    <Badge
                      variant="outline"
                      className="ml-auto shrink-0 border-zinc-700 bg-zinc-900 px-1.5 py-0 text-[10px] font-medium text-zinc-400"
                    >
                      Private
                    </Badge>
                  ) : null}
                  {active ? (
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        folder.access_mode === "private" ? "ml-1" : "ml-auto",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
