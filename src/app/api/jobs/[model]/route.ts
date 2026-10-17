/**
 * /api/jobs/{model} — the generation pipeline route family (HF-W2 §1a + §1b).
 *
 * - POST   /api/jobs/{model}      → create a job (model = catalog slug). Body is validated against
 *                                   the §1a shape VERBATIM (strict, exact field names).
 * - GET    /api/jobs/{jobId}      → job detail (dynamic segment is a JOB ID for non-POST verbs —
 *                                   Next.js forbids two different slug names at one path level).
 * - DELETE /api/jobs/{jobId}      → soft-delete into library trash (?purge=1 hard-deletes).
 *
 * Aspect presets drive width/height server-side (3:4 → 896×1200 @1k; @2k doubles).
 * Cost = MODEL_CATALOG creditCost × batch_size; credits are spent atomically with job creation.
 * DataDome-style challenges are modeled as a seeded 429 (MOCK_CHALLENGE_PCT, default 0).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MODEL_CATALOG, presetFor, noticesForJobSetType, type AspectRatio, type Resolution } from "@/lib/catalog";
import { jobToJson } from "@/lib/job-shape";
import { InsufficientCreditsError, spendCredits } from "@/server/credits";
import { ensureWorker } from "@/server/worker";
import { fnv1a, mulberry32 } from "@/lib/seeded-rng";

export const dynamic = "force-dynamic";

const CreateJobSchema = z
  .object({
    params: z
      .object({
        prompt: z.string().min(1).max(4000),
        aspect_ratio: z.enum(["3:4", "16:9", "1:1"]),
        resolution: z.enum(["1k", "2k"]),
        batch_size: z.number().int().min(1),
        is_storyboard: z.boolean(),
        is_zoom_control: z.boolean(),
        use_unlim: z.boolean(),
        width: z.number().int().min(1),
        height: z.number().int().min(1),
        input_images: z.array(z.string()),
      })
      .strict(),
    use_unlim: z.boolean(),
  })
  .strict();

function challengePct(): number {
  const parsed = Number(process.env.MOCK_CHALLENGE_PCT ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
}

type Ctx = { params: Promise<{ model: string }> };

async function findOwnedJob(userId: string, id: string) {
  const job = await db.generation.findUnique({ where: { id } });
  if (!job || job.userId !== userId) return null;
  return job;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const { model: modelSlug } = await params;
  const model = MODEL_CATALOG[modelSlug];
  if (!model) {
    return NextResponse.json({ detail: `unknown model: ${modelSlug}` }, { status: 404 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = CreateJobSchema.safeParse(parsedBody);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const path = first?.path.join(".");
    return NextResponse.json(
      { detail: `invalid params${path ? ` at ${path}` : ""}: ${first?.message ?? "invalid body"}` },
      { status: 400 }
    );
  }
  const body = parsed.data;

  if (body.params.batch_size > model.maxBatch) {
    return NextResponse.json(
      { detail: `batch_size exceeds model maximum of ${model.maxBatch}` },
      { status: 400 }
    );
  }
  if (!model.aspects.includes(body.params.aspect_ratio as AspectRatio)) {
    return NextResponse.json(
      { detail: `aspect_ratio ${body.params.aspect_ratio} not supported by ${model.slug}` },
      { status: 400 }
    );
  }
  if (!model.resolutions.includes(body.params.resolution as Resolution)) {
    return NextResponse.json(
      { detail: `resolution ${body.params.resolution} not supported by ${model.slug}` },
      { status: 400 }
    );
  }

  // Seeded challenge injection (DataDome-modeled; deterministic per user+prompt).
  if (challengePct() > 0) {
    const rng = mulberry32(fnv1a(`challenge:${user.id}:${body.params.prompt}`));
    if (Math.floor(rng() * 100) < challengePct()) {
      return NextResponse.json({ detail: "challenge" }, { status: 429 });
    }
  }

  // §1a: aspect presets drive width/height — server values win over client-sent ones.
  const { width, height } = presetFor(body.params.aspect_ratio, body.params.resolution);
  const cost = model.creditCost * body.params.batch_size;

  // Folder association rides on the query string (NOT the body) so the §1a body stays verbatim.
  const folderId = new URL(req.url).searchParams.get("folder_id");
  if (folderId) {
    const folder = await db.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== user.id) {
      return NextResponse.json({ detail: "folder not found" }, { status: 404 });
    }
  }

  let created;
  try {
    created = await db.$transaction(async (tx) => {
      const job = await tx.generation.create({
        data: {
          userId: user.id,
          folderId: folderId ?? null,
          modelVersion: model.slug,
          jobSetType: model.jobSetType,
          kind: model.kind,
          prompt: body.params.prompt,
          aspectRatio: body.params.aspect_ratio,
          resolution: body.params.resolution,
          width,
          height,
          batchSize: body.params.batch_size,
          inputImages: JSON.stringify(body.params.input_images),
          workspaceId: `ws_${user.id}`,
          status: "queued",
          seed: 0,
          cost,
          notices: JSON.stringify(noticesForJobSetType(model.jobSetType)),
        },
      });
      // Deterministic per-job seed (drives the mock adapter's jitter/failure/fixture choice).
      const seed = fnv1a(`${job.id}:${model.slug}:${body.params.prompt}`);
      const spend = await spendCredits(tx, {
        userId: user.id,
        jobSetType: model.jobSetType,
        cost,
        jobId: job.id,
      });
      return await tx.generation.update({
        where: { id: job.id },
        data: { seed, creditSpend: JSON.stringify(spend) },
      });
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      return NextResponse.json(
        { detail: "insufficient credits", needed: err.needed, available: err.available },
        { status: 402 }
      );
    }
    console.error("[jobs POST] transaction failed:", err);
    return NextResponse.json({ detail: "internal error" }, { status: 500 });
  }

  ensureWorker();
  return NextResponse.json({ job: jobToJson(created, model.label) });
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { model: jobId } = await params;
  const job = await findOwnedJob(auth.user.id, jobId);
  if (!job) return NextResponse.json({ detail: "job not found" }, { status: 404 });
  return NextResponse.json({ job: jobToJson(job, MODEL_CATALOG[job.modelVersion]?.label) });
}

/** Soft-delete (move to library trash). `?purge=1` hard-deletes. */
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { model: jobId } = await params;
  const url = new URL(req.url);
  const purge = url.searchParams.get("purge") === "1";

  const job = await findOwnedJob(auth.user.id, jobId);
  if (!job) return NextResponse.json({ detail: "job not found" }, { status: 404 });

  if (purge) {
    await db.feedPublication.deleteMany({ where: { generationId: job.id } });
    await db.generation.delete({ where: { id: job.id } });
    return NextResponse.json({ ok: true, purged: true });
  }

  const updated = await db.generation.update({
    where: { id: job.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ job: jobToJson(updated, MODEL_CATALOG[job.modelVersion]?.label) });
}
