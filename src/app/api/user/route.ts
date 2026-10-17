import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

/** GET /api/user — the current (possibly guest) user, snake_case envelope. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  return NextResponse.json(serializeUser(user));
}
