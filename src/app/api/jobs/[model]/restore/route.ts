/** POST /api/jobs/{jobId}/restore — restore a soft-deleted job from the library trash. */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MODEL_CATALOG } from "@/lib/catalog";
import { jobToJson } from "@/lib/job-shape";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ model: string }> }) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { model: jobId } = await params;

  const job = await db.generation.findUnique({ where: { id: jobId } });
  if (!job || job.userId !== auth.user.id) {
    return NextResponse.json({ detail: "job not found" }, { status: 404 });
  }
  if (!job.deletedAt) {
    return NextResponse.json({ detail: "job is not in trash" }, { status: 409 });
  }
  const updated = await db.generation.update({
    where: { id: job.id },
    data: { deletedAt: null },
  });
  return NextResponse.json({ job: jobToJson(updated, MODEL_CATALOG[job.modelVersion]?.label) });
}
