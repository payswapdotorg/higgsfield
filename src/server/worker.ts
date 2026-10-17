/**
 * In-process job worker (HF-W2 §3.2).
 *
 * Dequeues `queued` jobs → `processing` → runs the pluggable ModelAdapter (mock) → `done`/`failed`.
 * A single interval loop per server process (guarded on globalThis — survives dev HMR reloads).
 */
import { db } from "@/lib/db";
import type { Generation } from "@prisma/client";
import { mockAdapter } from "./adapters/mock-adapter";
import type { ModelAdapter } from "./adapters/types";

const ADAPTERS: Record<string, ModelAdapter> = {
  mock: mockAdapter,
};
const DEFAULT_ADAPTER = "mock";

const globalForWorker = globalThis as unknown as {
  __hfWorkerStarted?: boolean;
};

export function ensureWorker(): void {
  if (globalForWorker.__hfWorkerStarted) return;
  globalForWorker.__hfWorkerStarted = true;
  const timer = setInterval(() => {
    void tick();
  }, 200);
  // Never keep the process alive just for the worker loop.
  (timer as { unref?: () => void }).unref?.();
}

async function claimNext(): Promise<Generation | null> {
  return db.$transaction(async (tx) => {
    const job = await tx.generation.findFirst({
      where: { status: "queued" },
      orderBy: { createdAt: "asc" },
    });
    if (!job) return null;
    const res = await tx.generation.updateMany({
      where: { id: job.id, status: "queued" },
      data: { status: "processing", startedAt: new Date() },
    });
    return res.count === 1 ? job : null;
  });
}

async function tick(): Promise<void> {
  try {
    for (let i = 0; i < 4; i++) {
      const job = await claimNext();
      if (!job) return;
      void runJob(job);
    }
  } catch (err) {
    console.error("[hf-worker] tick error:", err);
  }
}

async function runJob(job: Generation): Promise<void> {
  const adapter = ADAPTERS[DEFAULT_ADAPTER];
  try {
    const result = await adapter.run(job);
    if (result.ok) {
      await db.generation.update({
        where: { id: job.id },
        data: {
          status: "done",
          assetUrl: result.assetUrl,
          assetKind: result.assetKind,
          error: null,
          completedAt: new Date(),
        },
      });
    } else {
      await db.generation.update({
        where: { id: job.id },
        data: { status: "failed", error: result.error, completedAt: new Date() },
      });
    }
  } catch (err) {
    console.error("[hf-worker] adapter crashed:", err);
    await db.generation
      .update({
        where: { id: job.id },
        data: { status: "failed", error: "adapter crashed", completedAt: new Date() },
      })
      .catch(() => undefined);
  }
}
