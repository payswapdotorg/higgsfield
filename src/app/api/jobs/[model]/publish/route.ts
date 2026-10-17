/**
 * POST /api/jobs/{jobId}/publish — publish a completed generation to the community feed
 * (creates a FeedPublication read-model row + stamps Generation.publishedAt).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ model: string }> }) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { model: jobId } = await params;

  const job = await db.generation.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== auth.user.id) {
    return NextResponse.json({ detail: "job not found" }, { status: 404 });
  }
  if (job.status !== "done" || !job.assetUrl) {
    return NextResponse.json({ detail: "only completed generations can be published" }, { status: 409 });
  }
  const existing = await db.feedPublication.findUnique({ where: { generationId: job.id } });
  if (existing) {
    return NextResponse.json({ detail: "generation already published" }, { status: 409 });
  }

  const [publication] = await db.$transaction([
    db.feedPublication.create({
      data: {
        generationId: job.id,
        authorUsername: auth.user.username,
        thumbnailUrl: job.assetUrl,
        views: 0,
        likes: 0,
      },
    }),
    db.generation.update({ where: { id: job.id }, data: { publishedAt: new Date() } }),
  ]);

  return NextResponse.json({
    publication: {
      id: publication.id,
      generation_id: publication.generationId,
      author_username: publication.authorUsername,
      thumbnail_url: publication.thumbnailUrl,
      views: publication.views,
      likes: publication.likes,
      published_at: publication.publishedAt.toISOString(),
    },
  });
}
