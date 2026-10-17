"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type { GenerationMode } from "@/lib/pricing";
import { useComposer } from "@/store/composer";

/* ------------------------------------------------------------------ */
/* Fetch helper                                                        */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Tiny JSON fetch helper. Throws an `ApiError` carrying the server's
 * snake_case `error` message when the response is not ok.
 */
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body && typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {
      // Non-JSON error body — keep the generic status message.
    }
    throw new ApiError(message, res.status);
  }

  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Contract types (snake_case, mirrors the backend API)                */
/* ------------------------------------------------------------------ */

export interface User {
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

export interface PersonalPromo {
  promo_code: string;
  discount_percent: number;
  expired_at: string;
  is_claimed: boolean;
}

export interface UserMeta {
  user_id: string;
  username: string | null;
  email: string;
  credits: number;
  plan_tier: string;
  onboarding_completed: boolean;
  personal_promo: PersonalPromo | null;
}

export interface PersonalPromoDetail {
  id: string;
  expired_at: string;
  promo_code: string;
  is_claimed: boolean;
  type: string;
  is_viewed: boolean;
}

export interface FreeGens {
  free_gens_remaining: number;
}

export type FolderAccessMode = "private" | "public";

export interface Folder {
  id: string;
  name: string;
  access_mode: FolderAccessMode;
  surface: string;
  workspace_id: string | null;
  pinned_at: string | null;
  created_at: string;
  recent_jobs_count: number;
}

export interface FolderListResponse {
  items: Folder[];
  has_more: boolean;
}

export type ContestStatus = "open" | "upcoming" | "closed" | string;

export interface Contest {
  id: string;
  slug: string;
  title: string;
  description: string;
  start_at: string;
  end_at: string;
  status: ContestStatus;
  preview_image: string | null;
  preview_video: string | null;
}

export interface ContestListResponse {
  items: Contest[];
  has_more?: boolean;
}

export interface UsernameSuggestResponse {
  suggested_username: string;
}

export interface GenerationResponse {
  id: string;
  status: string;
  credit_cost: number;
  [key: string]: unknown;
}

export interface CreateGenerationInput {
  project_id: string | null;
  mode: GenerationMode;
  prompt: string;
  model: string;
  resolution: string;
  aspect_ratio: string;
  duration_seconds: number;
  motion: boolean;
  steps: number;
}

export interface OnboardingAnswers {
  goal: string[];
  skill: string;
  interests: string[];
  discovery: string;
  blockers: string[];
}

/* ------------------------------------------------------------------ */
/* Query keys                                                          */
/* ------------------------------------------------------------------ */

export const queryKeys = {
  user: ["user"] as const,
  userMeta: ["user-meta"] as const,
  personalPromo: ["personal-promo"] as const,
  freeGens: ["free-gens"] as const,
  folders: ["folders"] as const,
  pinnedFolders: ["pinned-folders"] as const,
  contests: ["contests"] as const,
  usernameSuggest: ["username-suggest"] as const,
};

/* ------------------------------------------------------------------ */
/* Queries                                                             */
/* ------------------------------------------------------------------ */

export function useUser(options?: Omit<UseQueryOptions<User, ApiError>, "queryKey" | "queryFn">) {
  return useQuery<User, ApiError>({
    queryKey: queryKeys.user,
    queryFn: () => api<User>("/api/user"),
    ...options,
  });
}

export function useUserMeta() {
  return useQuery<UserMeta, ApiError>({
    queryKey: queryKeys.userMeta,
    queryFn: () => api<UserMeta>("/api/user/meta"),
  });
}

export function usePersonalPromo() {
  return useQuery<PersonalPromoDetail | null, ApiError>({
    queryKey: queryKeys.personalPromo,
    queryFn: () => api<PersonalPromoDetail | null>("/api/user/personal-promo"),
  });
}

export function useFreeGens() {
  return useQuery<FreeGens, ApiError>({
    queryKey: queryKeys.freeGens,
    queryFn: () => api<FreeGens>("/api/user/free-gens/v2"),
  });
}

export function useFolders() {
  return useQuery<FolderListResponse, ApiError>({
    queryKey: queryKeys.folders,
    queryFn: () =>
      api<FolderListResponse>(
        "/api/folders/accessible?surface=cinematic_studio&size=100",
      ),
  });
}

export function usePinnedFolders() {
  return useQuery<FolderListResponse, ApiError>({
    queryKey: queryKeys.pinnedFolders,
    queryFn: () =>
      api<FolderListResponse>("/api/folders/pinned?recent_jobs_count=true"),
  });
}

export function useContests() {
  return useQuery<ContestListResponse, ApiError>({
    queryKey: queryKeys.contests,
    queryFn: () => api<ContestListResponse>("/api/contests?size=50"),
  });
}

export function useUsernameSuggest(
  options?: Omit<
    UseQueryOptions<UsernameSuggestResponse, ApiError>,
    "queryKey" | "queryFn"
  >,
) {
  return useQuery<UsernameSuggestResponse, ApiError>({
    queryKey: queryKeys.usernameSuggest,
    queryFn: () => api<UsernameSuggestResponse>("/api/user/username-suggest"),
    ...options,
  });
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

const optimisticFolder = (name: string): Folder => ({
  id: "optimistic-folder",
  name,
  access_mode: "private",
  surface: "cinematic_studio",
  workspace_id: null,
  pinned_at: null,
  created_at: "",
  recent_jobs_count: 0,
});

export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation<
    Folder,
    ApiError,
    { name: string; access_mode?: FolderAccessMode },
    { previous: FolderListResponse | undefined }
  >({
    mutationFn: ({ name, access_mode = "private" }) =>
      api<Folder>("/api/folders", {
        method: "POST",
        body: JSON.stringify({
          name,
          access_mode,
          surface: "cinematic_studio",
          workspace_id: null,
        }),
      }),
    onMutate: async ({ name }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.folders });
      const previous =
        queryClient.getQueryData<FolderListResponse>(queryKeys.folders);

      if (previous) {
        queryClient.setQueryData<FolderListResponse>(queryKeys.folders, {
          ...previous,
          items: [...previous.items, optimisticFolder(name)],
        });
      }

      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.folders, context.previous);
      }
      toast.error(error.message);
    },
    onSuccess: async (folder) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.folders });
      await queryClient.invalidateQueries({ queryKey: queryKeys.pinnedFolders });
      toast.success("Project created");
      // Select the freshly created project in the composer.
      useComposer.getState().setProjectId(folder.id);
    },
  });
}

export function useCreateGeneration() {
  const queryClient = useQueryClient();

  return useMutation<GenerationResponse, ApiError, CreateGenerationInput>({
    mutationFn: (input) =>
      api<GenerationResponse>("/api/generations", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      toast.success("Generation queued — the render pipeline lands in Wave 2");
      void queryClient.invalidateQueries({ queryKey: queryKeys.user });
      void queryClient.invalidateQueries({ queryKey: queryKeys.freeGens });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useClaimUsername() {
  const queryClient = useQueryClient();

  return useMutation<User, ApiError, { username: string }>({
    mutationFn: ({ username }) =>
      api<User>("/api/user/username", {
        method: "POST",
        body: JSON.stringify({ username }),
      }),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        toast.error("That username is already taken");
        return;
      }
      toast.error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userMeta });
      await queryClient.invalidateQueries({
        queryKey: queryKeys.usernameSuggest,
      });
    },
  });
}

export function useSaveOnboarding() {
  const queryClient = useQueryClient();

  return useMutation<{ saved: boolean }, ApiError, { answers: OnboardingAnswers }>({
    mutationFn: ({ answers }) =>
      api<{ saved: boolean }>("/api/user/onboarding", {
        method: "POST",
        body: JSON.stringify({ answers }),
      }),
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.user });
      await queryClient.invalidateQueries({ queryKey: queryKeys.userMeta });
    },
  });
}
