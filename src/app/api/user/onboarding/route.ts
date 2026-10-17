import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";

const onboardingSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
});

/** POST /api/user/onboarding — persist onboarding quiz answers as JSON. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser(req);

  const body = await parseBody(req, onboardingSchema);
  if (!body.ok) return body.res;

  await db.user.update({
    where: { id: user.id },
    data: { quizAnswers: JSON.stringify(body.data.answers) },
  });

  return NextResponse.json({ saved: true });
}
