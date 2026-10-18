/**
 * POST /api/characters/{id}/generate — the AI Influencer character-sheet pipeline
 * (HF-W7): burns the evidence credit cost and queues TWO jobs (portrait +
 * full-body) whose prompts are pre-rendered here and rendered by the influencer
 * image provider (env-gated; mock in tests).
 *
 * Credit law (§1a mirror of POST /api/jobs/{model}): the total cost — 1.125
 * credits (ev: evidence node 2252 '1.125 credits') — is spent atomically with
 * BOTH job creations inside ONE interactive transaction (two spendCredits calls,
 * one per job, each with its own jobSetType so the documented burn order —
 * free-gens grant → model pool → daily → wallet — applies per job exactly as in
 * the generate flow). If the second spend fails, the whole transaction rolls
 * back: no jobs, no burn. Insufficient credits → the same terminal 402 shape
 * ({detail, needed, available}); the pre-check computes the union availability
 * across both jobSetTypes (their grants/model-pools differ; daily/wallet are
 * shared) so `needed` reports the full 1.125 honestly.
 *
 * Determinism: per-job seeds derive from fnv1a(character.id + updatedAt + role)
 * — re-generating after a spec edit rolls fresh seeds; the stored prompt is the
 * pre-rendered string, so worker retries render identically.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { jobToJson } from "@/lib/job-shape";
import { InsufficientCreditsError, spendCredits, totalAvailableCredits } from "@/server/credits";
import { checkJobsRateLimit } from "@/server/rate-limit";
import { ensureWorker } from "@/server/worker";
import { fnv1a } from "@/lib/seeded-rng";
import {
  INFLUENCER_FULLBODY_ASPECT,
  INFLUENCER_FULLBODY_SIZE,
  INFLUENCER_GENERATE_COST_TOTAL,
  INFLUENCER_MODEL_VERSION,
  INFLUENCER_PORTRAIT_ASPECT,
  INFLUENCER_PORTRAIT_SIZE,
  INFLUENCER_SHEET_COST,
  parseSpecJson,
} from "@/lib/character-shape";
import { buildFullBodyPrompt, buildPortraitPrompt } from "@/server/influencer/prompt";
import { noticesForJobSetType } from "@/lib/catalog";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

/** Union availability across both sheet jobSetTypes (grants/model-pools differ; daily+wallet shared). */
async function unionAvailableCredits(userId: string): Promise<number> {
  const [portraitAvail, fullBodyAvail, sharedPools] = await Promise.all([
    totalAvailableCredits(db, userId, "influencer_portrait"),
    totalAvailableCredits(db, userId, "influencer_fullbody"),
    db.creditPool.findMany({ where: { userId, kind: { in: ["daily", "wallet"] } } }),
  ]);
  const shared = sharedPools.reduce((sum, p) => sum + p.balance, 0);
  return portraitAvail + fullBodyAvail - shared;
}

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

  // A body is optional on this route (no client-settable params) — tolerate
  // empty/absent bodies, reject non-object ones.
  try {
    const text = await req.text();
    if (text.trim().length > 0) {
      const v = JSON.parse(text) as unknown;
      if (typeof v !== "object" || v === null || Array.isArray(v)) {
        return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
      }
    }
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }

  const spec = parseSpecJson(character.spec);
  const portraitPrompt = buildPortraitPrompt(spec);
  const fullBodyPrompt = buildFullBodyPrompt(spec);
  const inputImages = JSON.stringify(character.referenceImage ? [character.referenceImage] : []);

  // Deterministic seeds from character id + updatedAt (+ role tag) — fnv1a only.
  const iso = character.updatedAt.toISOString();
  const portraitSeed = fnv1a(`influencer:${character.id}:${iso}:portrait`);
  const fullBodySeed = fnv1a(`influencer:${character.id}:${iso}:fullbody`);

  // Honest pre-check: report the full 1.125 needed against union availability.
  const available = await unionAvailableCredits(user.id);
  if (available < INFLUENCER_GENERATE_COST_TOTAL) {
    return NextResponse.json(
      {
        detail: "insufficient credits",
        needed: INFLUENCER_GENERATE_COST_TOTAL,
        available,
      },
      { status: 402 }
    );
  }

  let created;
  try {
    created = await db.$transaction(async (tx) => {
      const base = {
        userId: user.id,
        folderId: null,
        modelVersion: INFLUENCER_MODEL_VERSION,
        kind: "image",
        resolution: "1k",
        batchSize: 1,
        inputImages,
        workspaceId: `ws_${user.id}`,
        status: "queued",
        characterId: character.id,
      } as const;

      const portraitJob = await tx.generation.create({
        data: {
          ...base,
          jobSetType: "influencer_portrait",
          prompt: portraitPrompt,
          aspectRatio: INFLUENCER_PORTRAIT_ASPECT,
          width: INFLUENCER_PORTRAIT_SIZE.width,
          height: INFLUENCER_PORTRAIT_SIZE.height,
          seed: portraitSeed,
          cost: INFLUENCER_SHEET_COST,
          notices: JSON.stringify(noticesForJobSetType("influencer_portrait")),
        },
      });
      const portraitSpend = await spendCredits(tx, {
        userId: user.id,
        jobSetType: "influencer_portrait",
        cost: INFLUENCER_SHEET_COST,
        jobId: portraitJob.id,
      });

      const fullBodyJob = await tx.generation.create({
        data: {
          ...base,
          jobSetType: "influencer_fullbody",
          prompt: fullBodyPrompt,
          aspectRatio: INFLUENCER_FULLBODY_ASPECT,
          width: INFLUENCER_FULLBODY_SIZE.width,
          height: INFLUENCER_FULLBODY_SIZE.height,
          seed: fullBodySeed,
          cost: INFLUENCER_SHEET_COST,
          notices: JSON.stringify(noticesForJobSetType("influencer_fullbody")),
        },
      });
      const fullBodySpend = await spendCredits(tx, {
        userId: user.id,
        jobSetType: "influencer_fullbody",
        cost: INFLUENCER_SHEET_COST,
        jobId: fullBodyJob.id,
      });

      const [portraitUpdated, fullBodyUpdated] = await Promise.all([
        tx.generation.update({
          where: { id: portraitJob.id },
          data: { creditSpend: JSON.stringify(portraitSpend) },
        }),
        tx.generation.update({
          where: { id: fullBodyJob.id },
          data: { creditSpend: JSON.stringify(fullBodySpend) },
        }),
      ]);
      return { portraitJob: portraitUpdated, fullBodyJob: fullBodyUpdated };
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      // Lost a race against the pre-check (concurrent spend) — transaction rolled
      // back cleanly; report the best-effort availability from the failure.
      return NextResponse.json(
        {
          detail: "insufficient credits",
          needed: INFLUENCER_GENERATE_COST_TOTAL,
          available: err.available,
        },
        { status: 402 }
      );
    }
    console.error("[characters generate POST] transaction failed:", err);
    return NextResponse.json({ detail: "internal error" }, { status: 500 });
  }

  ensureWorker();
  return NextResponse.json({
    jobs: [jobToJson(created.portraitJob), jobToJson(created.fullBodyJob)],
  });
}
