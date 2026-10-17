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

/**
 * 3 contests — §1e field names verbatim; values now taken from the live
 * contests body (HF-W3C C4: evidence/rea-2026-10-17/api-bodies-digest.json →
 * contests items, keys prize_pool / submissions_count / winner /
 * some_contestants / judges / is_trending included verbatim where captured).
 * Clone-side mappings (disclosed): the digest preview_image/logo_url values
 * are live CDN assets, so previewImage points at the local fixtures the seed
 * ships (same convention as the feed fixtures); winner/contestant/judge
 * avatar_url values keep their digest URLs and degrade to initials offline.
 */
const ACTION_SCENE_WINNER = JSON.stringify({
  id: "user_2wC4cmbjNFlqEz3cX7be7cO9GDv",
  username: "mrabujoe",
  avatar_url:
    "https://d2ol7oe51mr4n9.cloudfront.net/user_2wC4cmbjNFlqEz3cX7be7cO9GDv/2c041173-8c71-4c46-9e73-21d45ef8900d.png",
});

const ACTION_SCENE_CONTESTANTS = JSON.stringify([
  { id: "user_2v6VgaMnJ5GyJeBVqK7RHExAAc6", username: "deepframelabs", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/user_2v6VgaMnJ5GyJeBVqK7RHExAAc6/17ee8356-28d1-44e0-a1c0-14ff2f1262da.jpg" },
  { id: "user_2v5lW6QMh8Qe2ErAEdImqKSFhmY", username: "visioneer", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/anon_user_id/c90e97a2-7323-4f2a-b5de-b35984fcf95e.jpg" },
  { id: "user_2v6W8MMS96Ng1RrIzn6xP1EAK43", username: "adamadam", avatar_url: "https://d1xarpci4ikg0w.cloudfront.net/profile-avatars/v1/211d812645b21c8482077bd6dd281782.webp" },
  { id: "user_2v5thGZ3LeID5zCBaaPJeBhaTQr", username: "fotachu", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/user_2v5thGZ3LeID5zCBaaPJeBhaTQr/19bd3145-2738-409c-95ae-353b85d353e7.jpg" },
  { id: "user_2v66kcK2bDovMs4Dba0ZaJaaWrc", username: "camheyes", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/user_2v66kcK2bDovMs4Dba0ZaJaaWrc/a27389dc-a37f-417e-8588-485162b66204.jpg" },
  { id: "user_2v5tbYAddEFriH9nud9AKNujdGN", username: "sketching_llama_omega", avatar_url: "https://d1xarpci4ikg0w.cloudfront.net/profile-avatars/v1/804fd0cc49c2122d14eac995882475b4.webp" },
  { id: "user_2v6XdxSJ5n6ngySyAMBDqwTKnj6", username: "dreamdesyn", avatar_url: "https://d1xarpci4ikg0w.cloudfront.net/profile-avatars/v1/ccae25129bf850c1549064166a6e6f99.webp" },
  { id: "user_2v6KEzDLumxxwu7GI9eb73l4aRu", username: "kasianovakai", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/user_2v6KEzDLumxxwu7GI9eb73l4aRu/8187c1a4-b2be-4709-982c-7b640d13a196.jpg" },
  { id: "user_2v66OLomUuCbeYP5EOQNBVxEOE6", username: "ice_rain", avatar_url: "https://d1xarpci4ikg0w.cloudfront.net/profile-avatars/v1/e22673f69113f507d10aeec0c9810bac.webp" },
  { id: "user_2v6Or0AGes1YnhsXX8LfVxcnAG1", username: "rothko_banana_ultimate", avatar_url: "https://d1xarpci4ikg0w.cloudfront.net/profile-avatars/v1/9966e6e916b7a74a95e1feae464cfb07.webp" },
]);

const ACTION_SCENE_JUDGES = JSON.stringify([
  { user_id: null, display_name: "Buralqy", description: "VFX Studio", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/a6092285-70a4-4f4e-93d7-9a467dd9f5e4.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/bfc93f24-ded8-41e0-af87-e9ebe1fb9428.png", external_link: "https://buralqy.com/" },
  { user_id: null, display_name: "PBC Worldwide", description: "Production Studio", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/13296e60-d281-4364-8965-2303165683bf.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/b6e4f1b8-4e8e-42ce-9b99-cb3dec28ef1d.png", external_link: "https://www.instagram.com/pbc.worldwide/" },
  { user_id: null, display_name: "Secret Level", description: "AI Production Studio", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/873799f7-2dd5-45cc-a314-ec4a4ba535c5.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/00a3757f-b4f4-4e43-9984-5101754d7fa1.png", external_link: "https://www.secretlevel.co" },
  { user_id: null, display_name: "Rourke", description: "AI Blog", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/64ea9204-e29a-4f49-9f83-41323ed166b2.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/f29599bd-a91b-49d6-a9e7-1d5759e16081.png", external_link: "https://www.instagram.com/rourke/" },
  { user_id: null, display_name: "PJ Ace", description: "AI Creator", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/03597b56-e616-47ea-bd8c-759679cb2db0.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/052ed2fd-c7b8-4de7-b62f-f737801ad236.png", external_link: "https://www.instagram.com/pjacefilms/" },
  { user_id: null, display_name: "Jama Jurabaev", description: "Concept Artist", avatar_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/1d95213a-fe87-430f-9171-a15999d592da.png", background_url: "https://d2ol7oe51mr4n9.cloudfront.net/content_user_id/19013bc9-45f7-44d6-a490-dcb40a7fc9cb.png", external_link: "https://www.instagram.com/jamajurabaev/" },
]);

const CONTESTS = [
  {
    id: "seed-contest-1",
    slug: "higgsfield-global-film-festival",
    title: "Higgsfield Festival",
    description: "Higgsfield AI Film Festival — $1,000,000 Prize Pool",
    startAt: "2026-07-16T00:00:00Z",
    endAt: "2026-07-30T23:59:00Z",
    status: "open",
    previewImage: "/fixtures/gen-06.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: null,
    prizePool: 1000000,
    submissionsCount: 0,
    winner: null,
    someContestants: "[]",
    judges: "[]",
    isTrending: true,
  },
  {
    id: "seed-contest-2",
    slug: "higgsfield-seedance-2-contest",
    title: "Higgsfield Seedance 2.0 Contest",
    description: "Higgsfield Seedance 2.0 Contest",
    startAt: "2026-04-07T12:00:00Z",
    endAt: "2026-04-14T12:00:00Z",
    status: "created",
    previewImage: "/fixtures/gen-08.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: null,
    prizePool: 50000,
    submissionsCount: 0,
    winner: null,
    someContestants: "[]",
    judges: "[]",
    isTrending: false,
  },
  {
    id: "seed-contest-3",
    slug: "make-your-action-scene",
    title: "Make Your Action Scene",
    description:
      "Build a world, pick your hero, raise the stakes, and cut a scene that makes people wish your film was real.",
    startAt: "2026-02-09T19:00:00Z",
    endAt: "2026-03-01T08:00:00Z",
    status: "finished",
    previewImage: "/fixtures/gen-10.png",
    previewVideo: null,
    logoUrl: null,
    redirectUrl: null,
    prizePool: 500000,
    submissionsCount: 8752,
    winner: ACTION_SCENE_WINNER,
    someContestants: ACTION_SCENE_CONTESTANTS,
    judges: ACTION_SCENE_JUDGES,
    isTrending: false,
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

  // ── 3 contests (§1e field names verbatim; values from the live contests
  //    body — see the CONTESTS header). Stale slugs from earlier seed
  //    generations are removed so re-seeding stays canonical (HF-W3C C4). ──
  await db.contest.deleteMany({
    where: { slug: { notIn: CONTESTS.map((c) => c.slug) } },
  });
  for (const c of CONTESTS) {
    const fields = {
      title: c.title,
      description: c.description,
      startAt: iso(c.startAt),
      endAt: iso(c.endAt),
      status: c.status,
      previewImage: c.previewImage,
      previewVideo: c.previewVideo,
      logoUrl: c.logoUrl,
      redirectUrl: c.redirectUrl,
      prizePool: c.prizePool,
      submissionsCount: c.submissionsCount,
      winner: c.winner,
      someContestants: c.someContestants,
      judges: c.judges,
      isTrending: c.isTrending,
    };
    await db.contest.upsert({
      where: { slug: c.slug },
      update: fields,
      create: { id: c.id, slug: c.slug, ...fields },
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
