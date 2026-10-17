"use client";

import { Eye, Heart, Play } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCompact, shortAgo } from "@/components/community/format";
import type { FeedItem } from "@/components/community/types";
import { cn } from "@/lib/utils";

/**
 * Higgsfield-style community feed card: full-bleed thumbnail at its natural
 * aspect, hover overlay (bottom black/80 → transparent gradient) with the
 * author chip + engagement counts, VIDEO badge for video generations.
 * Non-navigating — detail pages are wave-3 scope.
 */
export function FeedCard({ item, className }: { item: FeedItem; className?: string }) {
  const gen = item.generation;
  const initials = item.author_username.slice(0, 2).toUpperCase();

  return (
    <article
      className={cn(
        "group relative mb-4 cursor-default break-inside-avoid overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20",
        className
      )}
      aria-label={`Community generation by @${item.author_username}: ${gen.prompt.slice(0, 60)}`}
    >
      {/* Public community fixture assets — @next/next/no-img-element is off in the flat config. */}
      <img
        src={item.thumbnail_url}
        alt={gen.prompt}
        loading="lazy"
        className="h-auto w-full rounded-xl"
      />

      {/* Video badge */}
      {gen.kind === "video" && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
          <Play className="h-3 w-3" aria-hidden /> VIDEO
        </span>
      )}

      {/* Hover overlay: author chip + engagement + age */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-gradient-to-t from-black/80 to-transparent p-3 pt-10 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
        <div className="flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-white">
            <Avatar className="h-5 w-5 shrink-0">
              {item.author_avatar && <AvatarImage src={item.author_avatar} alt="" />}
              <AvatarFallback className="bg-white/15 text-[9px] font-semibold uppercase text-white ring-1 ring-white/25">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">@{item.author_username}</span>
            <span aria-hidden className="text-white/40">
              ·
            </span>
            <span className="shrink-0 text-[11px] font-normal text-white/70">
              {shortAgo(item.published_at)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-2.5 text-[11px] font-medium tabular-nums text-white/90">
            <span
              className="inline-flex items-center gap-1"
              title={`${item.views.toLocaleString("en-US")} views`}
            >
              <Eye className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Views:</span>
              {formatCompact(item.views)}
            </span>
            <span
              className="inline-flex items-center gap-1"
              title={`${item.likes.toLocaleString("en-US")} likes`}
            >
              <Heart className="h-3.5 w-3.5" aria-hidden />
              <span className="sr-only">Likes:</span>
              {formatCompact(item.likes)}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
