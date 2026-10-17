/**
 * HF Studio — wave 1 seed (idempotent).
 *
 * Run: `bun run db:seed` (bun prisma/seed.ts). Safe to run repeatedly:
 * users upsert by email, credit txns are find-then-create per (user, reason),
 * projects are find-then-create by name, contests upsert by slug.
 *
 * Determinism: fixed ISO dates only — no Math.random, no wall-clock reads.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const EPOCH = new Date("1970-01-01T00:00:00.000Z"); // 1970-01-01, onboarded
const DEMO_PINNED_AT = new Date("2026-01-15T10:00:00.000Z"); // fixed pinned date

async function seedUsers() {
  const guest = await db.user.upsert({
    where: { email: "guest@hf-studio.local" },
    update: {},
    create: {
      email: "guest@hf-studio.local",
      username: "guest",
      credits: 20,
      planTier: "free",
      onboardedAt: EPOCH,
    },
  });

  const demo = await db.user.upsert({
    where: { email: "demo@hf-studio.local" },
    update: {},
    create: {
      email: "demo@hf-studio.local",
      username: "demo",
      credits: 100,
      planTier: "starter",
      onboardedAt: EPOCH,
    },
  });

  return { guest, demo };
}

async function seedCreditTxns(guestId: string, demoId: string) {
  const ensureTxn = async (userId: string, delta: number, reason: string) => {
    const existing = await db.creditTxn.findFirst({
      where: { userId, reason },
    });
    if (!existing) {
      await db.creditTxn.create({ data: { userId, delta, reason } });
      return true;
    }
    return false;
  };

  const guestTxn = await ensureTxn(guestId, 20, "signup_bonus");
  const demoTxn = await ensureTxn(demoId, 100, "starter_plan");
  return { guestTxn, demoTxn };
}

async function seedProjects() {
  // Schema has no per-user ownership in wave 1 (guest session model), so
  // "user has none" is resolved deterministically by project name.
  const ensureProject = async (
    name: string,
    extra: { accessMode?: string; pinnedAt?: Date | null } = {},
  ) => {
    const existing = await db.project.findFirst({ where: { name } });
    if (!existing) {
      await db.project.create({
        data: {
          name,
          accessMode: extra.accessMode ?? "private",
          surface: "cinematic_studio",
          pinnedAt: extra.pinnedAt ?? null,
        },
      });
      return true;
    }
    return false;
  };

  const guestProject = await ensureProject("New project");
  const demoPinned = await ensureProject("Product launch film", {
    pinnedAt: DEMO_PINNED_AT,
  });
  const demoOther = await ensureProject("Brand visuals");

  return { guestProject, demoPinned, demoOther };
}

async function seedContests() {
  const contests = [
    // Exact captured record.
    {
      id: "4263b5fb-fead-441d-aa37-62f8aa367aa1",
      slug: "higgsfield-global-film-festival",
      title: "Higgsfield Festival",
      description: "Higgsfield AI Film Festival — $1,000,000 Prize Pool",
      startAt: new Date("2026-07-16T00:00:00.000Z"),
      endAt: new Date("2026-07-30T23:59:00.000Z"),
      status: "open",
      previewImage:
        "https://static.higgsfield.ai/contest/festival-hero/higgs_6_fix_v2-poster.webp",
      previewVideo: null,
    },
    {
      id: "5d1e2f3a-9b4c-4e5f-8a7b-2c3d4e5f6071",
      slug: "cinematic-shorts-challenge",
      title: "Cinematic Shorts Challenge",
      description: "60-second short films judged by the community",
      startAt: new Date("2026-11-01T00:00:00.000Z"),
      endAt: new Date("2026-12-15T23:59:00.000Z"),
      status: "open",
      previewImage: null,
      previewVideo: null,
    },
    {
      id: "7a8b9c0d-1e2f-4a3b-8c7d-9e0f1a2b3c4d",
      slug: "ugc-brand-sprint",
      title: "UGC Brand Sprint",
      description: "Brand-side UGC spots, fastest brief in the suite",
      startAt: new Date("2026-12-20T00:00:00.000Z"),
      endAt: new Date("2027-01-20T23:59:00.000Z"),
      status: "upcoming",
      previewImage: null,
      previewVideo: null,
    },
  ];

  for (const contest of contests) {
    await db.contest.upsert({
      where: { slug: contest.slug },
      update: { ...contest },
      create: { ...contest },
    });
  }

  return contests.length;
}

async function main() {
  const { guest, demo } = await seedUsers();
  const txns = await seedCreditTxns(guest.id, demo.id);
  const projects = await seedProjects();
  const contestCount = await seedContests();

  console.log("[seed] users: guest + demo ensured");
  console.log(
    `[seed] credit txns: guest ${txns.guestTxn ? "created" : "kept"}, demo ${
      txns.demoTxn ? "created" : "kept"
    }`,
  );
  console.log(
    `[seed] projects: ${Object.values(projects).filter(Boolean).length} created this run`,
  );
  console.log(`[seed] contests: ${contestCount} upserted`);
}

main()
  .catch((err) => {
    console.error("[seed] failed:", err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
