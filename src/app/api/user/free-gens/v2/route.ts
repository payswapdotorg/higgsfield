import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/user/free-gens/v2 — stubbed free generation counter.
 * Wave 1 returns the captured fixed value.
 */
export async function GET() {
  return NextResponse.json({ free_gens_remaining: 0 });
}
