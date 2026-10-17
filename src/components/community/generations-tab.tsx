"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { ImageOff, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FeedCard } from "@/components/community/feed-card";
import type { FeedResponse } from "@/components/community/types";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 24;

/**
 * Deterministic skeleton aspect ratios (program law: no Math.random anywhere).
 * Mixed portrait/landscape/square heights mimic the masonry rhythm.
 */
const SKELETON_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[16/10]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[3/4]",
  "aspect-[16/9]",
  "aspect-[4/5]",
  "aspect-square",
  "aspect-[16/10]",
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[16/9]",
  "aspect-square",
  "aspect-[3/4]",
  "aspect-[16/10]",
] as const;

export function GenerationsTab() {
  const query = useInfiniteQuery({
    queryKey: ["community-feed"],
    queryFn: ({ pageParam }) =>
      api<FeedResponse>(`/api/community/generations/feed?limit=${PAGE_SIZE}&offset=${pageParam}`),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.has_more ? allPages.reduce((sum, page) => sum + page.items.length, 0) : undefined,
    staleTime: 30_000,
  });

  const items = query.data?.pages.flatMap((page) => page.items) ?? [];

  if (query.isPending) {
    return (
      <div
        className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5"
        aria-busy="true"
        aria-label="Loading community feed"
      >
        {SKELETON_ASPECTS.map((aspect, i) => (
          <Skeleton
            key={`${aspect}-${i}`}
            className={cn("mb-4 w-full break-inside-avoid rounded-xl", aspect)}
          />
        ))}
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold">Couldn&apos;t load the feed</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {query.error instanceof Error ? query.error.message : "Something went wrong."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void query.refetch()}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <ImageOff className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-lg font-semibold">Nothing published yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          No community generations yet — publish one of yours from &ldquo;My generations&rdquo; and
          it will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {items.map((item) => (
          <FeedCard key={item.id} item={item} />
        ))}
      </div>

      {query.hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            aria-label="Load more community generations"
          >
            {query.isFetchingNextPage && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            )}
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {query.isFetching && !query.isFetchingNextPage && (
        <div className="flex justify-center" aria-hidden>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
