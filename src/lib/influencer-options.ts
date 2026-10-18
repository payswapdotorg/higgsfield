/**
 * HF-W7 AI Influencer option library — the 19 character settings + motion presets.
 *
 * Provenance doctrine (wave-7 revision of the honest-scoping law): per the user's
 * functional-parity mandate, published-spec curated options are now permitted for
 * surfaces whose live option sets were NOT captured — but every entry carries a
 * provenance tag distinguishing the two evidence classes:
 *   // ev:   — captured verbatim from the live product
 *             (evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json,
 *              root "AI Influencer | Higgsfield", 813 a11y nodes);
 *   // spec: — curated clone-side from the published spec / human-plausible values,
 *             NOT captured evidence (disclosed).
 *
 * The 19 settings (ev: 19 settings headings in the a11y tree): Character type
 * (heading 134, group 2104 — the ONLY control whose option set was captured) plus
 * the 18 heading+collapse-button-only controls (nodes 169-289), whose option sets
 * live in closed dropdowns in the live app and are therefore curated here under
 * the spec: tag.
 *
 * Determinism law: randomizeSpec derives all variation from the seeded fnv1a/
 * mulberry32 PRNG (src/lib/seeded-rng.ts) — no Math.random anywhere.
 */

import { fnv1a, mulberry32 } from "@/lib/seeded-rng";

/** ev: group 2104 option buttons — the full captured Character type option set (nodes 142-166). */
export const CHARACTER_TYPE_OPTIONS = [
  "Average",
  "Bold",
  "Extreme",
  "Insect",
  "Frog",
  "Cat",
  "Dog",
  "Rodent",
  "Bird",
] as const;

export type CharacterType = (typeof CHARACTER_TYPE_OPTIONS)[number];

/** The unset value for the 18 curated settings (ev: the live app's unset affordance is 'Any'). */
export const ANY = "Any";

// ── The 18 curated settings (option sets NOT captured — closed dropdowns in the live app) ──
// Each list is 4-10 human-plausible options, curated from the published spec surface.

// spec: Gender — curated 4 options + Any.
const GENDER_OPTIONS = ["Female", "Male", "Androgynous", "Non-binary"] as const;

// spec: Build — curated 7 options + Any.
const BUILD_OPTIONS = [
  "Slim",
  "Athletic",
  "Curvy",
  "Muscular",
  "Petite",
  "Plus-size",
  "Toned",
] as const;

// spec: Hairstyle — curated 10 options + Any.
const HAIRSTYLE_OPTIONS = [
  "Long straight",
  "Long wavy",
  "Shoulder-length bob",
  "Curly mid-length",
  "Short pixie",
  "Blunt bangs",
  "Box braids",
  "Top knot",
  "Side undercut",
  "Buzz cut",
] as const;

// spec: Hair Color — curated 10 options + Any.
const HAIR_COLOR_OPTIONS = [
  "Jet black",
  "Dark brown",
  "Chestnut brown",
  "Auburn",
  "Honey blonde",
  "Platinum blonde",
  "Copper red",
  "Silver grey",
  "Pastel pink",
  "Ombré",
] as const;

// spec: Style — curated 10 options + Any.
const STYLE_OPTIONS = [
  "Casual",
  "Streetwear",
  "Business casual",
  "Formal",
  "Athleisure",
  "Bohemian",
  "Y2K",
  "Vintage",
  "Cottagecore",
  "Techwear",
] as const;

// spec: Ethnicity — curated 9 options + Any.
const ETHNICITY_OPTIONS = [
  "Caucasian",
  "Black African",
  "East Asian",
  "South Asian",
  "Southeast Asian",
  "Middle Eastern",
  "Latin American",
  "Nordic",
  "Mixed heritage",
] as const;

// spec: Age — curated 6 options + Any.
const AGE_OPTIONS = [
  "Teen",
  "Young adult",
  "Thirties",
  "Forties",
  "Fifties",
  "Senior",
] as const;

// spec: Skin color — curated 7 options + Any.
const SKIN_COLOR_OPTIONS = [
  "Porcelain",
  "Fair",
  "Light olive",
  "Medium tan",
  "Golden brown",
  "Deep brown",
  "Rich ebony",
] as const;

// spec: Height — curated 5 options + Any.
const HEIGHT_OPTIONS = [
  "Petite",
  "Short",
  "Average height",
  "Tall",
  "Very tall",
] as const;

// spec: Proportions — curated 6 options + Any.
const PROPORTIONS_OPTIONS = [
  "Balanced",
  "Long legs",
  "Broad shoulders",
  "Athletic V-taper",
  "Compact",
  "Statuesque",
] as const;

// spec: Head shape — curated 6 options + Any.
const HEAD_SHAPE_OPTIONS = [
  "Oval",
  "Round",
  "Square",
  "Heart-shaped",
  "Diamond",
  "Oblong",
] as const;

// spec: Neck — curated 4 options + Any.
const NECK_OPTIONS = ["Slender", "Average", "Long", "Muscular"] as const;

// spec: Eye shape — curated 7 options + Any.
const EYE_SHAPE_OPTIONS = [
  "Almond",
  "Round",
  "Hooded",
  "Monolid",
  "Upturned",
  "Downturned",
  "Deep-set",
] as const;

// spec: Eye color — curated 8 options + Any.
const EYE_COLOR_OPTIONS = [
  "Brown",
  "Dark brown",
  "Hazel",
  "Amber",
  "Green",
  "Blue",
  "Grey",
  "Heterochromia",
] as const;

// spec: Features — curated 7 options + Any.
const FEATURES_OPTIONS = [
  "Freckles",
  "Dimples",
  "Beauty mark",
  "Sharp cheekbones",
  "Soft features",
  "Strong jawline",
  "Full lips",
] as const;

// spec: Facial hair — curated 6 options + Any.
const FACIAL_HAIR_OPTIONS = [
  "Clean-shaven",
  "Light stubble",
  "Full beard",
  "Goatee",
  "Moustache",
  "Beard with fade",
] as const;

// spec: Distinctive features — curated 7 options + Any.
const DISTINCTIVE_FEATURES_OPTIONS = [
  "Eyebrow scar",
  "Tooth gap",
  "Vitiligo patches",
  "Neck tattoo",
  "Septum piercing",
  "Birthmark",
  "Freckled shoulders",
] as const;

// spec: Accessories — curated 8 options + Any.
const ACCESSORIES_OPTIONS = [
  "Sunglasses",
  "Statement earrings",
  "Layered necklaces",
  "Baseball cap",
  "Beanie",
  "Silk scarf",
  "Reading glasses",
  "Choker",
] as const;

/** One character setting: key (snake_case API payload name) + label + option list + default. */
export interface InfluencerSetting {
  key: SettingKey;
  /** ev: the settings heading text from the a11y tree (134-289). */
  label: string;
  options: readonly string[];
  /** Unset default — "Average" for Character type (ev: the captured default state), "Any" for the curated 18. */
  default: string;
}

export type SettingKey =
  | "character_type"
  | "gender"
  | "build"
  | "hairstyle"
  | "hair_color"
  | "style"
  | "ethnicity"
  | "age"
  | "skin_color"
  | "height"
  | "proportions"
  | "head_shape"
  | "neck"
  | "eye_shape"
  | "eye_color"
  | "features"
  | "facial_hair"
  | "distinctive_features"
  | "accessories";

/**
 * The 19 settings in panel order. Character type's options are ev: group 2104;
 * every other option list is spec: curated (uncaptured dropdown — disclosed).
 */
export const INFLUENCER_SETTINGS: readonly InfluencerSetting[] = [
  { key: "character_type", label: "Character type", options: CHARACTER_TYPE_OPTIONS, default: "Average" }, // ev: 134/2104
  { key: "gender", label: "Gender", options: GENDER_OPTIONS, default: ANY }, // spec: curated (169/170 heading only)
  { key: "build", label: "Build", options: BUILD_OPTIONS, default: ANY }, // spec: curated (176/177)
  { key: "hairstyle", label: "Hairstyle", options: HAIRSTYLE_OPTIONS, default: ANY }, // spec: curated (183/184)
  { key: "hair_color", label: "Hair Color", options: HAIR_COLOR_OPTIONS, default: ANY }, // spec: curated (190/191)
  { key: "style", label: "Style", options: STYLE_OPTIONS, default: ANY }, // spec: curated (197/198)
  { key: "ethnicity", label: "Ethnicity", options: ETHNICITY_OPTIONS, default: ANY }, // spec: curated (204/205)
  { key: "age", label: "Age", options: AGE_OPTIONS, default: ANY }, // spec: curated (211/212)
  { key: "skin_color", label: "Skin color", options: SKIN_COLOR_OPTIONS, default: ANY }, // spec: curated (218/219)
  { key: "height", label: "Height", options: HEIGHT_OPTIONS, default: ANY }, // spec: curated (225/226)
  { key: "proportions", label: "Proportions", options: PROPORTIONS_OPTIONS, default: ANY }, // spec: curated (232/233)
  { key: "head_shape", label: "Head shape", options: HEAD_SHAPE_OPTIONS, default: ANY }, // spec: curated (239/240)
  { key: "neck", label: "Neck", options: NECK_OPTIONS, default: ANY }, // spec: curated (246/247)
  { key: "eye_shape", label: "Eye shape", options: EYE_SHAPE_OPTIONS, default: ANY }, // spec: curated (253/254)
  { key: "eye_color", label: "Eye color", options: EYE_COLOR_OPTIONS, default: ANY }, // spec: curated (260/261)
  { key: "features", label: "Features", options: FEATURES_OPTIONS, default: ANY }, // spec: curated (267/268)
  { key: "facial_hair", label: "Facial hair", options: FACIAL_HAIR_OPTIONS, default: ANY }, // spec: curated (274/275)
  { key: "distinctive_features", label: "Distinctive features", options: DISTINCTIVE_FEATURES_OPTIONS, default: ANY }, // spec: curated (281/282)
  { key: "accessories", label: "Accessories", options: ACCESSORIES_OPTIONS, default: ANY }, // spec: curated (288/289)
];

/** A fully-resolved spec: every setting key carries its current value (unset = "Any"). */
export type InfluencerSpec = Record<SettingKey, string>;

/** The canonical unset spec: Character type "Average" (ev: captured default), all curated settings "Any". */
export function defaultSpec(): InfluencerSpec {
  const spec = {} as InfluencerSpec;
  for (const s of INFLUENCER_SETTINGS) spec[s.key] = s.default;
  return spec;
}

export type SpecValidation =
  | { ok: true; spec: InfluencerSpec }
  | { ok: false; error: string };

/**
 * Validate + normalize an incoming spec object (API payload): unknown keys and
 * unknown values are rejected with a clear message; missing keys fall back to
 * the setting default. Character type values must be one of the 9 ev: options;
 * curated settings accept "Any" or one of their spec: options.
 */
export function validateSpec(input: unknown): SpecValidation {
  if (input === undefined || input === null) {
    return { ok: true, spec: defaultSpec() };
  }
  if (typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "spec must be an object of setting values" };
  }
  const known = new Map(INFLUENCER_SETTINGS.map((s) => [s.key, s]));
  const spec = defaultSpec();
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const setting = known.get(key as SettingKey);
    if (!setting) {
      return { ok: false, error: `unknown spec setting: '${key}' (see /api/characters option keys)` };
    }
    if (typeof value !== "string") {
      return { ok: false, error: `spec setting '${key}' must be a string` };
    }
    if (!setting.options.includes(value)) {
      return {
        ok: false,
        error: `invalid value '${value}' for spec setting '${key}' — allowed: ${setting.options.join(", ")}`,
      };
    }
    spec[setting.key] = value;
  }
  return { ok: true, spec };
}

/**
 * Deterministic random spec (the Randomize action's engine).
 *
 * Seed discipline (repo law): all variation derives from fnv1a → mulberry32 —
 * no Math.random. Same seed → byte-identical spec; different seeds → (with 19
 * varied settings, overwhelmingly) different specs.
 *
 * spec: curated behavior — each setting rolls uniformly over its option list,
 * INCLUDING "Any" for the curated 18 (a random character may honestly leave a
 * setting unset; Character type always rolls one of the 9 ev: options).
 */
export function randomizeSpec(seed: number): InfluencerSpec {
  const rng = mulberry32(fnv1a(`ai-influencer-randomize:${seed}`));
  const spec = {} as InfluencerSpec;
  for (const s of INFLUENCER_SETTINGS) {
    const pool = s.key === "character_type" ? s.options : [...s.options, ANY];
    spec[s.key] = pool[Math.floor(rng() * pool.length)];
  }
  return spec;
}

/**
 * Motion presets — the Motion tab's preset tiles (ev: hero copy 322/326
 * "Choose a motion preset and watch them perform it in a video ready to share";
 * the reference preset list itself was NOT captured → curated, spec:).
 */
export interface MotionPreset {
  id: string;
  label: string;
  prompt: string;
}

// spec: curated preset library (reference list uncaptured — hero copy confirmed presets exist).
export const MOTION_PRESETS: readonly MotionPreset[] = [
  {
    id: "confident-walk",
    label: "Confident walk toward camera",
    prompt:
      "The character walks confidently toward the camera with a relaxed, assured stride, holding direct eye contact and a slight smile",
  },
  {
    id: "head-turn-smile",
    label: "Subtle head turn with smile",
    prompt:
      "The character slowly turns their head toward the camera and breaks into a warm, subtle smile",
  },
  {
    id: "dance-groove",
    label: "Dance groove",
    prompt:
      "The character dances to an upbeat rhythm, grooving with their shoulders and hips, playful energetic movement",
  },
  {
    id: "wave-greeting",
    label: "Wave greeting",
    prompt:
      "The character waves hello at the camera with a friendly open gesture and a bright welcoming expression",
  },
  {
    id: "fashion-pose",
    label: "Fashion pose shift",
    prompt:
      "The character shifts between fashion editorial poses, chin up, controlled confident body movement",
  },
  {
    id: "hair-flip-turn",
    label: "Hair flip turn",
    prompt:
      "The character flips their hair while turning away, then glances back over their shoulder at the camera",
  },
  {
    id: "product-showcase",
    label: "Product showcase gesture",
    prompt:
      "The character presents a product toward the camera with an inviting open-palm gesture and an engaging smile",
  },
  {
    id: "slow-motion-turn",
    label: "Cinematic slow-motion turn",
    prompt:
      "The character turns slowly in cinematic slow motion, hair and fabric drifting softly, holding the camera's gaze",
  },
];

/** Look up a motion preset by id (API validation helper). */
export function findMotionPreset(id: string): MotionPreset | null {
  return MOTION_PRESETS.find((p) => p.id === id) ?? null;
}
