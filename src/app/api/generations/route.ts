import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { parseBody } from "@/lib/api";
import { getCurrentUser } from "@/lib/session";
import { serializeGeneration } from "@/lib/serialize";
import {
  DEFAULT_VIDEO_CONFIG,
  computeCreditCost,
} from "@/lib/pricing";

const createGenerationSchema = z.object({
  project_id: z.string().min(1, "project_id is required"),
  mode: z.enum(["image", "video"]),
  prompt: z.string().min(1, "prompt is required"),
  model: z.string().default(DEFAULT_VIDEO_CONFIG.modelId),
  resolution: z.string().default(DEFAULT_VIDEO_CONFIG.resolution),
  aspect_ratio: z.string().default(DEFAULT_VIDEO_CONFIG.aspectRatio),
  duration_seconds: z.number().int().positive().optional(),
  motion: z.boolean().default(true),
  steps: z.number().int().positive().default(1),
});

/**
 * POST /api/generations — enqueue a generation job.
 * credit_cost is computed SERVER-SIDE from the shared pricing contract.
 * Wave 1 does NOT deduct credits (wave 2 adds atomic spend).
 */
export async function POST(req: NextRequest) {
  await getCurrentUser(req);

  const body = await parseBody(req, createGenerationSchema);
  if (!body.ok) return body.res;
  const input = body.data;

  const project = await db.project.findUnique({
    where: { id: input.project_id },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const durationSeconds =
    input.duration_seconds ?? DEFAULT_VIDEO_CONFIG.durationSeconds;

  const creditCost = computeCreditCost({
    mode: input.mode,
    modelId: input.model,
    resolution: input.resolution,
    durationSeconds,
    motion: input.motion,
    steps: input.steps,
  });

  const generation = await db.generation.create({
    data: {
      projectId: project.id,
      mode: input.mode,
      prompt: input.prompt,
      model: input.model,
      resolution: input.resolution,
      aspectRatio: input.aspect_ratio,
      durationSeconds: input.mode === "video" ? durationSeconds : null,
      motion: input.motion,
      steps: input.steps,
      status: "queued",
      creditCost,
    },
  });

  return NextResponse.json(serializeGeneration(generation), { status: 201 });
}
