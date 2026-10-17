"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { RotateCcw, Users } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCompact } from "@/components/community/format";
import type { CreatorItem } from "@/components/community/types";
import { api } from "@/lib/api";

/** Up-to-two initials from a display name, with a username fallback. */
function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("");
  return (initials || "?").toUpperCase();
}

export function CreatorsTab() {
  const { data, isPending, isError, error, refetch } = useQuery({
    queryKey: ["community-creators"],
    queryFn: () => api<{ items: CreatorItem[] }>("/api/community/discovery/creators"),
    staleTime: 60_000,
  });

  if (isPending) {
    return (
      <div
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        aria-busy="true"
        aria-label="Loading creators"
      >
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} className="h-56 rounded-xl" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <p className="text-lg font-semibold">Couldn&apos;t load creators</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "Something went wrong."}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void refetch()}>
          <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Try again
        </Button>
      </div>
    );
  }

  const creators = data?.items ?? [];

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
          <Users className="h-7 w-7 text-muted-foreground" aria-hidden />
        </div>
        <p className="text-lg font-semibold">No creators yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Publish a generation to become the first community creator.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {creators.map((creator) => (
        <article
          key={creator.username}
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-foreground/20"
          aria-label={`Creator @${creator.username}`}
        >
          {/*
            HF-W5: the avatar + name block links to the creator's public profile
            (/profile/[username] — route family /_private/profile/$username,
            route-preload-manifest.json). The Follow button stays a sibling
            (never nested inside the link — a11y).
          */}
          <Link
            href={`/profile/${creator.username}`}
            className="flex flex-col items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card rounded-lg"
            aria-label={`View @${creator.username} profile`}
          >
            <Avatar className="h-16 w-16">
              {creator.avatar_url && <AvatarImage src={creator.avatar_url} alt="" />}
              <AvatarFallback className="text-base font-semibold uppercase">
                {initialsOf(creator.display_name || creator.username)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <p className="truncate font-medium">{creator.display_name}</p>
              <p className="truncate text-xs text-muted-foreground">@{creator.username}</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {creator.publications}
              </span>{" "}
              {creator.publications === 1 ? "post" : "posts"}
            </span>
            <span aria-hidden className="h-3 w-px bg-border" />
            <span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCompact(creator.total_views)}
              </span>{" "}
              views
            </span>
          </div>

          <div className="mt-auto flex w-full items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={() => toast.success(`Following @${creator.username} (demo)`)}
            >
              Follow
            </Button>
            <Button asChild variant="ghost" size="sm" aria-label={`Open @${creator.username} profile`}>
              <Link href={`/profile/${creator.username}`}>Profile</Link>
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
