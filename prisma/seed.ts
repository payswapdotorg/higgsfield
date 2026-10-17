/**
 * HF-W2 idempotent seed.
 *
 * Rules:
 * - Every row is upserted by a stable key (fixed `seed-*` ids or unique columns), so re-running
 *   the seed never duplicates rows and resets seed fixtures to their canonical values.
 * - Deterministic: fixed dates, fixed view/like counts, no Math.random, no wall-clock.
 * - Fixture asset paths reference /fixtures/gen-XX.png (generated via the image-generation skill).
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const NOTICE_TEMPORARY_ISSUES = JSON.stringify([
  {
    variant: "warning",
    badge: {
      label: "Temporary Issues",
      tooltip:
        "wan2_2_animate_faceswap is experiencing temporary issues. Generations may fail or take longer than usual.",
    },
  },
]);

const CREATOR_USERNAMES = [
  "aurora_frames",
  "neon.nomad",
  "studio.kai",
  "vega.motion",
  "raven.pixels",
  "lumen.works",
  "echo.drift",
  "nova.films",
] as const;

// 12 community feed publications (§3.5) over fixture assets gen-01..gen-12.
const FEED: Array<{
  fixture: string;
  username: string;
  prompt: string;
  model: "nano-banana-2" | "cinema-studio-4";
  kind: "image" | "video";
  aspect: "3:4" | "16:9" | "1:1";
  width: number;
  height: number;
  views: number;
  likes: number;
  publishedAt: string;
}> = [
  { fixture: "gen-01", username: "aurora_frames", prompt: "Cinematic portrait of a woman in a neon-lit rainy Tokyo street at night, holding a transparent umbrella, reflections on wet asphalt", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 12840, likes: 921, publishedAt: "2026-10-16T10:00:00Z" },
  { fixture: "gen-02", username: "neon.nomad", prompt: "Astronaut standing in a vast red desert at golden hour, dramatic long shadow, cinematic sci-fi film still", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 10422, likes: 812, publishedAt: "2026-10-16T08:30:00Z" },
  { fixture: "gen-03", username: "studio.kai", prompt: "1970s vintage muscle car drifting on a dusty road, motion blur, film grain, warm tones", model: "nano-banana-2", kind: "image", aspect: "1:1", width: 1024, height: 1024, views: 9310, likes: 774, publishedAt: "2026-10-15T18:00:00Z" },
  { fixture: "gen-04", username: "vega.motion", prompt: "Ballerina mid-leap surrounded by an explosion of flour, black studio background, dramatic rim lighting", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 8755, likes: 655, publishedAt: "2026-10-15T12:45:00Z" },
  { fixture: "gen-05", username: "raven.pixels", prompt: "Samurai warrior walking through a misty bamboo forest at dawn, moody cinematic atmosphere", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 7602, likes: 598, publishedAt: "2026-10-14T20:15:00Z" },
  { fixture: "gen-06", username: "lumen.works", prompt: "Retro-futuristic space station interior with orange sunset light through huge panoramic windows, 70s sci-fi style", model: "cinema-studio-4", kind: "video", aspect: "16:9", width: 1200, height: 672, views: 6817, likes: 540, publishedAt: "2026-10-14T09:00:00Z" },
  { fixture: "gen-07", username: "echo.drift", prompt: "High-fashion editorial portrait, model wearing iridescent holographic fabric, studio lighting", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 5980, likes: 487, publishedAt: "2026-10-13T16:30:00Z" },
  { fixture: "gen-08", username: "nova.films", prompt: "Lone climber on a snowy mountain ridge at golden hour, epic scale, cinematic landscape", model: "cinema-studio-4", kind: "video", aspect: "16:9", width: 1200, height: 672, views: 4531, likes: 402, publishedAt: "2026-10-12T11:20:00Z" },
  { fixture: "gen-09", username: "aurora_frames", prompt: "Scuba diver exploring sunken ancient ruins, light rays piercing turquoise water", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 3922, likes: 351, publishedAt: "2026-10-11T14:00:00Z" },
  { fixture: "gen-10", username: "neon.nomad", prompt: "Cowboy silhouette riding through a dust storm, western film still, backlit orange sky", model: "nano-banana-2", kind: "image", aspect: "1:1", width: 1024, height: 1024, views: 2870, likes: 266, publishedAt: "2026-10-10T10:10:00Z" },
  { fixture: "gen-11", username: "studio.kai", prompt: "White cat with a tiny umbrella on a neon Hong Kong street after rain, cinematic reflections", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 2415, likes: 240, publishedAt: "2026-10-08T19:45:00Z" },
  { fixture: "gen-12", username: "vega.motion", prompt: "Explorer with a torch discovering a vast ancient library, dust particles in the light beam", model: "nano-banana-2", kind: "image", aspect: "3:4", width: 896, height: 1200, views: 1987, likes: 187, publishedAt: "2026-10-05T08:00:00Z" },
];

const CONTESTS = [
  {
    id: "seed-contest-1",
    slug: "neon-dreams",
    title: "Neon Dreams",
    description: "Submit your most atmospheric neon-lit cinematics. Rain, reflections, and night cities.",
    startAt: "2026-10-01T00:00:00Z",
    endAt: "2026-10-31T23:59:59Z",
    status: "open",
    previewImage: "/fixtures/gen-06.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: "#",
  },
  {
    id: "seed-contest-2",
    slug: "cinematic-portraits-2026",
    title: "Cinematic Portraits 2026",
    description: "Portrait photography with a story. Dramatic light, film grain, real emotion.",
    startAt: "2026-09-15T00:00:00Z",
    endAt: "2026-11-15T23:59:59Z",
    status: "open",
    previewImage: "/fixtures/gen-08.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: "#",
  },
  {
    id: "seed-contest-3",
    slug: "motion-masters",
    title: "Motion Masters",
    description: "Best AI video motion shot of the season. Camera moves that tell the story.",
    startAt: "2026-10-10T00:00:00Z",
    endAt: "2026-12-01T23:59:59Z",
    status: "open",
    previewImage: "/fixtures/gen-10.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: "#",
  },
];

function iso(date: string): Date {
  return new Date(date);
}

async function main() {
  // ── demo user + credit pools + free-gens (§1c anchors: wallet 1000, daily 10, face_swap 2, touring 5) ──
  const demo = await db.user.upsert({
    where: { email: "demo@hf-studio.local" },
    update: { username: "demo_creator", displayName: "Demo Creator", planType: "free" },
    create: {
      id: "seed-user-demo",
      email: "demo@hf-studio.local",
      username: "demo_creator",
      displayName: "Demo Creator",
      planType: "free",
    },
  });

  const pools: Array<{ kind: string; balance: number; ledgerId: string }> = [
    { kind: "wallet", balance: 1000, ledgerId: "seed-ledger-1" },
    { kind: "daily", balance: 10, ledgerId: "seed-ledger-2" },
    { kind: "model:face_swap", balance: 2, ledgerId: "seed-ledger-3" },
  ];
  for (const p of pools) {
    const pool = await db.creditPool.upsert({
      where: { userId_kind: { userId: demo.id, kind: p.kind } },
      update: { balance: p.balance, expiresAt: null },
      create: { userId: demo.id, kind: p.kind, balance: p.balance },
    });
    await db.creditLedger.upsert({
      where: { id: p.ledgerId },
      update: {},
      create: {
        id: p.ledgerId,
        userId: demo.id,
        poolKind: p.kind,
        poolId: pool.id,
        delta: p.balance,
        balanceAfter: p.balance,
        reason: "signup_bonus",
      },
    });
  }

  await db.freeGensGrant.upsert({
    where: { userId_jobSetType: { userId: demo.id, jobSetType: "nano_banana_2" } },
    update: { amount: 5, used: 0, claimed: false, expiresAt: null },
    create: { userId: demo.id, amount: 5, used: 0, jobSetType: "nano_banana_2", claimed: false },
  });

  // ── demo user's folder with 3 completed generations (incl. the wan2_2 notice case) ──
  await db.folder.upsert({
    where: { id: "seed-folder-1" },
    update: { name: "My first project", userId: demo.id },
    create: { id: "seed-folder-1", userId: demo.id, name: "My first project" },
  });

  const demoGens = [
    {
      id: "seed-gen-101",
      modelVersion: "nano-banana-2",
      jobSetType: "nano_banana_2",
      kind: "image",
      prompt: "Surfer riding a giant barrel wave during a storm, dramatic seaspray, cinematic action photography",
      aspectRatio: "3:4",
      resolution: "1k",
      width: 896,
      height: 1200,
      assetUrl: "/fixtures/gen-13.png",
      notices: "[]",
      publishedAt: null as string | null,
    },
    {
      id: "seed-gen-102",
      modelVersion: "cinema-studio-4",
      jobSetType: "cinema_studio_4",
      kind: "video",
      prompt: "Dancer with long-exposure light trails on a dark stage, motion art film",
      aspectRatio: "16:9",
      resolution: "1k",
      width: 1200,
      height: 672,
      assetUrl: "/fixtures/gen-15.png",
      notices: "[]",
      publishedAt: null as string | null,
    },
    {
      id: "seed-gen-103",
      modelVersion: "wan-2-2-animate-faceswap",
      jobSetType: "wan2_2_animate_faceswap",
      kind: "video",
      prompt: "Chef plating a gourmet dish in a dramatic dark kitchen, steam rising, slow camera push-in",
      aspectRatio: "16:9",
      resolution: "1k",
      width: 1200,
      height: 672,
      assetUrl: "/fixtures/gen-14.png",
      notices: NOTICE_TEMPORARY_ISSUES,
      publishedAt: null as string | null,
    },
  ];
  for (const g of demoGens) {
    await db.generation.upsert({
      where: { id: g.id },
      update: {
        status: "done",
        assetUrl: g.assetUrl,
        assetKind: g.kind,
        notices: g.notices,
        error: null,
        seed: 101,
        cost: g.jobSetType === "nano_banana_2" ? 2 : g.jobSetType === "cinema_studio_4" ? 80 : 30,
        creditSpend: JSON.stringify([{ pool: "wallet", amount: g.jobSetType === "nano_banana_2" ? 2 : g.jobSetType === "cinema_studio_4" ? 80 : 30 }]),
        publishedAt: g.publishedAt ? iso(g.publishedAt) : null,
      },
      create: {
        id: g.id,
        userId: demo.id,
        folderId: "seed-folder-1",
        modelVersion: g.modelVersion,
        jobSetType: g.jobSetType,
        kind: g.kind,
        prompt: g.prompt,
        aspectRatio: g.aspectRatio,
        resolution: g.resolution,
        width: g.width,
        height: g.height,
        batchSize: 1,
        inputImages: "[]",
        workspaceId: `ws_${demo.id}`,
        status: "done",
        seed: 101,
        cost: g.jobSetType === "nano_banana_2" ? 2 : g.jobSetType === "cinema_studio_4" ? 80 : 30,
        creditSpend: JSON.stringify([{ pool: "wallet", amount: g.jobSetType === "nano_banana_2" ? 2 : g.jobSetType === "cinema_studio_4" ? 80 : 30 }]),
        assetUrl: g.assetUrl,
        assetKind: g.kind,
        notices: g.notices,
        createdAt: iso("2026-10-15T09:00:00Z"),
      },
    });
  }

  // ── creator users + 12 published feed entries (§3.5) ──
  for (const username of CREATOR_USERNAMES) {
    await db.user.upsert({
      where: { username },
      update: {},
      create: {
        id: `seed-user-${username.replace(/[^a-z0-9]/g, "")}`,
        email: `${username.replace(/[^a-z0-9]/g, "")}@community.hf-studio.local`,
        username,
        displayName: username.replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        planType: "free",
      },
    });
  }

  for (let i = 0; i < FEED.length; i++) {
    const f = FEED[i];
    const genId = `seed-gen-${String(i + 1).padStart(3, "0")}`;
    const usernameRow = await db.user.findUnique({ where: { username: f.username } });
    if (!usernameRow) throw new Error(`seed bug: creator ${f.username} missing`);
    const cost = f.model === "nano-banana-2" ? 2 : 80;
    await db.generation.upsert({
      where: { id: genId },
      update: {
        status: "done",
        assetUrl: `/fixtures/${f.fixture}.png`,
        assetKind: f.kind,
        notices: "[]",
        publishedAt: iso(f.publishedAt),
      },
      create: {
        id: genId,
        userId: usernameRow.id,
        folderId: null,
        modelVersion: f.model,
        jobSetType: f.model === "nano-banana-2" ? "nano_banana_2" : "cinema_studio_4",
        kind: f.kind,
        prompt: f.prompt,
        aspectRatio: f.aspect,
        resolution: "1k",
        width: f.width,
        height: f.height,
        batchSize: 1,
        inputImages: "[]",
        status: "done",
        seed: 1000 + i,
        cost,
        creditSpend: JSON.stringify([{ pool: "wallet", amount: cost }]),
        assetUrl: `/fixtures/${f.fixture}.png`,
        assetKind: f.kind,
        notices: "[]",
        publishedAt: iso(f.publishedAt),
        createdAt: iso(f.publishedAt),
      },
    });
    await db.feedPublication.upsert({
      where: { generationId: genId },
      update: {
        authorUsername: f.username,
        thumbnailUrl: `/fixtures/${f.fixture}.png`,
        views: f.views,
        likes: f.likes,
        publishedAt: iso(f.publishedAt),
      },
      create: {
        id: `seed-pub-${String(i + 1).padStart(3, "0")}`,
        generationId: genId,
        authorUsername: f.username,
        thumbnailUrl: `/fixtures/${f.fixture}.png`,
        views: f.views,
        likes: f.likes,
        publishedAt: iso(f.publishedAt),
      },
    });
  }

  // ── 3 contests (§1e field names verbatim; values are demo data) ──
  for (const c of CONTESTS) {
    await db.contest.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        description: c.description,
        startAt: iso(c.startAt),
        endAt: iso(c.endAt),
        status: c.status,
        previewImage: c.previewImage,
        previewVideo: c.previewVideo,
        logoUrl: c.logoUrl,
        redirectUrl: c.redirectUrl,
      },
      create: {
        id: c.id,
        slug: c.slug,
        title: c.title,
        description: c.description,
        startAt: iso(c.startAt),
        endAt: iso(c.endAt),
        status: c.status,
        previewImage: c.previewImage,
        previewVideo: c.previewVideo,
        logoUrl: c.logoUrl,
        redirectUrl: c.redirectUrl,
      },
    });
  }

  const counts = {
    users: await db.user.count(),
    folders: await db.folder.count(),
    generations: await db.generation.count(),
    pools: await db.creditPool.count(),
    grants: await db.freeGensGrant.count(),
    publications: await db.feedPublication.count(),
    contests: await db.contest.count(),
  };
  console.log("[seed] complete:", JSON.stringify(counts));
}

main()
  .catch((e) => {
    console.error("[seed] failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
