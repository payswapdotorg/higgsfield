import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser, issueSessionToken, sessionCookieOptions, SESSION_COOKIE, unauthorizedDetail } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * §1d stale-token behavior: rotate the session token. The client wrapper retries the original
 * request once after this call.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return NextResponse.json(unauthorizedDetail(), { status: 401 });
  // Touch the user so updatedAt advances alongside the rotated token (bookkeeping only).
  await db.user.update({ where: { id: user.id }, data: {} });
  const token = issueSessionToken(user);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
