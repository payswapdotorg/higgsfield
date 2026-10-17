import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { issueSessionToken, sessionCookieOptions, SESSION_COOKIE } from "@/lib/auth";
import { userToJson } from "@/lib/user-shape";
import { fnv1a } from "@/lib/seeded-rng";

export const dynamic = "force-dynamic";

const LoginSchema = z.object({
  email: z.string().min(3).max(254).regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, "must be a valid email"),
  username: z
    .string()
    .min(1)
    .max(32)
    .regex(/^[a-z0-9._-]+$/)
    .optional(),
});

export async function POST(req: NextRequest) {
  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = LoginSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message ?? "invalid body" }, { status: 400 });
  }
  const { email, username } = parsed.data;

  let user = await db.user.findUnique({ where: { email } });
  if (!user) {
    const base =
      username ??
      (email.split("@")[0].toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 24) || "creator");
    let candidate = base;
    // Deterministic fallback on collision.
    if (await db.user.findUnique({ where: { username: candidate } })) {
      candidate = `${base}-${fnv1a(email) % 10000}`;
    }
    user = await db.user.create({
      data: { email, username: candidate, displayName: base, planType: "free" },
    });
  }

  const token = issueSessionToken(user);
  const res = NextResponse.json({ user: userToJson(user) });
  res.cookies.set({ ...sessionCookieOptions(), value: token });
  return res;
}
