import type { Contest, Generation, Project, User } from "@prisma/client";
import { GUEST_EMAIL } from "@/lib/session";

/**
 * snake_case API serializers — these mirror the captured evidence EXACTLY.
 * The frontend and the bun test-suite depend on these field names.
 */

export interface SerializedUser {
  id: string;
  email: string;
  username: string | null;
  image: string | null;
  credits: number;
  plan_tier: string;
  is_guest: boolean;
  onboarding_completed: boolean;
  created_at: string;
}

export function serializeUser(user: User): SerializedUser {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    image: user.image,
    credits: user.credits,
    plan_tier: user.planTier,
    is_guest: user.email === GUEST_EMAIL,
    onboarding_completed: Boolean(user.onboardedAt),
    created_at: user.createdAt.toISOString(),
  };
}

export interface SerializedFolder {
  id: string;
  name: string;
  access_mode: string;
  surface: string;
  workspace_id: string | null;
  pinned_at: string | null;
  created_at: string;
  recent_jobs_count: number;
}

export function serializeFolder(
  project: Project,
  recentJobsCount = 0,
): SerializedFolder {
  return {
    id: project.id,
    name: project.name,
    access_mode: project.accessMode,
    surface: project.surface,
    workspace_id: project.workspaceId,
    pinned_at: project.pinnedAt ? project.pinnedAt.toISOString() : null,
    created_at: project.createdAt.toISOString(),
    recent_jobs_count: recentJobsCount,
  };
}

export interface SerializedContest {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: string;
  preview_image: string | null;
  preview_video: string | null;
}

export function serializeContest(contest: Contest): SerializedContest {
  return {
    id: contest.id,
    slug: contest.slug,
    title: contest.title,
    description: contest.description,
    start_at: contest.startAt.toISOString(),
    end_at: contest.endAt.toISOString(),
    status: contest.status,
    preview_image: contest.previewImage,
    preview_video: contest.previewVideo,
  };
}

export interface SerializedGeneration {
  id: string;
  project_id: string;
  mode: string;
  prompt: string;
  model: string;
  resolution: string;
  aspect_ratio: string;
  duration_seconds: number | null;
  motion: boolean;
  steps: number;
  status: string;
  credit_cost: number;
  result_url: string | null;
  error: string | null;
  created_at: string;
}

export function serializeGeneration(
  generation: Generation,
): SerializedGeneration {
  return {
    id: generation.id,
    project_id: generation.projectId,
    mode: generation.mode,
    prompt: generation.prompt,
    model: generation.model,
    resolution: generation.resolution,
    aspect_ratio: generation.aspectRatio,
    duration_seconds: generation.durationSeconds,
    motion: generation.motion,
    steps: generation.steps,
    status: generation.status,
    credit_cost: generation.creditCost,
    result_url: generation.resultUrl,
    error: generation.error,
    created_at: generation.createdAt.toISOString(),
  };
}
