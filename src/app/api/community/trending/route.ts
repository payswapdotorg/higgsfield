/**
 * GET /api/community/trending?limit=32&sort=most_viewed — trending publications (§1g inventory).
 * Only `sort=most_viewed` is supported (any other value → 400).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { MODEL_CATALOG } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const sort = url.searchParams.get("sort") ?? "most_viewed";
  if (sort !== "most_viewed") {
    return NextResponse.json({ detail: `unsupported sort: ${sort}` }, { status: 400 });
  }
  const limit = clampInt(url.searchParams.get("limit"), 1, 100, 32);

  const publications = await db.feedPublication.findMany({
    where: { generation: { deletedAt: null } },
    orderBy: [{ views: "desc" }, { publishedAt: "desc" }],
    take: limit,
    include: { generation: true },
  });

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
  });
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
