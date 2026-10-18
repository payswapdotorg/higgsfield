import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  // empirical: does Prisma accept a fractional cost into the Int column?
  try {
    const g = await db.generation.create({
      data: {
        userId: "seed-user-demo",
        modelVersion: "probe", jobSetType: "probe", kind: "image",
        prompt: "int probe", aspectRatio: "1:1", resolution: "1k",
        width: 1, height: 1, batchSize: 1, cost: 0.5625, seed: 1, status: "queued",
      } as never,
    });
    console.log("ACCEPTED id=", g.id, "cost=", (g as { cost: number }).cost);
    await db.generation.delete({ where: { id: g.id } });
  } catch (e) {
    console.log("REJECTED:", String(e).split("\n").slice(0, 3).join(" | ").slice(0, 300));
  }
}
main().catch((e) => { console.error("FATAL", String(e).slice(0, 200)); process.exit(1); }).finally(() => db.$disconnect());
