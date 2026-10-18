import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();
async function main() {
  const g = await db.generation.create({
    data: {
      userId: "seed-user-demo", modelVersion: "probe", jobSetType: "probe", kind: "image",
      prompt: "float probe", aspectRatio: "1:1", resolution: "1k",
      width: 1, height: 1, batchSize: 1, cost: 0.5625, seed: 1, status: "queued", characterId: null,
    },
  });
  console.log("roundtrip cost=", g.cost, "exact:", g.cost === 0.5625);
  // pool decrement roundtrip
  const pool = await db.creditPool.update({ where: { userId_kind: { userId: "seed-user-demo", kind: "wallet" } }, data: { balance: { decrement: 0.5625 } } });
  console.log("wallet after decrement:", pool.balance, "exact:", pool.balance === 929.4375);
  await db.creditPool.update({ where: { userId_kind: { userId: "seed-user-demo", kind: "wallet" } }, data: { balance: { increment: 0.5625 } } });
  await db.generation.delete({ where: { id: g.id } });
  const restored = await db.creditPool.findUnique({ where: { userId_kind: { userId: "seed-user-demo", kind: "wallet" } } });
  console.log("wallet restored:", restored?.balance);
}
main().catch((e) => { console.error("FATAL", String(e).slice(0, 300)); process.exit(1); }).finally(() => db.$disconnect());
