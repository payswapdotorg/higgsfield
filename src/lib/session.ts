import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { db } from "@/lib/db";

/** Fixed guest identity — every anonymous request resolves to this user. */
export const GUEST_EMAIL = "guest@hf-studio.local";

/** Must match the secret used by the NextAuth route handler. */
export const AUTH_SECRET = process.env.NEXTAUTH_SECRET ?? "hf-studio-dev-secret";

/**
 * Resolve the current user for ANY request (route handlers, wave 1).
 *
 * - Signed-in JWT (credentials "Guest" provider or Google when configured):
 *   upserts the User row by token email and returns it.
 * - Anonymous request: returns the seeded GUEST user so the whole app is
 *   browsable logged-out (guest mode).
 *
 * Deterministic: no wall-clock reads here — only DB-managed timestamps.
 */
export async function getCurrentUser(req: NextRequest) {
  const token = await getToken({ req, secret: AUTH_SECRET });

  if (token?.email) {
    const email = String(token.email).trim().toLowerCase();
    if (email) {
      // Guest-mode fallback safe: provision the row if a token references a
      // user that does not exist yet (e.g. fresh DB after reseed).
      return db.user.upsert({
        where: { email },
        update: {},
        create: { email, credits: 20, planTier: "free" },
      });
    }
  }

  return db.user.upsert({
    where: { email: GUEST_EMAIL },
    update: {},
    create: {
      email: GUEST_EMAIL,
      username: "guest",
      credits: 20,
      planTier: "free",
      onboardedAt: new Date(0), // fixed epoch — seeded "already onboarded" guest
    },
  });
}
