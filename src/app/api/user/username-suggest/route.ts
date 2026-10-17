import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { suggestUsername } from "@/lib/username";

/** GET /api/user/username-suggest — deterministic suggestion for the email. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);

  return NextResponse.json({
    suggested_username: suggestUsername(user.email),
  });
}
