/**
 * HF-W5 — the /fnf/user/settings consent body, verbatim key set.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `settings`
 *   {"media_consent":false,"media_consented_at":null,"audio_consent":null,
 *    "audio_consented_at":null,"unlimited_settings":null,"has_image_auto":true,
 *    "character_sheets_consent":false,"character_sheets_consented_at":null,
 *    "ai_influencer_consent":false,"ai_influencer_consented_at":null,
 *    "supercomputer_llm_consent":false,"supercomputer_llm_consented_at":null}
 * Cross-checked against net-capture-with-auth-headers.jsonl: /fnf/user/settings is
 * GET 200 with reqBody null on every captured row (same for /workspaces/settings,
 * /datetime-settings, /banner/settings) → READ-ONLY surface. The clone therefore
 * ships GET only; the consent switches in the UI are inert with a visible
 * "not captured — read-only surface" disclosure. No consent mutation is invented.
 *
 * `audio_consent` is tri-state in the capture (null = never asked) — kept nullable.
 * `has_image_auto` is a state flag, not a consent (captured: true).
 * `unlimited_settings` is an object in the live body (captured: null) — stored as
 * a JSON string column and re-emitted parsed; null passes through as null.
 */
import { db } from "@/lib/db";
import type { UserSettings } from "@prisma/client";

/** Verbatim /fnf/user/settings body shape (snake_case). */
export interface SettingsJson {
  media_consent: boolean;
  media_consented_at: string | null;
  audio_consent: boolean | null;
  audio_consented_at: string | null;
  unlimited_settings: unknown;
  has_image_auto: boolean;
  character_sheets_consent: boolean;
  character_sheets_consented_at: string | null;
  ai_influencer_consent: boolean;
  ai_influencer_consented_at: string | null;
  supercomputer_llm_consent: boolean;
  supercomputer_llm_consented_at: string | null;
}

function parseUnlimitedSettings(raw: string | null): unknown {
  if (raw === null) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function settingsToJson(row: UserSettings): SettingsJson {
  return {
    media_consent: row.mediaConsent,
    media_consented_at: row.mediaConsentedAt?.toISOString() ?? null,
    audio_consent: row.audioConsent,
    audio_consented_at: row.audioConsentedAt?.toISOString() ?? null,
    unlimited_settings: parseUnlimitedSettings(row.unlimitedSettings),
    has_image_auto: row.hasImageAuto,
    character_sheets_consent: row.characterSheetsConsent,
    character_sheets_consented_at: row.characterSheetsConsentedAt?.toISOString() ?? null,
    ai_influencer_consent: row.aiInfluencerConsent,
    ai_influencer_consented_at: row.aiInfluencerConsentedAt?.toISOString() ?? null,
    supercomputer_llm_consent: row.supercomputerLlmConsent,
    supercomputer_llm_consented_at: row.supercomputerLlmConsentedAt?.toISOString() ?? null,
  };
}

/**
 * Read the consent row for a user, creating it with the captured defaults on first
 * read (the live GET answers for every account; the captured defaults are the
 * fresh-account values — consents false/null, has_image_auto true). Idempotent.
 */
export async function getOrCreateUserSettings(userId: string): Promise<UserSettings> {
  const existing = await db.userSettings.findUnique({ where: { userId } });
  if (existing) return existing;
  return db.userSettings.create({ data: { userId } });
}
