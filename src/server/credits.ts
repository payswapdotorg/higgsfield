/**
 * Credit spend engine (HF-W2 §3.2).
 *
 * Burn order (documented contract): free-gens grant for the matching jobSetType FIRST, then the
 * per-model pool `model:<jobSetType>`, then `daily`, then `wallet` (§3.4 pins free-gens before wallet).
 *
 * Atomicity: every debit is a compare-and-set (`updateMany` guarded on the current balance/used
 * in the same SQL statement), executed inside a single Prisma interactive transaction that also
 * creates the job row — so concurrent submissions can never double-spend.
 */
import type { Prisma, PrismaClient } from "@prisma/client";
import type { CreditSpendEntry } from "@/lib/job-shape";

export class InsufficientCreditsError extends Error {
  constructor(public needed: number, public available: number) {
    super(`insufficient credits: needed ${needed}, available ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

type Tx = Prisma.TransactionClient;

export async function computeSpendPlan(
  tx: Tx,
  userId: string,
  jobSetType: string,
  cost: number
): Promise<{ plan: CreditSpendEntry[]; available: number }> {
  const grant = await tx.freeGensGrant.findUnique({
    where: { userId_jobSetType: { userId, jobSetType } },
  });
  const pools = await tx.creditPool.findMany({
    where: { userId, kind: { in: [`model:${jobSetType}`, "daily", "wallet"] } },
  });
  const modelPool = pools.find((p) => p.kind === `model:${jobSetType}`);
  const dailyPool = pools.find((p) => p.kind === "daily");
  const walletPool = pools.find((p) => p.kind === "wallet");

  const plan: CreditSpendEntry[] = [];
  let remaining = cost;

  const grantAvailable = grant ? Math.max(0, grant.amount - grantUsedSafe(grant)) : 0;
  if (grantAvailable > 0 && remaining > 0) {
    const take = Math.min(grantAvailable, remaining);
    plan.push({ pool: `free_gens:${jobSetType}`, amount: take });
    remaining -= take;
  }
  for (const pool of [modelPool, dailyPool, walletPool]) {
    if (!pool || remaining <= 0) continue;
    const take = Math.min(pool.balance, remaining);
    if (take > 0) {
      plan.push({ pool: pool.kind, amount: take });
      remaining -= take;
    }
  }

  const available =
    grantAvailable + [modelPool, dailyPool, walletPool].reduce((sum, p) => sum + (p?.balance ?? 0), 0);

  return { plan, available };
}

/** `used` can never exceed `amount` in a healthy DB; clamp defensively. */
function grantUsedSafe(grant: { amount: number; used: number }): number {
  return Math.min(grant.used, grant.amount);
}

export async function spendCredits(
  tx: Tx,
  args: { userId: string; jobSetType: string; cost: number; jobId: string }
): Promise<CreditSpendEntry[]> {
  const { plan, available } = await computeSpendPlan(tx, args.userId, args.jobSetType, args.cost);
  if (plan.reduce((s, p) => s + p.amount, 0) < args.cost) {
    throw new InsufficientCreditsError(args.cost, available);
  }

  for (const entry of plan) {
    if (entry.pool.startsWith("free_gens:")) {
      const grant = await tx.freeGensGrant.findUnique({
        where: { userId_jobSetType: { userId: args.userId, jobSetType: args.jobSetType } },
      });
      if (!grant) throw new InsufficientCreditsError(args.cost, available);
      // CAS: only succeed if `used` still leaves room for this take within `amount`.
      const res = await tx.freeGensGrant.updateMany({
        where: { userId: args.userId, jobSetType: args.jobSetType, used: { lte: grant.amount - entry.amount } },
        data: { used: { increment: entry.amount } },
      });
      if (res.count !== 1) throw new InsufficientCreditsError(args.cost, available);
      const after = await tx.freeGensGrant.findUnique({
        where: { userId_jobSetType: { userId: args.userId, jobSetType: args.jobSetType } },
      });
      await tx.creditLedger.create({
        data: {
          userId: args.userId,
          poolKind: entry.pool,
          jobId: args.jobId,
          delta: -entry.amount,
          balanceAfter: after ? after.amount - after.used : 0,
          reason: "free_generations",
        },
      });
    } else {
      // CAS: guarded compare-and-decrement — concurrent spenders cannot go negative.
      const res = await tx.creditPool.updateMany({
        where: { userId: args.userId, kind: entry.pool, balance: { gte: entry.amount } },
        data: { balance: { decrement: entry.amount } },
      });
      if (res.count !== 1) throw new InsufficientCreditsError(args.cost, available);
      const pool = await tx.creditPool.findUnique({
        where: { userId_kind: { userId: args.userId, kind: entry.pool } },
      });
      await tx.creditLedger.create({
        data: {
          userId: args.userId,
          poolKind: entry.pool,
          poolId: pool?.id,
          jobId: args.jobId,
          delta: -entry.amount,
          balanceAfter: pool?.balance ?? 0,
          reason: "generation",
        },
      });
    }
  }

  return plan;
}

/** Sum of all fundable balances for a user (used for the "all pools empty" gate). */
export async function totalAvailableCredits(
  db: PrismaClient,
  userId: string,
  jobSetType: string
): Promise<number> {
  const { available } = await computeSpendPlan(db, userId, jobSetType, Number.MAX_SAFE_INTEGER);
  return available;
}
