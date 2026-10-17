/** GET /api/community/contests — §1e contests items (field names verbatim; seeded demo values).
 * HF-W3C C4: the response now carries the full live contests-body shape —
 * prize_pool, submissions_count, winner, some_contestants, judges, is_trending
 * (evidence/rea-2026-10-17/api-bodies-digest.json → contests items) via the
 * shared mapper in src/lib/contests.ts. Additive change: the wave-2 keys are
 * untouched. */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { mapContestBody } from "@/lib/contests";

export const dynamic = "force-dynamic";

export async function GET() {
  const contests = await db.contest.findMany({ orderBy: { startAt: "desc" } });
  return NextResponse.json({
    items: contests.map((c) => mapContestBody(c)),
  });
}
