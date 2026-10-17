/**
 * GET /api/user — §1c user body (verbatim key set, values mapped from the wave-2
 * CreditPool model). Per-model bonus pools map to the evidence's fixed keys.
 *
 * HF-W5: the body is computed by the shared src/lib/account-bodies.ts (single
 * source of truth with the /me/settings pages) and now carries the captured
 * subscription-state keys (billing_period, is_cancel_inited, plan_ends_at, cohort,
 * promo_state, has_unlim, auto_publish, lang, is_gift_subscription, pause fields,
 * workspace fields — evidence: api-bodies-digest.json → `user`, free-plan values
 * verbatim). The placeholder `billing: {}` key from wave 2 is gone — no frontend
 * consumer referenced it (verified by grep at wave-5 time).
 */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { poolsFor, userBody } from "@/lib/account-bodies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const pools = await poolsFor(user.id);
  return NextResponse.json(userBody(user, pools));
}
