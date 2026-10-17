/**
 * In-memory fixed-window rate limiter for job-creation POSTs (wave-4 H3 — CLONE-SIDE
 * hardening, not product evidence: the live product fronts this class of protection with
 * DataDome, which is explicitly out of scope per docs/HF-PROGRAM/HF-START-HERE.md).
 *
 * Shape:
 * - Fixed 60 s window per user id; every authenticated POST to /api/jobs/{model} counts,
 *   regardless of the request's eventual outcome (200/400/402/404) — a rate limiter counts
 *   attempts, not successes. Unauthenticated requests never reach the check (401 first).
 * - Over the limit → 429 with a `Retry-After` header (seconds until the window closes) and
 *   the §1a "challenge" body, so the EXISTING client (src/lib/api-client.ts) handles it with
 *   its one-retry + toast path — no client change required.
 * - Config: JOBS_RATE_LIMIT_PER_MIN (default 30; 0 disables the limiter entirely — the
 *   disclosed test/ops escape hatch).
 *
 * Determinism/testing notes:
 * - State lives on globalThis (survives dev HMR module swaps; one map per server process).
 * - Keys are user ids, so unique-per-test users cannot leak state between tests; deleted
 *   users' entries become dead keys (opportunistically swept once the map grows past
 *   MAX_TRACKED_KEYS — no timers, no background eviction).
 * - __resetJobsRateLimiterForTests() wipes the map for in-process unit use (tests talk HTTP
 *   to the live server, so the server-side map is otherwise unreachable from the test
 *   process — per-user keying is the isolation mechanism that actually matters here).
 */

const WINDOW_MS = 60_000;
const DEFAULT_PER_MIN = 30;
const MAX_TRACKED_KEYS = 10_000;

interface WindowEntry {
  windowStart: number;
  count: number;
}

const globalForRateLimit = globalThis as unknown as {
  __hfJobsRateLimitMap?: Map<string, WindowEntry>;
};

function limiterMap(): Map<string, WindowEntry> {
  if (!globalForRateLimit.__hfJobsRateLimitMap) {
    globalForRateLimit.__hfJobsRateLimitMap = new Map();
  }
  return globalForRateLimit.__hfJobsRateLimitMap;
}

/** Configured per-minute limit (JOBS_RATE_LIMIT_PER_MIN; default 30; 0 = disabled). */
export function jobsRateLimitPerMinute(): number {
  const parsed = Number(process.env.JOBS_RATE_LIMIT_PER_MIN ?? DEFAULT_PER_MIN);
  if (!Number.isFinite(parsed) || parsed < 0) return DEFAULT_PER_MIN;
  return Math.floor(parsed);
}

export interface RateLimitDecision {
  limited: boolean;
  /** Seconds until the current window closes (set when limited). */
  retryAfterSeconds: number;
}

/** Count one authenticated job-creation POST and decide whether it is allowed. */
export function checkJobsRateLimit(userId: string, now: number = Date.now()): RateLimitDecision {
  const limit = jobsRateLimitPerMinute();
  if (limit === 0) return { limited: false, retryAfterSeconds: 0 };

  const map = limiterMap();
  if (map.size > MAX_TRACKED_KEYS) sweepExpired(map, now);

  const entry = map.get(userId);
  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    map.set(userId, { windowStart: now, count: 1 });
    return { limited: false, retryAfterSeconds: 0 };
  }

  entry.count += 1;
  if (entry.count > limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((entry.windowStart + WINDOW_MS - now) / 1000));
    return { limited: true, retryAfterSeconds };
  }
  return { limited: false, retryAfterSeconds: 0 };
}

/** Drop expired windows when the tracked-key cap is exceeded (dead user ids under test churn). */
function sweepExpired(map: Map<string, WindowEntry>, now: number): void {
  for (const [key, entry] of map) {
    if (now - entry.windowStart >= WINDOW_MS) map.delete(key);
  }
}

/** Test affordance (disclosed): wipe the in-process limiter state. */
export function __resetJobsRateLimiterForTests(): void {
  limiterMap().clear();
}
