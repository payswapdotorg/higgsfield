/**
 * GET /api/health — liveness/readiness probe (wave-4 H4 — clone-side hardening, no auth).
 *
 * JSON shape: { status, uptime_s, db, queue: { queued, processing }, version }
 * - `db` — "ok" when a `SELECT 1` round-trip succeeds, "fail" otherwise;
 * - `queue` — live Prisma counts of queued/processing generations (null when db is down);
 * - `version` — imported from package.json;
 * - HTTP status: 200 when healthy, 503 when the db check fails (status field mirrors it —
 *   a probe that answers 200 while the database is down would be a fake pass).
 */
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import pkg from "../../../../package.json";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = true;
  let queued: number | null = null;
  let processing: number | null = null;
  try {
    await db.$queryRaw`SELECT 1`;
    [queued, processing] = await Promise.all([
      db.generation.count({ where: { status: "queued" } }),
      db.generation.count({ where: { status: "processing" } }),
    ]);
  } catch (err) {
    dbOk = false;
    console.error("[health] db check failed:", err);
  }

  return NextResponse.json(
    {
      status: dbOk ? "ok" : "fail",
      uptime_s: Math.floor(process.uptime()),
      db: dbOk ? "ok" : "fail",
      queue: { queued, processing },
      version: pkg.version,
    },
    { status: dbOk ? 200 : 503 }
  );
}
