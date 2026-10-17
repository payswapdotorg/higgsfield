/**
 * HF-W5 — server-component session resolution (page-side counterpart of
 * src/lib/auth.ts requireUser, which takes a Request). Reads the hf_session cookie
 * via next/headers so /me/settings pages can render their evidence-shaped bodies
 * server-side (SSR greps in the wave-5 verification rely on this).
 */
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/jwt";
import { SESSION_COOKIE } from "@/lib/auth";
import type { User } from "@prisma/client";

export async function pageUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const claims = verifySession(token);
  if (!claims) return null;
  return db.user.findUnique({ where: { id: claims.sub } });
}
