/**
 * HF-W3C contest body mapper — maps a Prisma Contest row to the live
 * contests-body item shape.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → contests items
 * (per-item keys: id, slug, title, description, start_at, end_at, status,
 * preview_image, preview_video, logo_url, redirect_url, prize_pool,
 * submissions_count, winner, some_contestants, judges, is_trending — field
 * names verbatim). winner / some_contestants / judges are stored as JSON
 * strings on the model (SQLite has no list columns) and parsed here.
 */

import type { Contest } from "@prisma/client";
import type {
  ContestContestant,
  ContestJudge,
  ContestWinner,
} from "@/components/community/types";

function parseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export interface ContestBody {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: string;
  preview_image: string | null;
  preview_video: string | null;
  logo_url: string | null;
  redirect_url: string | null;
  prize_pool: number | null;
  submissions_count: number;
  winner: ContestWinner | null;
  some_contestants: ContestContestant[];
  judges: ContestJudge[];
  is_trending: boolean;
}

export function mapContestBody(c: Contest): ContestBody {
  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    description: c.description,
    start_at: c.startAt.toISOString(),
    end_at: c.endAt.toISOString(),
    status: c.status,
    preview_image: c.previewImage,
    preview_video: c.previewVideo,
    logo_url: c.logoUrl,
    redirect_url: c.redirectUrl,
    prize_pool: c.prizePool,
    submissions_count: c.submissionsCount,
    winner: parseJson<ContestWinner | null>(c.winner, null),
    some_contestants: parseJson<ContestContestant[]>(c.someContestants, []),
    judges: parseJson<ContestJudge[]>(c.judges, []),
    is_trending: c.isTrending,
  };
}
