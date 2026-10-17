"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Clapperboard,
  Globe2,
  Heart,
  Home,
  Plus,
  Shapes,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { thinScrollbar } from "@/components/studio/scrollbar";
import { useCreateFolder, useFolders } from "@/hooks/api";
import { useComposer } from "@/store/composer";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Primary navigation                                                  */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  { href: "/generate", label: "Home", icon: Home },
  { href: "/generations", label: "My generations", icon: Clapperboard },
  { href: "/elements", label: "My elements", icon: Shapes },
  { href: "/favorites", label: "My favorites", icon: Heart },
  { href: "/community", label: "Community", icon: Globe2 },
] as const;

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors",
        active
          ? "bg-zinc-800/80 font-medium text-zinc-100"
          : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Projects section                                                    */
/* ------------------------------------------------------------------ */

function ProjectList() {
  const { data, isLoading } = useFolders();
  const projectId = useComposer((s) => s.projectId);
  const setProjectId = useComposer((s) => s.setProjectId);
  const createFolder = useCreateFolder();

  const folders = data?.items ?? [];

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-1 pb-1">
        <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">
          Projects
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 gap-1 px-2 text-xs text-zinc-400 hover:text-zinc-100"
          onClick={() => createFolder.mutate({ name: "New project" })}
          disabled={createFolder.isPending}
          aria-label="Create a new project"
        >
          <Plus className="size-3.5" aria-hidden="true" />
          New project
        </Button>
      </div>

      <div
        className={cn(
          "flex max-h-72 flex-col gap-0.5 overflow-y-auto pr-1",
          thinScrollbar,
        )}
      >
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-full rounded-lg bg-zinc-800/70" />
            <Skeleton className="h-8 w-full rounded-lg bg-zinc-800/70" />
            <Skeleton className="h-8 w-full rounded-lg bg-zinc-800/70" />
          </>
        ) : folders.length === 0 ? (
          <p className="px-3 py-2 text-xs text-zinc-500">
            No projects yet — create one to organize your work.
          </p>
        ) : (
          folders.map((folder) => {
            const active = folder.id === projectId;
            return (
              <button
                key={folder.id}
                type="button"
                onClick={() => setProjectId(folder.id)}
                aria-pressed={active}
                className={cn(
                  "flex h-8 items-center justify-between gap-2 rounded-lg px-3 text-left text-sm transition-colors",
                  active
                    ? "bg-zinc-800/80 font-medium text-zinc-100"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100",
                )}
              >
                <span className="truncate">{folder.name}</span>
                {folder.access_mode === "private" ? (
                  <Badge
                    variant="outline"
                    className="shrink-0 border-zinc-700 bg-zinc-900 px-1.5 py-0 text-[10px] font-medium text-zinc-400"
                  >
                    Private
                  </Badge>
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Academy promo card                                                  */
/* ------------------------------------------------------------------ */

function AcademyCard() {
  return (
    <div className="mt-auto flex flex-col gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
      <p className="text-sm font-semibold text-zinc-100">
        Learn to make movies
      </p>
      <p className="text-xs leading-relaxed text-zinc-400">
        Practical workflows from working AI filmmakers
      </p>
      <button
        type="button"
        onClick={() => toast.info("Academy lands in Wave 3")}
        className="mt-1 w-fit text-xs font-medium text-zinc-200 underline-offset-4 hover:underline"
      >
        Learn more
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar content (shared by desktop aside and mobile drawer)         */
/* ------------------------------------------------------------------ */

export function SidebarContent() {
  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <div className="flex items-center gap-3 px-1">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-200">
          <Sparkles className="size-4" aria-hidden="true" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold tracking-tight text-zinc-100">
            Cinema Studio
          </span>
          <span className="text-xs text-zinc-500">HF Studio</span>
        </div>
      </div>

      <nav aria-label="Studio navigation" className="flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
          />
        ))}
      </nav>

      <ProjectList />

      <AcademyCard />
    </div>
  );
}

export function Sidebar() {
  return (
    <aside
      className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block"
      aria-label="Sidebar"
    >
      <SidebarContent />
    </aside>
  );
}
