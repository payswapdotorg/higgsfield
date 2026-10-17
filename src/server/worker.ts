/**
 * In-process job worker (HF-W2 §3.2).
 *
 * Dequeues `queued` jobs → `processing` → runs the pluggable ModelAdapter (mock) → `done`/`failed`.
 * A single interval loop per server process (guarded on globalThis — survives dev HMR reloads).
 *
 * Wave-4 H1 (clone-side hardening, not product evidence): consecutive tick errors now back off
 * exponentially — min(2^n, 60) seconds, reset on the first clean tick — instead of hot-looping
 * error ticks every 200 ms. Station-log evidence for the change: under concurrent access the
 * pre-fix loop hot-looped P1008 "Socket timeout" tick errors (1073 consecutive entries in one
 * wedged run; battery degraded 20/20 → 0/22), each failed attempt re-contending for the SQLite
 * write lock and amplifying the wedge. The other half of the fix is the WAL/busy_timeout pragma
 * setup in src/lib/db.ts. The backoff delays only *when* the next tick is attempted — it never
 * changes job outcomes (determinism law).
 */
import { db } from "@/lib/db";
import type { Generation } from "@prisma/client";
import { mockAdapter } from "./adapters/mock-adapter";
import type { ModelAdapter } from "./adapters/types";

const ADAPTERS: Record<string, ModelAdapter> = {
  mock: mockAdapter,
};
const DEFAULT_ADAPTER = "mock";

const TICK_INTERVAL_MS = 200;
const MAX_BACKOFF_SECONDS = 60;

const globalForWorker = globalThis as unknown as {
  __hfWorkerStarted?: boolean;
  // Backoff state lives on globalThis so a dev-HMR replacement timer shares it with the old one.
  __hfWorkerBackoff?: { consecutiveErrors: number; nextTickAt: number };
};

function backoffState(): { consecutiveErrors: number; nextTickAt: number } {
  if (!globalForWorker.__hfWorkerBackoff) {
    globalForWorker.__hfWorkerBackoff = { consecutiveErrors: 0, nextTickAt: 0 };
  }
  return globalForWorker.__hfWorkerBackoff;
}

/** Exponential tick backoff: 2, 4, 8, 16, 32, 64 … seconds, capped at 60 s. */
function backoffSecondsFor(consecutiveErrors: number): number {
  return Math.min(2 ** Math.max(1, consecutiveErrors), MAX_BACKOFF_SECONDS);
}

export function ensureWorker(): void {
  if (globalForWorker.__hfWorkerStarted) return;
  globalForWorker.__hfWorkerStarted = true;
  const timer = setInterval(() => {
    void tick();
  }, TICK_INTERVAL_MS);
  // Never keep the process alive just for the worker loop.
  (timer as { unref?: () => void }).unref?.();
}

async function claimNext(): Promise<Generation | null> {
  // Read gate: when the queue is empty the tick must not open a write transaction (nor take
  // the SQLite write lock) at all — wave-4 H1: the previous shape (an interactive transaction
  // every 200 ms) contended for the write lock even while idle, feeding the P1008 storms.
  const candidate = await db.generation.findFirst({
    where: { status: "queued" },
    orderBy: { createdAt: "asc" },
  });
  if (!candidate) return null;
  // CAS claim: a single guarded UPDATE — exactly one contender can flip queued → processing,
  // so no interactive transaction is needed on the hot path (the write lock is held for one
  // statement, not a transaction span).
  const res = await db.generation.updateMany({
    where: { id: candidate.id, status: "queued" },
    data: { status: "processing", startedAt: new Date() },
  });
  return res.count === 1 ? candidate : null;
}

async function tick(): Promise<void> {
  const backoff = backoffState();
  if (Date.now() < backoff.nextTickAt) return; // cooling down after consecutive errors
  try {
    for (let i = 0; i < 4; i++) {
      const job = await claimNext();
      if (!job) break;
      void runJob(job);
    }
    backoff.consecutiveErrors = 0; // clean tick resets the backoff
  } catch (err) {
    backoff.consecutiveErrors += 1;
    const seconds = backoffSecondsFor(backoff.consecutiveErrors);
    backoff.nextTickAt = Date.now() + seconds * 1000;
    console.error(`[f-worker] tick error #${backoff.consecutiveErrors} — backing off ${seconds}s:`, err);
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
