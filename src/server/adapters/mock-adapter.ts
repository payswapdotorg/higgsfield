/**
 * Mock model adapter.
 *
 * - Resolves after N ms (MOCK_ADAPTER_MS env, default 1200) with ±20% seeded jitter
 *   (the jittered delay uses the seeded PRNG — determinism law compliant).
 * - Resolves with a fixture asset path chosen deterministically from the job seed.
 * - Failure injection (deterministic function of seed + attempt — a given job/attempt
 *   always fails or succeeds identically; the determinism law is preserved):
 *     · prompt containing `[fail]`          → RETRYABLE failure on EVERY attempt (a retried job
 *       fails again → the worker takes it to terminal `failed` at attempt 2 — maxAttempts cap);
 *     · prompt containing `[fail-once]`     → RETRYABLE failure on attempt 1 ONLY; attempt 2
 *       succeeds (the H2 retry-then-succeed path);
 *     · prompt containing `[fail-terminal]` → NON-retryable failure (terminal immediately — the
 *       billing/content-rejection class);
 *     · `MOCK_FAILURE_PCT` (default 0)      → seeded probabilistic RETRYABLE failure roll; the
 *       roll is derived from the job seed, so a retried job rolls identically.
 */
import type { Generation } from "@prisma/client";
import { mulberry32 } from "@/lib/seeded-rng";
import type { AdapterResult, ModelAdapter } from "./types";

const FIXTURE_COUNT = 15; // public/fixtures/gen-01.png … gen-15.png

function adapterBaseMs(): number {
  const parsed = Number(process.env.MOCK_ADAPTER_MS ?? 1200);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 1200;
}

function failurePct(): number {
  const parsed = Number(process.env.MOCK_FAILURE_PCT ?? 0);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100 ? parsed : 0;
}

export const mockAdapter: ModelAdapter = {
  name: "mock",
  async run(job: Generation): Promise<AdapterResult> {
    const rng = mulberry32(job.seed >>> 0);

    // Deterministic jittered delay: base ± 20%.
    const jitter = 0.8 + rng() * 0.4;
    const delay = Math.round(adapterBaseMs() * jitter);
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Failure injection (H2 retryable-cause classification; see the file header for the
    // token semantics). The seed-derived roll happens FIRST so [fail-once] attempt-2 runs
    // consume the same rng() calls as any other attempt (fixture choice stays deterministic).
    const forced = job.prompt.includes("[fail]");
    const failOnce = job.prompt.includes("[fail-once]");
    const failTerminal = job.prompt.includes("[fail-terminal]");
    const failRoll = Math.floor(rng() * 100) < failurePct();
    if (failTerminal) {
      return {
        ok: false,
        error: "Model adapter rejected the request (deterministic non-retryable injection)",
        retryable: false,
      };
    }
    if (forced || (failOnce && job.attempt < 2) || failRoll) {
      return {
        ok: false,
        error: "Model adapter failed (deterministic failure injection)",
        retryable: true,
      };
    }

    // Deterministic fixture selection.
    const idx = Math.floor(rng() * FIXTURE_COUNT);
    const fixture = `gen-${String(idx + 1).padStart(2, "0")}`;
    return { ok: true, assetUrl: `/fixtures/${fixture}.png`, assetKind: job.kind as "image" | "video" };
  },
};
