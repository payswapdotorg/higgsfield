/// <reference types="bun-types" />
/**
 * HF-W7 AI Influencer API tests — run against the live server:
 *   TEST_BASE_URL=http://localhost:<port> bun test tests/influencer.test.ts --timeout 30000
 *
 * Covers (MOCK influencer providers — HF_IMAGE_PROVIDER/HF_VIDEO_PROVIDER unset,
 * the env-gated factory's default, so the battery stays deterministic):
 *  - characters CRUD: full-valid-19-key-spec create (snake_case payload echo,
 *    default name "Influencer", bare body → default spec "Average"/"Any"),
 *    unknown spec key/value → 400, strict body shape, GET list scoped to the
 *    owner (+ cross-user detail 404), PATCH spec full-replace + revalidation,
 *    reference_image data:image URI validation (bad prefix → 400, decoded
 *    >4MB → 400, valid stored + explicit null clears), DELETE → GET 404.
 *  - generate pipeline: POST → 200 {jobs: [portrait, full-body]} (both rows
 *    linked characterId, deterministic pre-rendered prompts = builder output),
 *    wallet burns EXACTLY 1.125 (0.5625 per job — the Float credit columns),
 *    insufficient credits → 402 {detail, needed: 1.125, available} with full
 *    atomicity (no Generation rows, no burn), and both jobs reach done via
 *    the character-detail poll route (the thaw route) with the mock fixture
 *    assets resolving into the character JSON.
 *  - motion pipeline: no done portrait → 400 (sheet-first precondition);
 *    after a done sheet, valid preset → 200 {job} (kind video, model_version
 *    wan2.2-i2v-flash, 16:9 1200×672, cost 5, the done portrait asset as
 *    input_images[0], deterministic prompt) with an exact 5-credit burn and
 *    the job reaching done; unknown preset_id → 400; camelCase body → 400.
 *
 * NOT covered (disclosed): the H3 per-minute rate limiter (a fixed 60 s window
 * is not deterministically pinnable over HTTP in this battery — wave-4's tests
 * own limiter semantics; default limit 30/min never trips in this file) and
 * the real provider engines (openrouter / dashscope / zai — evidence lives in
 * scripts/ops/ probes + docs/ai-influencer/ benchmarks, not in tests).
 */
import { beforeEach, afterAll, describe, expect, test } from "bun:test";
import { BASE_URL, db, login, authFetch, waitFor, setPools } from "./helpers";
import type { CookieJar } from "./helpers";
import type { JobJson } from "@/lib/job-shape";
import type { CharacterJson } from "@/lib/character-shape";
import { defaultSpec, findMotionPreset, type InfluencerSpec } from "@/lib/influencer-options";
import {
  buildFullBodyPrompt,
  buildMotionPrompt,
  buildPortraitPrompt,
} from "@/server/influencer/prompt";

const W7_PREFIX = "hf-w7-test-";

/** W7-scoped user cleanup (distinct prefix — direct db delete; cascade takes characters/jobs/pools/ledger). */
async function cleanupW7Users(): Promise<void> {
  await db.user.deleteMany({ where: { email: { startsWith: W7_PREFIX } } });
}

/** A full spec: every unset setting keeps its default (mirrors validateSpec's normalization). */
function specWith(overrides: Partial<InfluencerSpec>): InfluencerSpec {
  return { ...defaultSpec(), ...overrides };
}

/** All 19 settings set to valid values (option-library vocabulary). */
const FULL_SPEC: InfluencerSpec = {
  character_type: "Cat",
  gender: "Female",
  build: "Athletic",
  hairstyle: "Long wavy",
  hair_color: "Copper red",
  style: "Streetwear",
  ethnicity: "East Asian",
  age: "Young adult",
  skin_color: "Fair",
  height: "Tall",
  proportions: "Long legs",
  head_shape: "Oval",
  neck: "Slender",
  eye_shape: "Almond",
  eye_color: "Green",
  features: "Freckles",
  facial_hair: "Clean-shaven",
  distinctive_features: "Tooth gap",
  accessories: "Sunglasses",
};

const GEN_SPEC: Partial<InfluencerSpec> = {
  character_type: "Cat",
  gender: "Female",
  hair_color: "Copper red",
  style: "Streetwear",
  age: "Young adult",
};

const MOTION_SPEC: Partial<InfluencerSpec> = {
  character_type: "Dog",
  style: "Techwear",
  accessories: "Sunglasses",
};

async function createCharacter(
  jar: CookieJar,
  opts: { name?: string; spec?: InfluencerSpec } = {}
): Promise<CharacterJson> {
  const res = await authFetch(jar, "/api/characters", {
    method: "POST",
    body: JSON.stringify({
      ...(opts.name !== undefined ? { name: opts.name } : {}),
      ...(opts.spec !== undefined ? { spec: opts.spec } : {}),
    }),
  });
  if (res.status !== 200) throw new Error(`createCharacter failed: ${res.status}`);
  const { character } = (await res.json()) as { character: CharacterJson };
  return character;
}

/** Resolve the userId behind a session jar via the session API (api.test.ts convention). */
async function jarUserId(jar: CookieJar): Promise<string> {
  const res = await authFetch(jar, "/api/auth/session");
  const body = (await res.json()) as { user: { id: string } };
  return body.user.id;
}

/** Both sheet jobs done? (character-detail polling advances the queue — the thaw route). */
async function sheetDone(jar: CookieJar, characterId: string): Promise<boolean> {
  const r = await authFetch(jar, `/api/characters/${characterId}`);
  const body = (await r.json()) as { jobs: JobJson[] };
  return body.jobs.length === 2 && body.jobs.every((j) => j.status === "done");
}

// Warm the dev server's on-demand route compilation: the first request per
// route pays the dev compile, and paying it here (unauthenticated → 401) keeps
// the per-test 30 s budget honest for the actual assertions.
for (const [path, method] of [
  ["/api/characters", "GET"],
  ["/api/characters/warmup-route-compile", "GET"],
  ["/api/characters/warmup-route-compile/generate", "POST"],
  ["/api/characters/warmup-route-compile/motion", "POST"],
] as const) {
  await fetch(`${BASE_URL}${path}`, { method }).catch(() => {});
}

beforeEach(async () => {
  await cleanupW7Users();
});

afterAll(async () => {
  await cleanupW7Users();
  await db.$disconnect();
});

describe("characters CRUD — spec validation + ownership", () => {
  test("POST full valid spec → 200 snake_case echo; bare body → default name + default spec", async () => {
    const jar = await login("hf-w7-test-create@hf-test.local", "w7_create");

    const res = await authFetch(jar, "/api/characters", {
      method: "POST",
      body: JSON.stringify({ spec: FULL_SPEC }),
    });
    expect(res.status).toBe(200);
    const { character } = (await res.json()) as { character: CharacterJson };
    expect(character.name).toBe("Influencer"); // spec: clone-side default name
    expect(character.spec).toEqual(FULL_SPEC);
    expect(character.reference_image).toBeNull();
    expect(character.portrait_asset_url).toBeNull();
    expect(character.full_body_asset_url).toBeNull();
    expect(typeof character.id).toBe("string");
    expect(typeof character.created_at).toBe("string");

    // Bare body → all-default spec (character_type "Average" ev:, curated settings "Any").
    const bare = await authFetch(jar, "/api/characters", {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(bare.status).toBe(200);
    const { character: c2 } = (await bare.json()) as { character: CharacterJson };
    expect(c2.name).toBe("Influencer");
    expect(c2.spec).toEqual(defaultSpec());
  });

  test("unknown spec key → 400; unknown top-level field → 400 (strict shape)", async () => {
    const jar = await login("hf-w7-test-badkey@hf-test.local", "w7_badkey");

    const res = await authFetch(jar, "/api/characters", {
      method: "POST",
      body: JSON.stringify({ spec: { character_type: "Cat", totally_bogus: "x" } }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toContain("unknown spec setting: 'totally_bogus'");

    const extra = await authFetch(jar, "/api/characters", {
      method: "POST",
      body: JSON.stringify({ name: "X", surprise: true }),
    });
    expect(extra.status).toBe(400);
  });

  test("unknown spec value → 400", async () => {
    const jar = await login("hf-w7-test-badval@hf-test.local", "w7_badval");

    const res = await authFetch(jar, "/api/characters", {
      method: "POST",
      body: JSON.stringify({ spec: { character_type: "Spaceship" } }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toContain("character_type");
  });

  test("GET list scoped to owner; cross-user detail → 404", async () => {
    const jarA = await login("hf-w7-test-owna@hf-test.local", "w7_owna");
    const jarB = await login("hf-w7-test-ownb@hf-test.local", "w7_ownb");
    const a = await createCharacter(jarA, { name: "Alpha" });
    const b = await createCharacter(jarB, { name: "Beta" });

    const listA = await authFetch(jarA, "/api/characters");
    expect(listA.status).toBe(200);
    const bodyA = (await listA.json()) as { characters: CharacterJson[] };
    expect(bodyA.characters.length).toBe(1);
    expect(bodyA.characters[0].name).toBe("Alpha");

    const cross = await authFetch(jarA, `/api/characters/${b.id}`);
    expect(cross.status).toBe(404);
    const own = await authFetch(jarA, `/api/characters/${a.id}`);
    expect(own.status).toBe(200);
  });

  test("PATCH name+spec → 200 replaces the spec; invalid spec value → 400", async () => {
    const jar = await login("hf-w7-test-patch@hf-test.local", "w7_patch");
    const character = await createCharacter(jar, { spec: FULL_SPEC });

    const res = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ name: "Reworked", spec: { character_type: "Dog" } }),
    });
    expect(res.status).toBe(200);
    const { character: updated } = (await res.json()) as { character: CharacterJson };
    expect(updated.name).toBe("Reworked");
    expect(updated.spec).toEqual(specWith({ character_type: "Dog" })); // full replace, not merge

    const bad = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ spec: { eye_color: "Purple" } }),
    });
    expect(bad.status).toBe(400);
  });

  test("PATCH reference_image — non-data-image URI → 400", async () => {
    const jar = await login("hf-w7-test-refimg@hf-test.local", "w7_refimg");
    const character = await createCharacter(jar);

    const res = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reference_image: "https://cdn.example.com/face.png" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toContain("data:image");
  });

  test("PATCH reference_image — decoded size >4MB → 400", async () => {
    const jar = await login("hf-w7-test-huge@hf-test.local", "w7_huge");
    const character = await createCharacter(jar);

    // 5.6M base64 chars → ~4.2MB decoded > the ~4MB cap.
    const oversized = `data:image/png;base64,${"A".repeat(5_600_000)}`;
    const res = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reference_image: oversized }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toContain("4MB");
  });

  test("PATCH reference_image — valid data:image URI stored; explicit null clears", async () => {
    const jar = await login("hf-w7-test-refok@hf-test.local", "w7_refok");
    const character = await createCharacter(jar);

    const uri = "data:image/png;base64,iVBORw0KGgo=";
    const res = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reference_image: uri }),
    });
    expect(res.status).toBe(200);
    const { character: stored } = (await res.json()) as { character: CharacterJson };
    expect(stored.reference_image).toBe(uri);

    const cleared = await authFetch(jar, `/api/characters/${character.id}`, {
      method: "PATCH",
      body: JSON.stringify({ reference_image: null }),
    });
    expect(cleared.status).toBe(200);
    const { character: after } = (await cleared.json()) as { character: CharacterJson };
    expect(after.reference_image).toBeNull();
  });

  test("DELETE → {ok:true}; subsequent GET → 404", async () => {
    const jar = await login("hf-w7-test-del@hf-test.local", "w7_del");
    const character = await createCharacter(jar);

    const res = await authFetch(jar, `/api/characters/${character.id}`, { method: "DELETE" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const gone = await authFetch(jar, `/api/characters/${character.id}`);
    expect(gone.status).toBe(404);
  });
});

describe("generate pipeline — two-job sheet, atomic 1.125 burn", () => {
  test("POST generate → 200 {jobs:[2]}: shapes, deterministic prompts, exact 1.125 burn, done via character poll", async () => {
    const email = "hf-w7-test-gen@hf-test.local";
    const jar = await login(email, "w7_gen");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 10 }]);

    const spec = specWith(GEN_SPEC);
    const character = await createCharacter(jar, { spec });

    const res = await authFetch(jar, `/api/characters/${character.id}/generate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(200);
    const { jobs } = (await res.json()) as { jobs: JobJson[] };
    expect(jobs.length).toBe(2);

    const portrait = jobs.find((j) => j.job_set_type === "influencer_portrait");
    const fullBody = jobs.find((j) => j.job_set_type === "influencer_fullbody");
    if (!portrait || !fullBody) throw new Error("expected portrait + fullbody jobs");

    expect(portrait.kind).toBe("image");
    expect(portrait.model_version).toBe("ai-influencer");
    expect(portrait.status).toBe("queued");
    expect(portrait.aspect_ratio).toBe("1:1");
    expect(portrait.width).toBe(1024);
    expect(portrait.height).toBe(1024);
    expect(fullBody.aspect_ratio).toBe("2:3");
    expect(fullBody.width).toBe(896);
    expect(fullBody.height).toBe(1344);
    expect(portrait.cost).toBe(0.5625);
    expect(fullBody.cost).toBe(0.5625);
    expect(typeof portrait.seed).toBe("number");
    // Pre-rendered deterministic prompts — the stored string IS the builder output.
    expect(portrait.prompt).toBe(buildPortraitPrompt(spec));
    expect(fullBody.prompt).toBe(buildFullBodyPrompt(spec));

    // Both rows linked to the character.
    const linked = await db.generation.findMany({ where: { characterId: character.id } });
    expect(linked.length).toBe(2);

    // Wallet burns EXACTLY 1.125 total (0.5625 each — Float credit columns).
    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(8.875);
    expect(portrait.credits_spent).toEqual([{ pool: "wallet", amount: 0.5625 }]);
    expect(fullBody.credits_spent).toEqual([{ pool: "wallet", amount: 0.5625 }]);

    // Both jobs reach done (character-detail polling advances the queue) and the
    // mock fixture assets resolve into the character JSON.
    await waitFor(() => sheetDone(jar, character.id), 20000, "sheet jobs done");

    const detail = (await (await authFetch(jar, `/api/characters/${character.id}`)).json()) as {
      character: CharacterJson;
      jobs: JobJson[];
    };
    expect(detail.character.portrait_asset_url).toMatch(/^data:image\/svg\+xml;base64,/);
    expect(detail.character.full_body_asset_url).toMatch(/^data:image\/svg\+xml;base64,/);
    for (const j of detail.jobs) {
      expect(j.status).toBe("done");
      expect(j.asset_url).toMatch(/^data:image\/svg\+xml;base64,/);
    }
  });

  test("insufficient credits → 402 {detail, needed: 1.125, available} with full atomicity", async () => {
    const email = "hf-w7-test-broke@hf-test.local";
    const jar = await login(email, "w7_broke");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 1 }]);
    const character = await createCharacter(jar);

    const res = await authFetch(jar, `/api/characters/${character.id}/generate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ detail: "insufficient credits", needed: 1.125, available: 1 });

    // Atomic: no Generation rows created, no burn.
    const count = await db.generation.count({ where: { userId: user.id } });
    expect(count).toBe(0);
    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(1);
  });
});

describe("motion pipeline — portrait-preconditioned video job", () => {
  test("motion without a done portrait → 400 (sheet-first precondition)", async () => {
    const jar = await login("hf-w7-test-early@hf-test.local", "w7_early");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);
    const character = await createCharacter(jar);

    const res = await authFetch(jar, `/api/characters/${character.id}/motion`, {
      method: "POST",
      body: JSON.stringify({ preset_id: "confident-walk" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toBe(
      "generate the character sheet first — motion needs the character's portrait"
    );
  });

  test("motion after a done sheet → 200 {job}: video/wan2.2-i2v-flash/cost 5, portrait as input, exact 5 burn, reaches done", async () => {
    const email = "hf-w7-test-motion@hf-test.local";
    const jar = await login(email, "w7_motion");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 10 }]);

    const spec = specWith(MOTION_SPEC);
    const character = await createCharacter(jar, { spec });

    // The sheet first (motion's precondition): generate + wait done.
    const gen = await authFetch(jar, `/api/characters/${character.id}/generate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    expect(gen.status).toBe(200);
    await waitFor(() => sheetDone(jar, character.id), 20000, "sheet jobs done before motion");

    const preset = findMotionPreset("confident-walk");
    if (!preset) throw new Error("confident-walk preset missing from the option library");

    const res = await authFetch(jar, `/api/characters/${character.id}/motion`, {
      method: "POST",
      body: JSON.stringify({ preset_id: "confident-walk" }),
    });
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: JobJson };
    expect(job.job_set_type).toBe("influencer_motion");
    expect(job.kind).toBe("video");
    expect(job.model_version).toBe("wan2.2-i2v-flash");
    expect(job.aspect_ratio).toBe("16:9");
    expect(job.width).toBe(1200);
    expect(job.height).toBe(672);
    expect(job.cost).toBe(5);
    expect(job.status).toBe("queued");
    expect(typeof job.seed).toBe("number");
    // Deterministic pre-rendered motion prompt (preset first, spec second).
    expect(job.prompt).toBe(buildMotionPrompt(preset, spec));

    // The identity input: the character's done portrait asset.
    const sheet = (await (await authFetch(jar, `/api/characters/${character.id}`)).json()) as {
      character: CharacterJson;
    };
    const portraitAsset = sheet.character.portrait_asset_url;
    if (!portraitAsset) throw new Error("portrait asset missing after sheet done");
    expect(job.input_images).toEqual([portraitAsset]);

    // Wallet: 10 − 1.125 (sheet) − 5 (motion) = 3.875 — exact.
    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(3.875);
    expect(job.credits_spent).toEqual([{ pool: "wallet", amount: 5 }]);

    // The motion job reaches done with the mock video asset (an SVG data URI —
    // the mock provider's deterministic fixture).
    await waitFor(async () => {
      const r = await authFetch(jar, `/api/characters/${character.id}`);
      const body = (await r.json()) as { jobs: JobJson[] };
      const motion = body.jobs.find((j) => j.job_set_type === "influencer_motion");
      return motion?.status === "done";
    }, 20000, "motion job done");

    const final = (await (await authFetch(jar, `/api/characters/${character.id}`)).json()) as {
      character: CharacterJson;
      jobs: JobJson[];
    };
    expect(final.jobs.length).toBe(3); // portrait + full-body + motion
    const motion = final.jobs.find((j) => j.job_set_type === "influencer_motion");
    if (!motion) throw new Error("motion job missing from the character detail");
    expect(motion.status).toBe("done");
    expect(motion.asset_url).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  test("unknown preset_id → 400; camelCase body → 400 (strict shape)", async () => {
    const jar = await login("hf-w7-test-badpreset@hf-test.local", "w7_badpreset");
    const character = await createCharacter(jar);

    const res = await authFetch(jar, `/api/characters/${character.id}/motion`, {
      method: "POST",
      body: JSON.stringify({ preset_id: "backflip-nope" }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toBe("unknown motion preset: backflip-nope");

    const camel = await authFetch(jar, `/api/characters/${character.id}/motion`, {
      method: "POST",
      body: JSON.stringify({ presetId: "confident-walk" }),
    });
    expect(camel.status).toBe(400);
  });
});
