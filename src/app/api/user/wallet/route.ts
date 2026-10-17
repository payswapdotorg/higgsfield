/** GET /api/user/wallet — §1c wallet body (verbatim key set, HF-W5: computed by the shared src/lib/account-bodies.ts). */
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { poolsFor, walletBody } from "@/lib/account-bodies";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  const user = auth.user;

  const pools = await poolsFor(user.id);
  return NextResponse.json(walletBody(user, pools));
}
