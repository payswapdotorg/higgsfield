"use client";

import * as React from "react";
import { format, isValid } from "date-fns";
import { Trophy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useContests, type Contest } from "@/hooks/api";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Subnav (visual tabs — Top / New are muted placeholders)              */
/* ------------------------------------------------------------------ */

const SUBNAV_ITEMS = [
  { id: "explore", label: "Explore", active: true },
  { id: "top", label: "Top", active: false },
  { id: "new", label: "New", active: false },
];

function Subnav() {
  return (
    <nav aria-label="Community sections" className="flex items-center gap-6">
      {SUBNAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          aria-current={item.active ? "page" : undefined}
          className={cn(
            "-mb-px border-b-2 pb-3 pt-2 text-sm transition-colors",
            item.active
              ? "border-zinc-100 font-medium text-zinc-100"
              : "cursor-default border-transparent text-zinc-500 hover:text-zinc-300",
          )}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/* Contest card                                                        */
/* ------------------------------------------------------------------ */

const STATUS_BADGE_CLASS: Record<string, string> = {
  open: "border-emerald-500/30 bg-emerald-500/15 text-emerald-400",
  upcoming: "border-amber-500/30 bg-amber-500/15 text-amber-400",
};

function formatContestDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  return isValid(date) ? format(date, "MMM d, yyyy") : "";
}

function ContestCard({ contest }: { contest: Contest }) {
  const [imageFailed, setImageFailed] = React.useState(false);
  const showImage = Boolean(contest.preview_image) && !imageFailed;

  const statusClass =
    STATUS_BADGE_CLASS[contest.status] ??
    "border-zinc-700 bg-zinc-800 text-zinc-300";

  const startDate = formatContestDate(contest.start_at);
  const endDate = formatContestDate(contest.end_at);
  const dateRange =
    startDate && endDate ? `${startDate} – ${endDate}` : (startDate || endDate);

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 transition-colors hover:border-zinc-600">
      <div className="relative aspect-video bg-zinc-900">
        {showImage ? (
          <img
            src={contest.preview_image as string}
            alt={`Preview of contest: ${contest.title}`}
            className="size-full object-cover"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div
            aria-hidden="true"
            className="size-full bg-gradient-to-br from-zinc-800 via-zinc-900 to-black"
          />
        )}
        {contest.status ? (
          <Badge
            className={cn(
              "absolute left-3 top-3 capitalize",
              statusClass,
            )}
          >
            {contest.status}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-sm font-semibold text-zinc-100">
          {contest.title}
        </h3>
        {contest.description ? (
          <p className="line-clamp-2 text-sm text-zinc-400">
            {contest.description}
          </p>
        ) : null}
        {dateRange ? (
          <p className="mt-auto pt-1 text-xs text-zinc-500">{dateRange}</p>
        ) : null}
      </div>
    </article>
  );
}

function ContestSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50">
      <Skeleton className="aspect-video w-full rounded-none bg-zinc-800/60" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-3/4 bg-zinc-800/60" />
        <Skeleton className="h-3 w-full bg-zinc-800/60" />
        <Skeleton className="h-3 w-1/2 bg-zinc-800/60" />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function CommunityPage() {
  const { data, isLoading, isError } = useContests();
  const contests = data?.items ?? [];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        Explore
      </h1>

      <div className="mt-4 border-b border-zinc-800">
        <Subnav />
      </div>

      <section aria-labelledby="contests-heading" className="mt-8">
        <h2
          id="contests-heading"
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-zinc-100"
        >
          <Trophy className="size-5 text-zinc-400" aria-hidden="true" />
          Contests
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              <ContestSkeleton />
              <ContestSkeleton />
              <ContestSkeleton />
              <ContestSkeleton />
              <ContestSkeleton />
              <ContestSkeleton />
            </>
          ) : isError ? (
            <p className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-400">
              Could not load contests right now. Refresh the page to try again.
            </p>
          ) : contests.length === 0 ? (
            <p className="col-span-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 text-sm text-zinc-400">
              No contests are running right now — check back soon.
            </p>
          ) : (
            contests.map((contest) => (
              <ContestCard key={contest.id} contest={contest} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}
