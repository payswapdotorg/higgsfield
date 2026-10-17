import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/catalog";
import { FeedCard } from "@/components/community/feed-card";
import type { FeedItem } from "@/components/community/types";

/**
 * HF-W5 — a user's published generations, rendered from the community read-model
 * (FeedPublication ⟕ Generation — the same source as /api/community/generations/feed
 * and the community generations tab). Server component; FeedCard is the shared
 * community card (client) fed with the exact FeedItem shape.
 */
export async function UserGenerationsGrid({
  username,
  limit,
}: {
  username: string;
  limit?: number;
}) {
  const publications = await db.feedPublication.findMany({
    where: { authorUsername: username, generation: { deletedAt: null } },
    orderBy: { publishedAt: "desc" },
    ...(limit ? { take: limit } : {}),
    include: { generation: true },
  });

  if (publications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
        <h2 className="text-lg font-semibold">No published generations yet</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          When @{username} publishes generations to the community feed they appear here.
        </p>
      </div>
    );
  }

  const items: FeedItem[] = publications.map((p) => ({
    id: p.id,
    thumbnail_url: p.thumbnailUrl,
    views: p.views,
    likes: p.likes,
    published_at: p.publishedAt.toISOString(),
    author_username: p.authorUsername,
    author_avatar: null,
    generation: {
      id: p.generation.id,
      prompt: p.generation.prompt,
      model_version: p.generation.modelVersion,
      model_label:
        MODEL_CATALOG[p.generation.modelVersion]?.label ?? p.generation.modelVersion,
      job_set_type: p.generation.jobSetType,
      kind: p.generation.kind as "image" | "video",
      aspect_ratio: p.generation.aspectRatio,
      width: p.generation.width,
      height: p.generation.height,
    },
  }));

  return (
    <div className="columns-1 gap-4 sm:columns-2 xl:columns-3" aria-label={`Generations by ${username}`}>
      {items.map((item) => (
        <FeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
