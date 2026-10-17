/** GET /api/community/discovery/header — community discovery header (clone-defined shape). */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    title: "Community",
    subtitle: "Explore generations from HF Studio creators",
    tabs: ["generations", "contests", "creators", "originals", "projects"],
  });
}
