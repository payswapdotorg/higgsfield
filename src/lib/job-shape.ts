/**
 * Generation (job) → JSON mapper. API payloads use snake_case to mirror the §1 evidence bodies.
 */
import type { Generation } from "@prisma/client";
import type { NoticeBadge } from "@/lib/catalog";

export interface CreditSpendEntry {
  pool: string;
  amount: number;
}

export interface JobJson {
  id: string;
  user_id: string;
  folder_id: string | null;
  model_version: string;
  model_label: string;
  job_set_type: string;
  kind: "image" | "video";
  prompt: string;
  aspect_ratio: string;
  resolution: string;
  width: number;
  height: number;
  batch_size: number;
  input_images: string[];
  workspace_id: string | null;
  status: "queued" | "processing" | "done" | "failed";
  seed: number;
  cost: number;
  credits_spent: CreditSpendEntry[];
  asset_url: string | null;
  error: string | null;
  notices: NoticeBadge[];
  published_at: string | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function jobToJson(g: Generation, modelLabel?: string): JobJson {
  return {
    id: g.id,
    user_id: g.userId,
    folder_id: g.folderId,
    model_version: g.modelVersion,
    model_label: modelLabel ?? g.modelVersion,
    job_set_type: g.jobSetType,
    kind: g.kind as "image" | "video",
    prompt: g.prompt,
    aspect_ratio: g.aspectRatio,
    resolution: g.resolution,
    width: g.width,
    height: g.height,
    batch_size: g.batchSize,
    input_images: safeParseArray(g.inputImages),
    workspace_id: g.workspaceId,
    status: g.status as JobJson["status"],
    seed: g.seed,
    cost: g.cost,
    credits_spent: safeParseSpend(g.creditSpend),
    asset_url: g.assetUrl,
    error: g.error,
    notices: safeParseNotices(g.notices),
    published_at: g.publishedAt?.toISOString() ?? null,
    deleted_at: g.deletedAt?.toISOString() ?? null,
    created_at: g.createdAt?.toISOString() ?? null,
    updated_at: g.updatedAt?.toISOString() ?? null,
  };
}

function safeParseArray(s: string): string[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeParseSpend(s: string): CreditSpendEntry[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

function safeParseNotices(s: string): NoticeBadge[] {
  try {
    const v = JSON.parse(s || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
