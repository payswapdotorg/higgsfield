/**
 * GET /api/community/generations/feed?limit=50&offset=0 — community feed (§1g inventory).
 * Public read-model: FeedPublication ⟕ Generation. Paged; {"items":[…],"has_more":bool}.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 50);
  const offset = clampInt(url.searchParams.get("offset"), 0, 1_000_000, 0);

  const where = { generation: { deletedAt: null } };
  const [publications, total] = await Promise.all([
    db.feedPublication.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      take: limit,
      skip: offset,
      include: { generation: true },
    }),
    db.feedPublication.count({ where }),
  ]);

  return NextResponse.json({
    items: publications.map((p) => ({
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
        model_label: MODEL_CATALOG[p.generation.modelVersion]?.label ?? p.generation.modelVersion,
        job_set_type: p.generation.jobSetType,
        kind: p.generation.kind,
        aspect_ratio: p.generation.aspectRatio,
        width: p.generation.width,
        height: p.generation.height,
      },
    })),
    has_more: offset + publications.length < total,
  });
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
