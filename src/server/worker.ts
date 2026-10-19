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
 *
 * Task 94 — stuck-job reaper (production incident 2026-10-19, evidence verbatim;
 * re-verified first-hand read-only against the live Neon DB — job ids, timestamps,
 * per-job cost 0.5625×2 = 1.125 credits, and the post-rescue CF 429 terminal state
 * all match): a REAL user ran an AI-Influencer character sheet at 07:11:19 UTC — two
 * jobs, cmvex1cws0001l208g1twe8c5 (influencer_portrait) + cmvex1cy40005l2083l456jep
 * (influencer_fullbody), attempt=1, 1.125 credits burned atomically at creation (§1a).
 * The Vercel serverless invocation that claimed them (status → processing, startedAt
 * 07:11:20) DIED mid-flight (invocation end / platform throttle). claimNext() only ever
 * selects status:"queued", so both rows sat in `processing` for 40+ minutes (the station
 * incident record says "45+"; the rows' post-rescue re-claim is timestamped 07:51:25) —
 * the user's UI spun forever, no retry affordance ever appeared, and the station had to
 * re-queue them by hand (they then failed on an UNRELATED Cloudflare quota 429 — separate
 * incident, NOT addressed here). Root cause: no reaper existed for claimed-but-abandoned
 * jobs — wave 4 hardened adapter crashes and DB contention, but not serverless invocation
 * death. Fix: reapStuckJobs(), called from every tick — a read-only gate over `processing`
 * rows whose startedAt is older than HF_WORKER_STUCK_CUTOFF_MIN (default 15, floor 5;
 * never-fail parse in the Task 86/93 style). attempt < MAX_ATTEMPTS → CAS requeue that
 * CONSUMES an attempt (attempt + 1, mirroring the H2 adapter-retry bookkeeping exactly —
 * a reaper requeue is bookkept identically to an adapter-level retry, so a job that keeps
 * dying with its invocation still terminates at MAX_ATTEMPTS); attempt ≥ MAX_ATTEMPTS →
 * CAS terminal fail with the incident-class error message. Every reaper write is
 * additionally guarded on the EXACT startedAt value read, so a row re-claimed or completed
 * between the read and the write resolves count=0 — logged, skipped, never thrown.
 */
import { db } from "@/lib/db";
import type { Generation, Prisma } from "@prisma/client";
import { mockAdapter } from "./adapters/mock-adapter";
import { influencerAdapter } from "./adapters/influencer-adapter";
import type { AdapterResult, ModelAdapter } from "./adapters/types";

/**
 * HF-W7: adapter selection is per-job — influencer jobSetTypes route to the
 * pluggable influencer provider layer (mock/openrouter/zai image engines,
 * mock/dashscope/zai motion engines, env-gated in server/influencer/index.ts);
 * every other jobSetType keeps the proven mockAdapter. Both adapters implement
 * the same ModelAdapter contract, so the CAS/retry/terminal machinery below is
 * untouched (wave-4/5 laws preserved: no interactive transactions on the hot
 * path, CAS-guarded state writes, [f-worker] logging).
 */
const INFLUENCER_JOB_SET_TYPES = new Set([
  "influencer_portrait",
  "influencer_fullbody",
  "influencer_motion",
]);

function adapterForJob(job: Generation): ModelAdapter {
  return INFLUENCER_JOB_SET_TYPES.has(job.jobSetType) ? influencerAdapter : mockAdapter;
}

const TICK_INTERVAL_MS = 200;
const MAX_BACKOFF_SECONDS = 60;
// H2: ONE automatic retry for retryable causes (maxAttempts = 2 — attempt 1 + attempt 2).
const MAX_ATTEMPTS = 2;

// Task 94 stuck-job reaper (see the header's incident evidence): minutes a job may stay in
// `processing` before the reaper acts. Default 15 sits above every legitimate in-flight
// adapter — the longest is the dashscope wan2.2 10-minute poll timeout — so at the default
// a live run can never be reaped; the 5-minute floor protects legitimately-running wan2.2
// polls from an aggressively-low station override (anything below 5 is dangerous).
const STUCK_CUTOFF_MIN_DEFAULT = 15;
const STUCK_CUTOFF_MIN_FLOOR = 5;
// Stuck rows handled per tick: a pathological backlog drains over successive ticks,
// mirroring the bounded claim loop in tick() (4 claims/tick) instead of one unbounded
// serial write chain inside a single tick.
const REAP_BATCH = 8;

/**
 * HF_WORKER_STUCK_CUTOFF_MIN (default 15, Task 94): minutes a job may stay in `processing`
 * before the stuck-job reaper acts. Never-fail parse in the Task 86/93 house style
 * (parseSubmitTimeoutMs in influencer/dashscope-provider.ts): missing / non-numeric /
 * < 1 → the default (15 is above every legitimate in-flight adapter, incl. the dashscope
 * wan2.2 10-minute poll timeout); values in [1, 5) clamp UP to the 5-minute floor with a
 * warn — anything below 5 could reap a legitimately-running wan2.2 poll.
 */
function parseStuckCutoffMin(): number {
  const raw = process.env.HF_WORKER_STUCK_CUTOFF_MIN;
  if (raw === undefined || raw.trim() === "") return STUCK_CUTOFF_MIN_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 1) return STUCK_CUTOFF_MIN_DEFAULT;
  if (parsed < STUCK_CUTOFF_MIN_FLOOR) {
    console.warn(
      `[f-worker] HF_WORKER_STUCK_CUTOFF_MIN=${raw} is below the ${STUCK_CUTOFF_MIN_FLOOR}min floor — clamping up (Task 94; a lower cutoff could reap a legitimately-running wan2.2 poll)`
    );
    return STUCK_CUTOFF_MIN_FLOOR;
  }
  return parsed;
}

// Parsed ONCE at module level (the Task 93 SUBMIT_TIMEOUT_MS style): side-effect-free at
// the default — the mock/test path (env unset) sees zero logging and zero behavior change.
const STUCK_CUTOFF_MIN = parseStuckCutoffMin();

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
    `[f-worker] started (tick=${TICK_INTERVAL_MS}ms, backoff<=${MAX_BACKOFF_SECONDS}s, maxAttempts=${MAX_ATTEMPTS}, stuckCutoff=${STUCK_CUTOFF_MIN}min — Task 94 reaper armed)`
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
    // Task 94: every tick also reaps claimed-but-abandoned rows (read-gated inside —
    // see reapStuckJobs). A reaper throw counts as a dirty tick: the backoff applies.
    await reapStuckJobs();
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
  data: Prisma.GenerationUpdateManyMutationInput,
  guardStartedAt?: Date
): Promise<boolean> {
  try {
    // Task 94: reaper writes pass guardStartedAt so the update additionally requires the
    // row to still hold the EXACT startedAt value the reaper read — a row re-claimed
    // (fresh startedAt) or completed (status moved) between the read and the write
    // resolves count=0 here and is skipped, never clobbered. The adapter paths (runJob)
    // keep the plain id+status guard (their job argument is the claim owner).
    const res = await db.generation.updateMany({
      where:
        guardStartedAt === undefined
          ? { id, status: "processing" }
          : { id, status: "processing", startedAt: guardStartedAt },
      data,
    });
    return res.count === 1;
  } catch (err) {
    console.error(`[f-worker] state write failed for job ${id}:`, err);
    return false;
  }
}

/**
 * Task 94 stuck-job reaper (see the header's incident evidence): a serverless invocation
 * that died mid-flight after the CAS claim but before any terminal write leaves its row
 * stranded in `processing` — claimNext() only ever selects `queued`, so nothing ever
 * touches it again. This pass reclaims such rows.
 *
 * H1 read-gate preserved: the findMany below is read-only — when no row has been in
 * `processing` longer than STUCK_CUTOFF_MIN (the steady state, incl. every battery run:
 * jobs are claimed and completed in seconds, far under the 15-minute default; and the
 * longest legitimate in-flight adapter is the 10-minute dashscope wan2.2 poll), NO write
 * transaction opens at all. Bookkeeping mirrors runJob's H2 retry branch exactly: a
 * requeue consumes an attempt (attempt + 1) and returns the row to a clean queued state;
 * attempt ≥ MAX_ATTEMPTS → terminal failed with the incident-class error message. Writes
 * are CAS-guarded on id + status:"processing" + the exact startedAt read (casUpdate's
 * guardStartedAt) — a row that moved under us resolves count=0: logged, skipped, never
 * thrown.
 */
async function reapStuckJobs(): Promise<void> {
  const cutoffAgo = new Date(Date.now() - STUCK_CUTOFF_MIN * 60_000);
  const stuck = await db.generation.findMany({
    where: { status: "processing", startedAt: { lt: cutoffAgo } },
    orderBy: { startedAt: "asc" }, // oldest first — the longest-stuck rows reap first
    take: REAP_BATCH,
  });
  if (stuck.length === 0) return; // read-gate: nothing stuck → no write transaction opens
  const now = new Date();
  for (const job of stuck) {
    // findMany matched `startedAt < cutoffAgo`, so startedAt is non-null on every matched
    // row; this guard is for the type system only.
    if (!job.startedAt) continue;
    const ageMin = (now.getTime() - job.startedAt.getTime()) / 60_000;
    if (job.attempt >= MAX_ATTEMPTS) {
      const applied = await casUpdate(
        job.id,
        {
          status: "failed",
          error: `job stuck in processing for >${STUCK_CUTOFF_MIN}min (serverless invocation death — Task 94 reaper)`,
          completedAt: now,
        },
        job.startedAt
      );
      if (applied) {
        console.error(
          `[f-worker] reaper: job ${job.id} stuck ${ageMin.toFixed(1)}min at attempt ${job.attempt}/${MAX_ATTEMPTS} → failed (serverless invocation death — Task 94)`
        );
      } else {
        console.log(`[f-worker] reaper: job ${job.id} moved before the terminal write — skipped (Task 94)`);
      }
    } else {
      // Requeue: attempt + 1 mirrors the H2 adapter-retry bookkeeping EXACTLY — the reaper's
      // requeue consumes an attempt just like an adapter-level retry does (runJob's failure
      // branch re-enqueues with attempt: job.attempt + 1), so a job that keeps dying with
      // its invocation still terminates at MAX_ATTEMPTS. Ledger/spend stay as-is (the cost
      // was already paid at POST time — see the file header's §1a rationale).
      const applied = await casUpdate(
        job.id,
        {
          status: "queued",
          attempt: job.attempt + 1,
          error: null,
          startedAt: null,
          completedAt: null,
        },
        job.startedAt
      );
      if (applied) {
        console.log(
          `[f-worker] reaper: job ${job.id} stuck ${ageMin.toFixed(1)}min at attempt ${job.attempt}/${MAX_ATTEMPTS} → requeued as attempt ${job.attempt + 1} (serverless invocation death — Task 94)`
        );
      } else {
        console.log(`[f-worker] reaper: job ${job.id} moved before the requeue write — skipped (Task 94)`);
      }
    }
  }
}

async function runJob(job: Generation): Promise<void> {
  const adapter = adapterForJob(job);
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
