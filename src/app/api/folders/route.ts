import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeFolder } from "@/lib/serialize";

const createFolderSchema = z.object({
  name: z
    .string()
    .min(1, "name is required")
    .max(120, "name must be at most 120 characters"),
  access_mode: z.enum(["private", "public"]).default("private"),
  surface: z.string().default("cinematic_studio"),
  workspace_id: z.string().nullable().default(null),
});

export async function POST(req: NextRequest) {
  // Wave 1 has no per-user ownership on projects (guest session model);
  // resolving the session keeps every request guest-safe.
  await getCurrentUser(req);

  const body = await parseBody(req, createFolderSchema);
  if (!body.ok) return body.res;

  const project = await db.project.create({
    data: {
      name: body.data.name,
      accessMode: body.data.access_mode,
      surface: body.data.surface,
      workspaceId: body.data.workspace_id, // accepted + stored; stays null in wave 1
    },
  });

  return NextResponse.json(serializeFolder(project, 0), { status: 201 });
}
