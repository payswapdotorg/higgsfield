/**
 * HF-W7 AI Influencer prompt builder — deterministic spec → prompt renderer.
 *
 * Pure string functions over the option-library spec (no I/O, no randomness) —
 * unit-testable, and the exact prompt is pre-rendered at POST time and stored on
 * the Generation row (the influencer adapter reads the stored prompt verbatim,
 * so retries render identically — determinism law).
 *
 * Provenance: the live product's influencer prompts were NOT captured; these
 * templates are clone-side choices (spec:) assembled from the captured settings
 * vocabulary (ev:) — disclosed.
 */

import {
  ANY,
  INFLUENCER_SETTINGS,
  type InfluencerSpec,
  type MotionPreset,
} from "@/lib/influencer-options";

/** Per-setting phrase templates in canonical panel order (spec: clone-side). */
const PHRASE_BUILDERS: Record<string, (value: string) => string> = {
  character_type: (v) => `${v} character`,
  gender: (v) => `${v.toLowerCase()} presentation`,
  age: (v) => v.toLowerCase(),
  ethnicity: (v) => `${v} heritage`,
  build: (v) => `${v.toLowerCase()} build`,
  height: (v) => v.toLowerCase(),
  proportions: (v) => v.toLowerCase(),
  skin_color: (v) => `${v.toLowerCase()} skin`,
  hairstyle: (v) => v.toLowerCase(),
  hair_color: (v) => `${v.toLowerCase()} hair`,
  head_shape: (v) => `${v.toLowerCase()} head shape`,
  neck: (v) => `${v.toLowerCase()} neck`,
  eye_shape: (v) => v.toLowerCase(),
  eye_color: (v) => `${v.toLowerCase()} eyes`,
  features: (v) => v.toLowerCase(),
  facial_hair: (v) => v.toLowerCase(),
  distinctive_features: (v) => v.toLowerCase(),
  style: (v) => `dressed in ${v.toLowerCase()} fashion`,
  accessories: (v) => `wearing ${v.toLowerCase()}`,
};

/**
 * The character description clause: every non-"Any" setting contributes its
 * phrase, joined in canonical order. Deterministic: same spec → same string.
 */
export function describeCharacter(spec: InfluencerSpec): string {
  const phrases: string[] = [];
  for (const setting of INFLUENCER_SETTINGS) {
    const value = spec[setting.key];
    if (!value || value === ANY) continue; // unset settings contribute nothing
    const build = PHRASE_BUILDERS[setting.key];
    if (build) phrases.push(build(value));
  }
  return phrases.join(", ");
}

/**
 * Portrait prompt — close-up portrait framing: the description sentence plus
 * the photographic suffix (spec: clone-side phrasing).
 */
export function buildPortraitPrompt(spec: InfluencerSpec): string {
  return `Close-up portrait photograph of a ${describeCharacter(spec)}. Photorealistic, natural lighting, shallow depth of field.`;
}

/**
 * Full-body prompt — full-body composition variant of the same description
 * (spec: clone-side phrasing).
 */
export function buildFullBodyPrompt(spec: InfluencerSpec): string {
  return `Full-body photograph of a ${describeCharacter(spec)}, standing composition with the whole figure visible head to toe. Photorealistic, natural lighting, shallow depth of field.`;
}

/**
 * The outfit clause reused by the motion prompt (identity continuity requires
 * the outfit to be re-described from the spec — spec: clone-side).
 */
function outfitClause(spec: InfluencerSpec): string {
  const style = spec.style && spec.style !== ANY ? spec.style.toLowerCase() : null;
  const accessories =
    spec.accessories && spec.accessories !== ANY ? spec.accessories.toLowerCase() : null;
  const parts: string[] = [];
  if (style) parts.push(`dressed in ${style} fashion`);
  if (accessories) parts.push(`wearing ${accessories}`);
  return parts.join(", ");
}

/**
 * Motion prompt — the preset's action prompt + the character continuity clause
 * ("the same person, consistent identity and outfit") + the outfit description
 * from the spec (spec: clone-side; the identity-reference image itself rides
 * along as the job's input image at the provider layer).
 */
export function buildMotionPrompt(preset: MotionPreset, spec: InfluencerSpec): string {
  const outfit = outfitClause(spec);
  const outfitText = outfit ? `, ${outfit}` : "";
  return `${preset.prompt}. The same person as in the provided image, consistent identity and outfit${outfitText}. Photorealistic motion, natural movement.`;
}
