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
 *
 * Wave-4 H2 — job retries (server-side mirror of the client's §1d/§1a one-transparent-retry
 * pattern): a RETRYABLE adapter failure with attempts left re-enqueues the job ONCE
 * (maxAttempts = 2, `attempt` 1→2, status back to `queued`); attempt ≥ maxAttempts or a
 * non-retryable cause → terminal `failed`. All terminal/retry state writes are CAS-guarded on
 * the claim state (`processing`, casUpdate below) — a purged job resolves count=0 with no
 * exception and no follow-up write. The credit spend / ledger rows are NOT re-executed
 * and NOT refunded on retry — the cost was already paid atomically at POST time (§1a), so the
 * retried attempt re-uses the paid slot (disclosed clone-side choice: a refund-and-recharge
 * loop would let a permanently failing model mint free churn; the live product's billing
 * behavior on retries was not captured). Insufficient-credit failures never reach the queue
 * at all (the POST returns a terminal 402 before job creation), so they are terminal by design.
 */
import { db } from "@/lib/db";
import type { Generation, Prisma } from "@prisma/client";
import { mockAdapter } from "./adapters/mock-adapter";
import type { AdapterResult, ModelAdapter } from "./adapters/types";

const ADAPTERS: Record<string, ModelAdapter> = {
  mock: mockAdapter,
};
const DEFAULT_ADAPTER = "mock";

const TICK_INTERVAL_MS = 200;
const MAX_BACKOFF_SECONDS = 60;
// H2: ONE automatic retry for retryable causes (maxAttempts = 2 — attempt 1 + attempt 2).
const MAX_ATTEMPTS = 2;

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
  // Lifecycle log (H4): every f-worker line shares the "[f-worker]" prefix — errors via
  // console.error, lifecycle transitions via console.log — so `grep "\[f-worker\]"` is the
  // single station-side surface for worker health.
  console.log(
    `[f-worker] started (tick=${TICK_INTERVAL_MS}ms, backoff<=${MAX_BACKOFF_SECONDS}s, maxAttempts=${MAX_ATTEMPTS})`
  );
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

/**
 * CAS state write (H1 philosophy, applied to the terminal/retry paths): the write only lands
 * while the row still holds the claim state `processing`. A job purged mid-flight (the test
 * battery's cleanup deletes users while an adapter delay is in flight — the station-log P2025
 * pattern) resolves count=0: logged, no exception, and NO futile follow-up write queuing on the
 * SQLite write lock. The old shape (unguarded `update` → P2025 → catch → second doomed `update`)
 * is one of the documented wedge amplifiers.
 */
async function casUpdate(
  id: string,
  data: Prisma.GenerationUpdateManyMutationInput
): Promise<boolean> {
  try {
    const res = await db.generation.updateMany({ where: { id, status: "processing" }, data });
    return res.count === 1;
  } catch (err) {
    console.error(`[f-worker] state write failed for job ${id}:`, err);
    return false;
  }
}

async function runJob(job: Generation): Promise<void> {
  const adapter = ADAPTERS[DEFAULT_ADAPTER];
  let result: AdapterResult;
  try {
    result = await adapter.run(job);
  } catch (err) {
    console.error("[f-worker] adapter crashed:", err);
    const applied = await casUpdate(job.id, {
      status: "failed",
      error: "adapter crashed",
      completedAt: new Date(),
    });
    if (!applied) console.log(`[f-worker] job ${job.id} vanished mid-flight — crash state not written`);
    return;
  }

  if (result.ok) {
    const applied = await casUpdate(job.id, {
      status: "done",
      assetUrl: result.assetUrl,
      assetKind: result.assetKind,
      error: null,
      completedAt: new Date(),
    });
    if (!applied) console.log(`[f-worker] job ${job.id} vanished mid-flight — done state not written`);
    return;
  }

  if (result.retryable && job.attempt < MAX_ATTEMPTS) {
    // H2 retry path: re-enqueue once. Ledger/spend stay as-is (the cost was already paid at
    // POST time — see the file header for the disclosed rationale). Clearing error/timestamps
    // returns the row to a clean `queued` state for the next claim.
    const applied = await casUpdate(job.id, {
      status: "queued",
      attempt: job.attempt + 1,
      error: null,
      startedAt: null,
      completedAt: null,
    });
    if (applied) {
      console.log(
        `[f-worker] job ${job.id} attempt ${job.attempt}/${MAX_ATTEMPTS} failed retryably — re-enqueued: ${result.error}`
      );
    } else {
      console.log(`[f-worker] job ${job.id} vanished mid-flight — retry not written`);
    }
    return;
  }

  // Terminal failure: attempt ≥ maxAttempts, or a non-retryable cause (billing/content class).
  const applied = await casUpdate(job.id, {
    status: "failed",
    error: result.error,
    completedAt: new Date(),
  });
  if (!applied) console.log(`[f-worker] job ${job.id} vanished mid-flight — failed state not written`);
}
