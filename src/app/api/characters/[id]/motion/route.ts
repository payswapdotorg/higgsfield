/**
 * POST /api/characters/{id}/motion — queue ONE motion video job (HF-W7): the
 * Motion tab's "choose a preset and watch them perform it" action. The job's
 * identity input is the character's LATEST DONE PORTRAIT (inputImages[0] —
 * the adapter feeds it to the wan2.2 image-to-video engine as the reference
 * frame), and the prompt is the preset's action text + the identity-continuity
 * clause, pre-rendered here via buildMotionPrompt(preset, spec) so worker
 * retries render identically (determinism law — same as generate/route.ts).
 *
 * Precondition — a done portrait: a character with no done influencer_portrait
 * generation has no identity reference to animate yet → 400 telling the client
 * to generate the character sheet first. The portrait resolves through
 * resolveCharacterAssets (the job pipeline stays the single asset truth).
 *
 * Credit law (§1a mirror of POST /api/jobs/{model}): motion costs 5 credits
 * (spec: clone-side — the live motion pricing was NOT captured; disclosed),
 * spent atomically with the job creation inside ONE interactive transaction.
 * Honest pre-check → terminal 402 {detail, needed, available}; a lost race
 * throws InsufficientCreditsError inside the transaction, which rolls back
 * (no job, no burn) and maps to the same 402 shape with err.available.
 *
 * Determinism: the seed derives from fnv1a(character.id + updatedAt +
 * preset.id) — re-animating after a spec edit (or with a different preset)
 * rolls a fresh seed; re-animating the same state reproduces it.
 *
 * Serverless thaw semantics: ensureWorker() runs AFTER the burn — on a cold
 * serverless invocation the in-process queue loop starts with this job
 * already queued (same law as POST /api/jobs/{model}); the client polling
 * GET /api/characters/{id} re-thaws the loop on any later cold start.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jobToJson } from "@/lib/job-shape";
import { InsufficientCreditsError, spendCredits, totalAvailableCredits } from "@/server/credits";
import { checkJobsRateLimit } from "@/server/rate-limit";
import { ensureWorker } from "@/server/worker";
import { fnv1a } from "@/lib/seeded-rng";
import {
  INFLUENCER_MOTION_ASPECT,
  INFLUENCER_MOTION_COST,
  INFLUENCER_MOTION_MODEL_VERSION,
  INFLUENCER_MOTION_SIZE,
  parseSpecJson,
  resolveCharacterAssets,
} from "@/lib/character-shape";
import { findMotionPreset } from "@/lib/influencer-options";
import { buildMotionPrompt } from "@/server/influencer/prompt";
import { noticesForJobSetType } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const MotionBodySchema = z.object({ preset_id: z.string().min(1) }).strict();

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const rl = checkJobsRateLimit(user.id);
  if (rl.limited) {
    return NextResponse.json(
      { detail: "challenge" },
      { status: 429, headers: { "retry-after": String(rl.retryAfterSeconds) } }
    );
  }

  const { id } = await params;
  const character = await db.character.findUnique({ where: { id } });
  if (!character || character.userId !== user.id) {
    return NextResponse.json({ detail: "character not found" }, { status: 404 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = MotionBodySchema.safeParse(parsedBody);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".");
    return NextResponse.json(
      { detail: `invalid params${path ? ` at ${path}` : ""}: ${first?.message ?? "invalid body"}` },
      { status: 400 }
    );
  }

  const preset = findMotionPreset(parsed.data.preset_id);
  if (!preset) {
    return NextResponse.json(
      { detail: `unknown motion preset: ${parsed.data.preset_id}` },
      { status: 400 }
    );
  }

  // Motion's identity input: the latest done portrait (asset truth = the job
  // pipeline — resolveCharacterAssets reads the linked done generation rows).
  const assets = await resolveCharacterAssets([character.id]);
  const portraitAssetUrl = assets.get(character.id)?.portraitAssetUrl ?? null;
  if (!portraitAssetUrl) {
    return NextResponse.json(
      {
        detail: "generate the character sheet first — motion needs the character's portrait",
      },
      { status: 400 }
    );
  }

  const spec = parseSpecJson(character.spec);
  const prompt = buildMotionPrompt(preset, spec);

  // Deterministic seed from character id + updatedAt + preset id — fnv1a only.
  const seed = fnv1a(
    `influencer:${character.id}:${character.updatedAt.toISOString()}:${preset.id}`
  );

  // Honest pre-check: report the full 5 needed against motion availability.
  const available = await totalAvailableCredits(db, user.id, "influencer_motion");
  if (available < INFLUENCER_MOTION_COST) {
    return NextResponse.json(
      {
        detail: "insufficient credits",
        needed: INFLUENCER_MOTION_COST,
        available,
      },
      { status: 402 }
    );
  }

  let job;
  try {
    job = await db.$transaction(async (tx) => {
      const created = await tx.generation.create({
        data: {
          userId: user.id,
          folderId: null,
          modelVersion: INFLUENCER_MOTION_MODEL_VERSION,
          jobSetType: "influencer_motion",
          kind: "video",
          prompt,
          aspectRatio: INFLUENCER_MOTION_ASPECT,
          width: INFLUENCER_MOTION_SIZE.width,
          height: INFLUENCER_MOTION_SIZE.height,
          resolution: "1k",
          batchSize: 1,
          inputImages: JSON.stringify([portraitAssetUrl]),
          workspaceId: `ws_${user.id}`,
          status: "queued",
          characterId: character.id,
          seed,
          cost: INFLUENCER_MOTION_COST,
          notices: JSON.stringify(noticesForJobSetType("influencer_motion")),
        },
      });
      const spend = await spendCredits(tx, {
        userId: user.id,
        jobSetType: "influencer_motion",
        cost: INFLUENCER_MOTION_COST,
        jobId: created.id,
      });
      return tx.generation.update({
        where: { id: created.id },
        data: { creditSpend: JSON.stringify(spend) },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      // Lost a race against the pre-check (concurrent spend) — transaction rolled
      // back cleanly; report the best-effort availability from the failure.
      return NextResponse.json(
        {
          detail: "insufficient credits",
          needed: INFLUENCER_MOTION_COST,
          available: err.available,
        },
        { status: 402 }
      );
    }
    console.error("[characters motion POST] transaction failed:", err);
    return NextResponse.json({ detail: "internal error" }, { status: 500 });
  }

  ensureWorker();
  return NextResponse.json({ job: jobToJson(job) });
}
