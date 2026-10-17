/**
 * GET  /api/folders — list folders with recent_jobs_count (non-deleted generations per folder).
 * POST /api/folders — create a folder.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(64),
});

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const folders = await db.folder.findMany({
    where: { userId: auth.user.id },
    orderBy: { createdAt: "asc" },
  });
  const counts = await db.generation.groupBy({
    by: ["folderId"],
    where: { userId: auth.user.id, deletedAt: null, folderId: { not: null } },
    _count: { _all: true },
  });
  const countMap = new Map(counts.map((c) => [c.folderId, c._count._all]));

  return NextResponse.json({
    folders: folders.map((f) => ({
      id: f.id,
      name: f.name,
      recent_jobs_count: countMap.get(f.id) ?? 0,
      created_at: f.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  let parsedBody: unknown;
  try {
    parsedBody = await req.json();
  } catch {
    return NextResponse.json({ detail: "invalid JSON body" }, { status: 400 });
  }
  const parsed = CreateFolderSchema.safeParse(parsedBody);
  if (!parsed.success) {
    return NextResponse.json({ detail: parsed.error.issues[0]?.message ?? "invalid body" }, { status: 400 });
  }

  const existing = await db.folder.findFirst({
    where: { userId: auth.user.id, name: parsed.data.name },
  });
  if (existing) {
    return NextResponse.json({ detail: "folder name already exists" }, { status: 409 });
  }

  const folder = await db.folder.create({
    data: { userId: auth.user.id, name: parsed.data.name },
  });
  return NextResponse.json({
    folder: {
      id: folder.id,
      name: folder.name,
      recent_jobs_count: 0,
      created_at: folder.createdAt.toISOString(),
    },
  });
}
