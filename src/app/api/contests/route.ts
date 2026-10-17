import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSizeParam } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeContest } from "@/lib/serialize";

/** GET /api/contests?size= — contests ordered by startAt desc. */
export async function GET(req: NextRequest) {
  await getCurrentUser(req);

  const url = new URL(req.url);
  const size = parseSizeParam(url, 50, 200);

  const contests = await db.contest.findMany({
    orderBy: { startAt: "desc" },
    take: size,
  });

  return NextResponse.json({
    items: contests.map(serializeContest),
  });
}
