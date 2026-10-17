/** GET /api/notices?lang=en — §1e notices body (verbatim structure from the digest). */
import { NextRequest, NextResponse } from "next/server";
import { JOB_SET_NOTICES } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // lang is accepted for shape parity; only `en` content exists.
  return NextResponse.json({
    header_notices: [],
    job_set_notices: JOB_SET_NOTICES,
  });
}
