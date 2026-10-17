/**
 * Shared snake_case response shapes for the PUBLIC community APIs.
 * Contract verified live (worklog "API CONTRACT" section) — build against these only.
 */

export interface CommunityGeneration {
  id: string;
  prompt: string;
  model_version: string;
  model_label: string;
  job_set_type: string;
  kind: "image" | "video";
  aspect_ratio: string;
  width: number;
  height: number;
}

/** Feed publication item — GET /api/community/generations/feed */
export interface FeedItem {
  id: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  published_at: string;
  author_username: string;
  author_avatar: string | null;
  generation: CommunityGeneration;
}

export interface FeedResponse {
  items: FeedItem[];
  has_more: boolean;
}

/** Contest item — GET /api/community/contests (§1e field names verbatim) */
export interface ContestItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: string;
  preview_image: string;
  preview_video: string | null;
  logo_url: string | null;
  redirect_url: string | null;
}

/** Creator item — GET /api/community/discovery/creators */
export interface CreatorItem {
  username: string;
  display_name: string;
  avatar_url: string | null;
  publications: number;
  total_views: number;
  total_likes: number;
}

/** Header — GET /api/community/discovery/header */
export interface CommunityHeader {
  title: string;
  subtitle: string;
  tabs: string[];
}

/** Valid ?tab= values (mirrors the /(public)/community/_tabs/* route family). */
export type CommunityTab = "generations" | "contests" | "creators" | "originals" | "projects";
