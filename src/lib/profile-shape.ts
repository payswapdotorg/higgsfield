/**
 * HF-W5 — the /fnf/user/profile body, verbatim key set.
 *
 * Evidence: evidence/rea-2026-10-17/api-bodies-digest.json → `profile`
 * (cross-checked against net-capture-with-auth-headers.jsonl: GET /fnf/user/profile
 * is 200 read-only — every captured row has reqBody null, so the clone ships NO
 * mutation endpoint for this surface; the settings UI renders it read-only with a
 * visible disclosure).
 *
 * Captured body (operator account):
 *   {"username":"radiatingcapybara1609","avatar_url":"…cloudfront…webp",
 *    "background_image_url":null,"bio":null,"headline":null,
 *    "instagram_handle":null,"twitter_handle":null,"youtube_handle":null,
 *    "tiktok_handle":null,"discord_handle":null,"linkedin_handle":null,
 *    "show_full_name":false,"full_name":"yaslen Catty","location":null,
 *    "badge":null,"badges":[],"total_projects_views":0,
 *    "total_projects_likes":0,"created_at":…,"account_created_at":…,"updated_at":…}
 *
 * Clone-side mappings (disclosed in docs/wave-5-worker-worklog.md):
 *   - the live product keeps the profile record separate from the account; this
 *     clone stores the profile fields on the User row, so `created_at` (profile
 *     record created) and `account_created_at` (account created) both map onto
 *     user.createdAt, and `updated_at` maps onto user.updatedAt.
 *   - `badges` is a JSON string column on SQLite (no list primitives); it parses
 *     to `unknown[]` — no badge object was ever captured (the captured array is
 *     empty), so nothing is invented: the type stays opaque.
 */
import type { User } from "@prisma/client";

/** Verbatim /fnf/user/profile body shape (snake_case). */
export interface ProfileJson {
  username: string;
  avatar_url: string | null;
  background_image_url: string | null;
  bio: string | null;
  headline: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  youtube_handle: string | null;
  tiktok_handle: string | null;
  discord_handle: string | null;
  linkedin_handle: string | null;
  show_full_name: boolean;
  full_name: string | null;
  location: string | null;
  badge: string | null;
  badges: unknown[];
  total_projects_views: number;
  total_projects_likes: number;
  created_at: string;
  account_created_at: string;
  updated_at: string;
}

/** Parse the badges JSON column defensively (bad data → empty array, never a throw). */
function parseBadges(raw: string): unknown[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function profileToJson(user: User): ProfileJson {
  return {
    username: user.username,
    avatar_url: user.avatarUrl,
    background_image_url: user.backgroundImageUrl,
    bio: user.bio,
    headline: user.headline,
    instagram_handle: user.instagramHandle,
    twitter_handle: user.twitterHandle,
    youtube_handle: user.youtubeHandle,
    tiktok_handle: user.tiktokHandle,
    discord_handle: user.discordHandle,
    linkedin_handle: user.linkedinHandle,
    show_full_name: user.showFullName,
    full_name: user.fullName,
    location: user.location,
    badge: user.badge,
    badges: parseBadges(user.badges),
    total_projects_views: user.totalProjectsViews,
    total_projects_likes: user.totalProjectsLikes,
    // Disclosed mapping: profile record == user row in this clone.
    created_at: user.createdAt.toISOString(),
    account_created_at: user.createdAt.toISOString(),
    updated_at: user.updatedAt.toISOString(),
  };
}
