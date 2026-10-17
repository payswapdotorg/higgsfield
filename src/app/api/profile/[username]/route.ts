/**
 * GET /api/profile/[username] — HF-W5 public profile body for any seeded user.
 *
 * Same verbatim shape as /api/user/profile (evidence:
 * evidence/rea-2026-10-17/api-bodies-digest.json → `profile`) but addressed by
 * username — the data source of the /profile/[username] route family
 * (route-preload-manifest.json keys /_private/profile/$username*). Unknown
 * usernames → 404 ({"detail":"Not found"} — the clone's resource-miss convention,
 * matching /api/community/contests/[slug]).
 *
 * Public (no auth): profile content is public-facing; the full_name exposure is
 * gated by show_full_name at the PAGE layer exactly like the live product
 * (the captured body itself carries full_name alongside show_full_name:false —
 * the API body stays verbatim).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { profileToJson } from "@/lib/profile-shape";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ detail: "Not found" }, { status: 404 });
  }
  return NextResponse.json(profileToJson(user));
}
