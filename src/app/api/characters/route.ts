/**
 * /api/characters — the AI Influencer character collection (HF-W7).
 *
 * - GET  → {characters: [CharacterJson…]} — the user's characters with resolved
 *          portrait/full-body asset urls (latest done linked generations).
 * - POST → create a character. Body: {name?, spec} (snake_case; unknown spec
 *          keys/values → 400 with a clear message; name defaults to "Influencer").
 *
 * Mirrors the existing /api routes: requireUser auth gate, the in-memory
 * fixed-window limiter on the mutating POST (wave-4 H3 semantics — attempts
 * count, not successes), {detail} error bodies, force-dynamic.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { checkJobsRateLimit } from "@/server/rate-limit";
import { characterToJson, resolveCharacterAssets } from "@/lib/character-shape";
import { validateSpec } from "@/lib/influencer-options";

export const dynamic = "force-dynamic";

const CreateCharacterSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    spec: z.record(z.string(), z.string()).optional(),
  })
  .strict();

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const characters = await db.character.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "desc" },
  });
  const assets = await resolveCharacterAssets(characters.map((c) => c.id));
  return NextResponse.json({
    characters: characters.map((c) =>
      characterToJson(c, assets.get(c.id) ?? { portraitAssetUrl: null, fullBodyAssetUrl: null })
    ),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  // H3 limiter (attempts count): character creation is the spammable mutation
  // surface of this studio — same treatment as job-creation POSTs.
  const rl = checkJobsRateLimit(user.id);
  if (rl.limited) {
    return NextResponse.json(
      { detail: "challenge" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = CreateCharacterSchema.safeParse(parsedBody);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".");
    return NextResponse.json(
      { detail: `invalid params${path ? ` at ${path}` : ""}: ${first?.message ?? "invalid body"}` },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Spec validation against the option library (unknown keys/values → 400).
  const specCheck = validateSpec(body.spec);
  if (!specCheck.ok) {
    return NextResponse.json({ detail: specCheck.error }, { status: 400 });
  }

  const created = await db.character.create({
    data: {
      userId: user.id,
      name: body.name ?? "Influencer", // spec: default name (clone-side; not captured)
      spec: JSON.stringify(specCheck.spec),
      referenceImage: null,
    },
  });
  return NextResponse.json({
    character: characterToJson(created, { portraitAssetUrl: null, fullBodyAssetUrl: null }),
  });
}
