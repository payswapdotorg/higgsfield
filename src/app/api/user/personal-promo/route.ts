import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { stableHex32 } from "@/lib/username";

const PROMO_EXPIRED_AT = "2027-03-01T00:00:00Z";

/** GET /api/user/personal-promo — captured first-purchase promo shape. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  return NextResponse.json({
    id: stableHex32(user.id),
    expired_at: PROMO_EXPIRED_AT,
    promo_code: `${user.username ?? "guest"}_PERSONAL_PROMO`,
    is_claimed: false,
    type: "first_purchase",
    is_viewed: false,
  });
}
