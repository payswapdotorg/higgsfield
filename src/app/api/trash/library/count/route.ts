/** GET /api/trash/library/count — library trash count (HF-W2 §1b / §3.3). */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const count = await db.generation.count({
    where: { userId: auth.user.id, deletedAt: { not: null } },
  });
  return NextResponse.json({ count });
}
