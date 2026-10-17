/** GET /api/community/contests/{slug} — contest detail (HF-W3C C4).
 * Shape: the live contests-body item, verbatim (evidence/
 * rea-2026-10-17/api-bodies-digest.json → contests items — keys id, slug,
 * title, description, start_at, end_at, status, preview_image, preview_video,
 * logo_url, redirect_url, prize_pool, submissions_count, winner,
 * some_contestants, judges, is_trending). 404 body follows the existing
 * {"detail": …} convention. */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapContestBody } from "@/lib/contests";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const contest = await db.contest.findUnique({ where: { slug } });
  if (!contest) {
    return NextResponse.json({ detail: "contest not found" }, { status: 404 });
  }
  return NextResponse.json(mapContestBody(contest));
}
