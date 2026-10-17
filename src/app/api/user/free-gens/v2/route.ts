/**
 * GET /api/user/free-gens/v2 — §1c touring shape (verbatim; `remaining` is an additive
 * clone-side key so the UI can show the live free-gens hint).
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { MODEL_CATALOG } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const grants = await db.freeGensGrant.findMany({ where: { userId: user.id } });
  const grant = grants[0];

  if (!grant) {
    return NextResponse.json({ eligible: false, can_skip: true, rewards: null, existing: null, flows: [] });
  }

  const model = Object.values(MODEL_CATALOG).find((m) => m.jobSetType === grant.jobSetType);
  return NextResponse.json({
    eligible: false,
    can_skip: true,
    rewards: {
      free_generations: {
        amount: grant.amount,
        job_set_type: grant.jobSetType,
        model_label: model?.label ?? grant.jobSetType,
        claimed: grant.claimed,
        expires_at: grant.expiresAt?.toISOString() ?? null,
        remaining: Math.max(0, grant.amount - grant.used),
      },
    },
    existing: null,
    flows: [],
  });
}
