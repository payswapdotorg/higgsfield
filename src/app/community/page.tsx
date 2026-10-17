"use client";

import { Suspense } from "react";
import { CommunityContent } from "@/components/community/community-content";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Deterministic fallback aspect ratios for the prerender/loading skeleton
 * (program law: no Math.random anywhere).
 */
const FALLBACK_ASPECTS = [
  "aspect-[3/4]",
  "aspect-[16/10]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[16/9]",
  "aspect-[3/4]",
  "aspect-square",
  "aspect-[4/5]",
  "aspect-[16/10]",
  "aspect-[3/4]",
] as const;

function CommunityFallback() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading community">
      <div className="space-y-3">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-4 w-72 max-w-full rounded-lg" />
        <Skeleton className="h-11 w-full max-w-md rounded-full" />
      </div>
      <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5">
        {FALLBACK_ASPECTS.map((aspect, i) => (
          <Skeleton
            key={`${aspect}-${i}`}
            className={cn("mb-4 w-full break-inside-avoid rounded-xl", aspect)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * /community — public community discovery page (app shell already wraps it).
 * The content reads ?tab= via useSearchParams(), so it MUST be wrapped in a
 * Suspense boundary for the static prerender to succeed.
 */
export default function CommunityPage() {
  return (
    <Suspense fallback={<CommunityFallback />}>
      <CommunityContent />
    </Suspense>
  );
}
