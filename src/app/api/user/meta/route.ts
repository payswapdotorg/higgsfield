import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";

/** Fixed promo contract constants (captured evidence). */
const PROMO_DISCOUNT_PERCENT = 55;
const PROMO_EXPIRED_AT = "2027-03-01T00:00:00Z";

/** GET /api/user/meta — account meta + personal promo (captured shape). */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  return NextResponse.json({
    user_id: user.id,
    username: user.username,
    email: user.email,
    credits: user.credits,
    plan_tier: user.planTier,
    onboarding_completed: Boolean(user.onboardedAt),
    personal_promo: {
      promo_code: `${user.username ?? "guest"}_PERSONAL_PROMO`,
      discount_percent: PROMO_DISCOUNT_PERCENT,
      expired_at: PROMO_EXPIRED_AT,
      is_claimed: false,
    },
  });
}
