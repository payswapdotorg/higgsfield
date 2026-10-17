/**
 * GET /api/user — §1c trimmed user body (verbatim key set, values mapped from the wave-2
 * CreditPool/FreeGensGrant model). Per-model bonus pools map to the evidence's fixed keys.
 */
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const MODEL_POOL_KEYS: Record<string, string> = {
  wan2_5_video: "wan2_5_video_credits",
  text2keyframes: "text2keyframes_credits",
  face_swap: "face_swap_credits",
  qwen_camera_control: "qwen_camera_control_credits",
  character_swap: "character_swap_credits",
};

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const pools = await db.creditPool.findMany({ where: { userId: user.id } });
  const poolBalance = (kind: string) => pools.find((p) => p.kind === kind)?.balance ?? 0;

  const packageCredits = poolBalance("wallet");
  const dailyCredits = poolBalance("daily");
  const bonusCredits = pools
    .filter((p) => p.kind.startsWith("model:"))
    .reduce((sum, p) => sum + p.balance, 0);

  const modelCredits: Record<string, number> = {};
  for (const [jobSetType, key] of Object.entries(MODEL_POOL_KEYS)) {
    modelCredits[key] = poolBalance(`model:${jobSetType}`);
  }

  return NextResponse.json({
    id: `user_${user.id}`,
    enterprise_new_main: false,
    plan_type: user.planType,
    subscription_credits: 0.0,
    package_credits: packageCredits,
    bonus_credits: bonusCredits,
    bonus_credits_expire_at: null,
    soul_credits: 0.0,
    ...modelCredits,
    daily_credits: dailyCredits,
    total_plan_credits: packageCredits + dailyCredits,
    billing: {},
  });
}
