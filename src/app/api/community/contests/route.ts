/** GET /api/community/contests — §1e contests items (field names verbatim; seeded demo values). */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const contests = await db.contest.findMany({ orderBy: { startAt: "desc" } });
  return NextResponse.json({
    items: contests.map((c) => ({
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description,
      start_at: c.startAt.toISOString(),
      end_at: c.endAt.toISOString(),
      status: c.status,
      preview_image: c.previewImage,
      preview_video: c.previewVideo,
      logo_url: c.logoUrl,
      redirect_url: c.redirectUrl,
    })),
  });
}
