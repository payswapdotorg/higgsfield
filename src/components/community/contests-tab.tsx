"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { RotateCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ContestItem } from "@/components/community/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ContestsTab() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["community-contests"],
    queryFn: () => api<{ items: ContestItem[] }>("/api/community/contests"),
    staleTime: 60_000,
  });

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading contests">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-72 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold">Couldn&apos;t load contests</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  const contests = data?.items ?? [];

  if (contests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Trophy className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-lg font-semibold">No contests right now</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Check back soon — new contests are announced here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {contests.map((contest) => {
        const open = contest.status === "open";
        return (
          <article
            key={contest.id}
            className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
            aria-label={`Contest: ${contest.title}`}
          >
            <div className="relative aspect-video overflow-hidden bg-muted">
              {/* Contest fixture preview — @next/next/no-img-element is off in the flat config. */}
              <img
                src={contest.preview_image}
                alt={`${contest.title} preview`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              />
              <span
                className={cn(
                  "absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/85 px-2.5 py-1 text-[11px] font-medium backdrop-blur"
                )}
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    open ? "bg-emerald-400" : "bg-muted-foreground"
                  )}
                  aria-hidden
                />
                <span className={open ? "text-emerald-400" : "text-muted-foreground"}>
                  {open ? "Open" : contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
                </span>
              </span>
            </div>

            <div className="flex flex-1 flex-col gap-2 p-4">
              <h3 className="font-semibold leading-snug">{contest.title}</h3>
              <p className="line-clamp-2 text-sm text-muted-foreground">{contest.description}</p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(contest.start_at), "MMM d, yyyy")}
                {" – "}
                {format(new Date(contest.end_at), "MMM d, yyyy")}
              </p>
              <div className="mt-auto pt-3">
                {/* Title on the wrapper keeps the tooltip reachable while the button is disabled. */}
                <span
                  className="block w-full"
                  title="Contest submission flows ship in Wave 3."
                >
                  <Button variant="secondary" size="sm" className="w-full" disabled>
                    Opens in wave 3
                  </Button>
                </span>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
