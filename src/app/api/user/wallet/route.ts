/** GET /api/user/wallet — §1c wallet body (verbatim key set). */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const pools = await db.creditPool.findMany({ where: { userId: user.id } });
  const wallet = pools.find((p) => p.kind === "wallet")?.balance ?? 0;
  const bonus = pools
    .filter((p) => p.kind.startsWith("model:"))
    .reduce((sum, p) => sum + p.balance, 0);

  return NextResponse.json({
    workspace_id: `ws_${user.id}`,
    credits_balance: wallet,
    subscription_balance: 0,
    wallet_created_at: user.createdAt.toISOString(),
    next_credit_allocation_date: null,
    total_credits: wallet + bonus,
    on_demand_credits: 0,
    bonus_credits: bonus,
    bonus_credits_expire_at: null,
    expire_days: 90,
    credit_limit: null,
    group_credit_allocation: null,
  });
}
