/**
 * /api/characters/{id} — character detail (HF-W7).
 *
 * - GET    → {character: CharacterJson, jobs: [JobJson…]} — the character plus its
 *            linked generations (characterId), newest first. Calls ensureWorker()
 *            so client polling of this route advances the queue — the same law as
 *            GET /api/jobs/accessible (serverless thaw semantics, DEPLOYMENT.md §5).
 * - PATCH  → {name?, spec?, reference_image?} — spec fully re-validated against the
 *            option library; reference_image must be a data:image/… URI under ~4MB
 *            (explicit null clears it).
 * - DELETE → hard delete. Linked generations keep their (now dangling) characterId —
 *            jobToJson is unaffected and asset resolution treats dangling as absent.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jobToJson } from "@/lib/job-shape";
import { ensureWorker } from "@/server/worker";
import { characterToJson, resolveCharacterAssets } from "@/lib/character-shape";
import { validateSpec } from "@/lib/influencer-options";

export const dynamic = "force-dynamic";

const MAX_REFERENCE_BYTES = 4 * 1024 * 1024; // ~4MB decoded payload (spec: clone-side upload cap)

const PatchCharacterSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    spec: z.record(z.string(), z.string()).optional(),
    reference_image: z.string().nullable().optional(),
  })
  .strict();

async function findOwnedCharacter(userId: string, id: string) {
  const character = await db.character.findUnique({ where: { id } });
  if (!character || character.userId !== userId) return null;
  return character;
}

/** Validate a data:image/… reference URI: prefix + base64 charset + decoded size cap. */
function validateReferenceImage(uri: string): string | null {
  const comma = uri.indexOf(",");
  if (!uri.startsWith("data:image/") || comma === -1) {
    return "reference_image must be a data:image/…;base64 URI";
  }
  const header = uri.slice(0, comma);
  if (!header.includes("base64")) {
    return "reference_image must use base64 encoding";
  }
  const payload = uri.slice(comma + 1);
  if (!/^[A-Za-z0-9+/=]+$/.test(payload)) {
    return "reference_image payload is not valid base64";
  }
  const approxBytes = Math.floor((payload.length * 3) / 4);
  if (approxBytes > MAX_REFERENCE_BYTES) {
    return `reference_image exceeds the ~4MB limit (${(approxBytes / (1024 * 1024)).toFixed(1)}MB)`;
  }
  return null;
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  ensureWorker(); // polling this route advances the queue (accessible-route law)

  const { id } = await params;
  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) return NextResponse.json({ detail: "character not found" }, { status: 404 });

  const [assets, jobs] = await Promise.all([
    resolveCharacterAssets([character.id]),
    db.generation.findMany({
      where: { characterId: character.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return NextResponse.json({
    character: characterToJson(character, assets.get(character.id)!),
    jobs: jobs.map((g) => jobToJson(g)),
  });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) return NextResponse.json({ detail: "character not found" }, { status: 404 });

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = PatchCharacterSchema.safeParse(parsedBody);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".");
    return NextResponse.json(
      { detail: `invalid params${path ? ` at ${path}` : ""}: ${first?.message ?? "invalid body"}` },
      { status: 400 }
    );
  }
  const body = parsed.data;

  // Spec (when present) fully re-validated; replaces the stored spec.
  let specJson: string | undefined;
  if (body.spec !== undefined) {
    const specCheck = validateSpec(body.spec);
    if (!specCheck.ok) {
      return NextResponse.json({ detail: specCheck.error }, { status: 400 });
    }
    specJson = JSON.stringify(specCheck.spec);
  }

  if (body.reference_image !== undefined && body.reference_image !== null) {
    const problem = validateReferenceImage(body.reference_image);
    if (problem) return NextResponse.json({ detail: problem }, { status: 400 });
  }

  const updated = await db.character.update({
    where: { id: character.id },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(specJson !== undefined ? { spec: specJson } : {}),
      // Explicit null clears the reference; an absent key leaves it untouched.
      ...(body.reference_image !== undefined ? { referenceImage: body.reference_image } : {}),
    },
  });
  const assets = await resolveCharacterAssets([updated.id]);
  return NextResponse.json({
    character: characterToJson(updated, assets.get(updated.id)!),
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const character = await findOwnedCharacter(auth.user.id, id);
  if (!character) return NextResponse.json({ detail: "character not found" }, { status: 404 });

  // Hard delete — linked generations keep their dangling characterId by design
  // (no FK; jobToJson unaffected). Disclosed clone-side choice.
  await db.character.delete({ where: { id: character.id } });
  return NextResponse.json({ ok: true });
}
