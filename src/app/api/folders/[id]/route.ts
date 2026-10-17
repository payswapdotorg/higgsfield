/**
 * GET    /api/folders/{id} — folder detail.
 * DELETE /api/folders/{id} — delete folder (its generations move to the library trash).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function findOwnedFolder(userId: string, id: string) {
  const folder = await db.folder.findUnique({ where: { id } });
  if (!folder || folder.userId !== userId) return null;
  return folder;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const folder = await findOwnedFolder(auth.user.id, id);
  if (!folder) return NextResponse.json({ detail: "folder not found" }, { status: 404 });

  const recentJobsCount = await db.generation.count({
    where: { folderId: folder.id, deletedAt: null },
  });
  return NextResponse.json({
    folder: {
      id: folder.id,
      name: folder.name,
      recent_jobs_count: recentJobsCount,
      created_at: folder.createdAt.toISOString(),
    },
  });
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const folder = await findOwnedFolder(auth.user.id, id);
  if (!folder) return NextResponse.json({ detail: "folder not found" }, { status: 404 });

  await db.$transaction([
    db.generation.updateMany({
      where: { folderId: folder.id, deletedAt: null },
      data: { deletedAt: new Date() },
    }),
    db.folder.delete({ where: { id: folder.id } }),
  ]);
  return NextResponse.json({ ok: true });
}
