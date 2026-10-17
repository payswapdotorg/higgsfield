/** GET /api/community/discovery/creators — creator discovery (§1g inventory, clone-defined shape). */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const grouped = await db.feedPublication.groupBy({
    by: ["authorUsername"],
    _count: { _all: true },
    _sum: { views: true, likes: true },
  });

  const creators = grouped
    .map((g) => ({
      username: g.authorUsername,
      display_name: g.authorUsername.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      avatar_url: null,
      publications: g._count._all,
      total_views: g._sum.views ?? 0,
      total_likes: g._sum.likes ?? 0,
    }))
    .sort((a, b) => b.total_views - a.total_views);

  return NextResponse.json({ items: creators });
}
