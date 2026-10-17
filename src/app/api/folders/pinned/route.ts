import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { serializeFolder } from "@/lib/serialize";

/**
 * GET /api/folders/pinned?recent_jobs_count=true|1
 * Pinned projects, most recently pinned first.
 */
export async function GET(req: NextRequest) {
  await getCurrentUser(req);

  const url = new URL(req.url);
  const withCount = ["true", "1"].includes(
    (url.searchParams.get("recent_jobs_count") ?? "").toLowerCase(),
  );

  const projects = await db.project.findMany({
    where: { pinnedAt: { not: null } },
    orderBy: { pinnedAt: "desc" },
  });

  let countById = new Map<string, number>();
  if (withCount && projects.length > 0) {
    const counts = await db.generation.groupBy({
      by: ["projectId"],
      where: { projectId: { in: projects.map((p) => p.id) } },
      _count: { _all: true },
    });
    countById = new Map(counts.map((c) => [c.projectId, c._count._all]));
  }

  return NextResponse.json({
    items: projects.map((p) =>
      serializeFolder(p, withCount ? (countById.get(p.id) ?? 0) : 0),
    ),
  });
}
