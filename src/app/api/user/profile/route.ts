/**
 * GET /api/user/profile — HF-W5 own-profile body, verbatim key set.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `profile` (the
 * /fnf/user/profile GET 200 body captured on the operator account; net-capture
 * reqBody null on every row → read-only, no mutation endpoint cloned).
 * Shape: src/lib/profile-shape.ts profileToJson.
 *
 * Auth: session (401 {"detail":"Invalid or expired token"} for guests — §1d).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { profileToJson } from "@/lib/profile-shape";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  return NextResponse.json(profileToJson(auth.user));
}
