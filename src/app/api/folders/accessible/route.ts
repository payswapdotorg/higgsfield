import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseSizeParam } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeFolder } from "@/lib/serialize";

/**
 * GET /api/folders/accessible?surface=&size=
 * Wave 1 guest session model — lists ALL projects (optionally filtered by
 * surface), newest first. recent_jobs_count computed via a grouped count.
 */
export async function GET(req: NextRequest) {
  await getCurrentUser(req);

  const url = new URL(req.url);
  const surface = url.searchParams.get("surface")?.trim() || null;
  const size = parseSizeParam(url, 50, 200);

  const projects = await db.project.findMany({
    where: surface ? { surface } : undefined,
    orderBy: { createdAt: "desc" },
    take: size,
  });

  const counts = projects.length
    ? await db.generation.groupBy({
        by: ["projectId"],
        where: { projectId: { in: projects.map((p) => p.id) } },
        _count: { _all: true },
      })
    : [];

  const countById = new Map(counts.map((c) => [c.projectId, c._count._all]));

  return NextResponse.json({
    items: projects.map((p) => serializeFolder(p, countById.get(p.id) ?? 0)),
    has_more: false,
  });
}
