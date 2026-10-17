/**
 * GET /api/jobs/accessible — the jobs list (HF-W2 §1b, mirrors /fnf/jobs/accessible).
 * Returns {"jobs":[…],"has_more":bool} for the authenticated user.
 *
 * Query params (clone extensions beyond §1b are documented):
 * - job_set_type (repeatable) — filter by job set type
 * - folder_id — scope to a folder
 * - trash=1 — return soft-deleted jobs instead of active ones
 * - limit / offset — pagination
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MODEL_CATALOG } from "@/lib/catalog";
import { jobToJson } from "@/lib/job-shape";
import { ensureWorker } from "@/server/worker";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  ensureWorker();

  const url = new URL(req.url);
  const jobSetTypes = url.searchParams.getAll("job_set_type").filter((v) => v.length > 0);
  const folderId = url.searchParams.get("folder_id");
  const trash = url.searchParams.get("trash");
  const limit = clampInt(url.searchParams.get("limit"), 1, 200, 50);
  const offset = clampInt(url.searchParams.get("offset"), 0, 1_000_000, 0);

  const where: Prisma.GenerationWhereInput = {
    userId: auth.user.id,
    deletedAt: trash === "1" || trash === "true" ? { not: null } : null,
  };
  if (jobSetTypes.length > 0) where.jobSetType = { in: jobSetTypes };
  if (folderId) where.folderId = folderId;

  const [jobs, total] = await Promise.all([
    db.generation.findMany({ where, orderBy: { createdAt: "desc" }, take: limit, skip: offset }),
    db.generation.count({ where }),
  ]);

  return NextResponse.json({
    jobs: jobs.map((g) => jobToJson(g, MODEL_CATALOG[g.modelVersion]?.label)),
    has_more: offset + jobs.length < total,
  });
}

function clampInt(raw: string | null, min: number, max: number, fallback: number): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
