import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { userToJson } from "@/lib/user-shape";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const auth = await requireUser(req);
  if ("response" in auth) return auth.response;
  return NextResponse.json({ user: userToJson(auth.user) });
}
