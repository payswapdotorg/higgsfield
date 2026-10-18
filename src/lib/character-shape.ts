/**
 * Character (AI Influencer) → JSON mapper + shared influencer job constants.
 * API payloads use snake_case to mirror the §1 evidence-body convention
 * (same law as src/lib/job-shape.ts).
 *
 * Asset resolution: a Character carries no asset columns — portrait/full-body
 * assets resolve through the linked done Generation rows (characterId), the
 * job pipeline staying the single asset truth. Dangling characterIds (the
 * character hard-deleted) simply resolve to null.
 */

import type { Character } from "@prisma/client";
import { db } from "@/lib/db";
import {
  defaultSpec,
  INFLUENCER_SETTINGS,
  type InfluencerSpec,
} from "@/lib/influencer-options";

/// ── shared influencer job constants (routes + tests import these) ────────────

/** model_version for character-sheet jobs (portrait + full-body). */
export const INFLUENCER_MODEL_VERSION = "ai-influencer";
/** model_version for motion jobs (the dashscope wan2.2 image-to-video engine's slug). */
export const INFLUENCER_MOTION_MODEL_VERSION = "wan2.2-i2v-flash";

/** ev: evidence node 2252 '1.125 credits' — the Generate action's total cost. */
export const INFLUENCER_GENERATE_COST_TOTAL = 1.125;
/** Half of the evidence total per job (portrait / full-body split — spec: clone-side). */
export const INFLUENCER_SHEET_COST = 0.5625;
/** spec: curated clone-side choice — the motion action's cost (5 credits; not captured). */
export const INFLUENCER_MOTION_COST = 5;

/** spec: clone-side aspect mapping — portrait square, full-body 2:3, motion 16:9. */
export const INFLUENCER_PORTRAIT_ASPECT = "1:1";
export const INFLUENCER_FULLBODY_ASPECT = "2:3";
export const INFLUENCER_MOTION_ASPECT = "16:9";
export const INFLUENCER_PORTRAIT_SIZE = { width: 1024, height: 1024 };
export const INFLUENCER_FULLBODY_SIZE = { width: 896, height: 1344 };
export const INFLUENCER_MOTION_SIZE = { width: 1200, height: 672 };

/// ── JSON shape ───────────────────────────────────────────────────────────────

export interface CharacterJson {
  id: string;
  name: string;
  /** The parsed 19-setting option spec (values; unset = "Any"). */
  spec: Record<string, string>;
  reference_image: string | null;
  portrait_asset_url: string | null;
  full_body_asset_url: string | null;
  created_at: string;
  updated_at: string;
}

export function characterToJson(
  c: Character,
  assets: { portraitAssetUrl: string | null; fullBodyAssetUrl: string | null }
): CharacterJson {
  return {
    id: c.id,
    name: c.name,
    spec: parseSpecJson(c.spec),
    reference_image: c.referenceImage,
    portrait_asset_url: assets.portraitAssetUrl,
    full_body_asset_url: assets.fullBodyAssetUrl,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  };
}

/** Parse the stored spec JSON defensively (invalid/stale rows fall back to defaults). */
export function parseSpecJson(spec: string): InfluencerSpec {
  try {
    const v = JSON.parse(spec) as unknown;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const base = defaultSpec();
      const record = v as Record<string, unknown>;
      for (const setting of INFLUENCER_SETTINGS) {
        const value = record[setting.key];
        if (typeof value === "string" && setting.options.includes(value)) {
          base[setting.key] = value;
        }
      }
      return base;
    }
  } catch {
    /* fall through to defaults */
  }
  return defaultSpec();
}

/// ── asset resolution (linked done Generation rows) ──────────────────────────

export interface CharacterAssets {
  portraitAssetUrl: string | null;
  fullBodyAssetUrl: string | null;
}

/**
 * Resolve the LATEST done portrait / full-body asset per character (one query
 * per jobSetType over the characterId index; first row per character wins
 * under createdAt-desc ordering). Dangling/absent rows resolve to null.
 */
export async function resolveCharacterAssets(
  characterIds: string[]
): Promise<Map<string, CharacterAssets>> {
  const result = new Map<string, CharacterAssets>();
  for (const id of characterIds) {
    result.set(id, { portraitAssetUrl: null, fullBodyAssetUrl: null });
  }
  if (characterIds.length === 0) return result;

  const [portraits, fullBodies] = await Promise.all([
    db.generation.findMany({
      where: {
        characterId: { in: characterIds },
        jobSetType: "influencer_portrait",
        status: "done",
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { characterId: true, assetUrl: true },
    }),
    db.generation.findMany({
      where: {
        characterId: { in: characterIds },
        jobSetType: "influencer_fullbody",
        status: "done",
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      select: { characterId: true, assetUrl: true },
    }),
  ]);

  for (const row of portraits) {
    const entry = result.get(row.characterId ?? "");
    if (entry && entry.portraitAssetUrl === null && row.assetUrl) {
      entry.portraitAssetUrl = row.assetUrl;
    }
  }
  for (const row of fullBodies) {
    const entry = result.get(row.characterId ?? "");
    if (entry && entry.fullBodyAssetUrl === null && row.assetUrl) {
      entry.fullBodyAssetUrl = row.assetUrl;
    }
  }
  return result;
}

/**
 * The character's current portrait asset (the identity input for motion jobs).
 * Returns null when no done portrait generation exists yet.
 */
export async function portraitAssetFor(characterId: string): Promise<string | null> {
  const job = await db.generation.findFirst({
    where: {
      characterId,
      jobSetType: "influencer_portrait",
      status: "done",
      deletedAt: null,
    },
    orderBy: { createdAt: "desc" },
    select: { assetUrl: true },
  });
  return job?.assetUrl ?? null;
}
