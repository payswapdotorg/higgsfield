/** GET /api/user/features — §1c features flags (verbatim). */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    generate_persisted_cache: false,
    has_nb_bonus_seedream_free_gens: false,
    has_seedream_batch_gens: false,
  });
}
