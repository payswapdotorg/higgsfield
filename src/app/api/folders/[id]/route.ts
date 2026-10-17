import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeFolder } from "@/lib/serialize";

type RouteCtx = { params: Promise<{ id: string }> };

const patchFolderSchema = z.object({
  name: z
    .string()
    .min(1, "name must be non-empty")
    .max(120, "name must be at most 120 characters")
    .optional(),
  pinned: z.boolean().optional(),
  access_mode: z.enum(["private", "public"]).optional(),
});

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  await getCurrentUser(req);

  const project = await db.project.findUnique({ where: { id } });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json(serializeFolder(project));
}

export async function PATCH(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  await getCurrentUser(req);

  const body = await parseBody(req, patchFolderSchema);
  if (!body.ok) return body.res;

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data: {
    name?: string;
    accessMode?: string;
    pinnedAt?: Date | null;
  } = {};
  if (body.data.name !== undefined) data.name = body.data.name;
  if (body.data.access_mode !== undefined) {
    data.accessMode = body.data.access_mode;
  }
  if (body.data.pinned !== undefined) {
    // Pin/unpin is a user action — DB event timestamp (spec-sanctioned).
    data.pinnedAt = body.data.pinned ? new Date() : null;
  }

  const updated = await db.project.update({ where: { id }, data });
  return NextResponse.json(serializeFolder(updated));
}

export async function DELETE(req: NextRequest, ctx: RouteCtx) {
  const { id } = await ctx.params;
  await getCurrentUser(req);

  const existing = await db.project.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Cascade contained jobs (schema has no onDelete cascade by contract).
  await db.$transaction([
    db.generation.deleteMany({ where: { projectId: id } }),
    db.project.delete({ where: { id } }),
  ]);

  return NextResponse.json({ deleted: true });
}
