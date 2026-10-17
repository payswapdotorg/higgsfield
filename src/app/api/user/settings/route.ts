/**
 * GET /api/user/settings — HF-W5 consent body, verbatim key set.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `settings`
 *   {"media_consent":false,"media_consented_at":null,"audio_consent":null,…
 *    "has_image_auto":true,"character_sheets_consent":false,…,
 *    "ai_influencer_consent":false,…,"supercomputer_llm_consent":false,…}
 * Cross-checked against net-capture-with-auth-headers.jsonl: /fnf/user/settings is
 * GET 200 with reqBody null on every captured row → read-only surface; NO mutation
 * handler is cloned (the settings UI switches are inert with a visible disclosure).
 *
 * Auth: session (401 {"detail":"Invalid or expired token"} for guests — §1d).
 * The consent row is created with the captured defaults on first read
 * (src/lib/settings-shape.ts getOrCreateUserSettings — idempotent).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getOrCreateUserSettings, settingsToJson } from "@/lib/settings-shape";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;

  const row = await getOrCreateUserSettings(auth.user.id);
  return NextResponse.json(settingsToJson(row));
}
