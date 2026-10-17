/**
 * Session helpers (§1d: JWT session via httpOnly cookie or Authorization: Bearer;
 * stale tokens return 401 {"detail":"Invalid or expired token"} and the client retries once).
 */
import { db } from "@/lib/db";
import { verifySession, signSession } from "@/lib/jwt";
import type { User } from "@prisma/client";

export const SESSION_COOKIE = "hf_session";

function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() === name) return part.slice(idx + 1).trim();
  }
  return null;
}

export function tokenFromRequest(req: Request): string | null {
  const auth = req.headers.get("authorization");
  if (auth && auth.startsWith("Bearer ")) return auth.slice(7).trim();
  return readCookie(req.headers.get("cookie"), SESSION_COOKIE);
}

export async function getSessionUser(req: Request): Promise<User | null> {
  const token = tokenFromRequest(req);
  if (!token) return null;
  const claims = verifySession(token);
  if (!claims) return null;
  return db.user.findUnique({ where: { id: claims.sub } });
}

export function unauthorizedDetail(): { detail: string } {
  return { detail: "Invalid or expired token" };
}

export async function requireUser(req: Request): Promise<{ user: User } | { response: Response }> {
  const user = await getSessionUser(req);
  if (!user) {
    return { response: Response.json(unauthorizedDetail(), { status: 401 }) };
  }
  return { user };
}

export function sessionCookieOptions() {
  return {
    name: SESSION_COOKIE,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  };
}

export function issueSessionToken(user: User): string {
  return signSession(user.id, `ws_${user.id}`);
}
