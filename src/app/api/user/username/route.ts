import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

const claimUsernameSchema = z.object({
  username: z
    .string()
    .min(3, "username must be at least 3 characters")
    .max(30, "username must be at most 30 characters")
    .regex(
      /^[a-z0-9_]+$/,
      "username must contain only lowercase letters, digits, and underscores",
    ),
});

/** POST /api/user/username — claim a username (idempotent for the owner). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  const body = await parseBody(req, claimUsernameSchema);
  if (!body.ok) return body.res;

  const existing = await db.user.findUnique({
    where: { username: body.data.username },
  });
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "username_taken" }, { status: 409 });
  }

  // Claiming a username completes onboarding — DB event timestamp
  // (spec-sanctioned exception to the fixed-constant rule).
  const updated = await db.user.update({
    where: { id: user.id },
    data: { username: body.data.username, onboardedAt: new Date() },
  });

  return NextResponse.json(serializeUser(updated));
}
