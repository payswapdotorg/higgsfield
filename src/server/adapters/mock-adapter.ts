/**
 * Mock model adapter.
 *
 * - Resolves after N ms (MOCK_ADAPTER_MS env, default 1200) with ±20% seeded jitter
 *   (the jittered delay uses the seeded PRNG — determinism law compliant).
 * - Resolves with a fixture asset path chosen deterministically from the job seed.
 * - Failure injection via seed: a prompt containing the exact token `[fail]` always fails;
 *   additionally MOCK_FAILURE_PCT (default 0) applies a seeded probabilistic failure rate.
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

    // Failure injection via seed.
    const forced = job.prompt.includes("[fail]");
    const failRoll = Math.floor(rng() * 100) < failurePct();
    if (forced || failRoll) {
      return { ok: false, error: "Model adapter failed (deterministic failure injection)" };
    }

    // Deterministic fixture selection.
    const idx = Math.floor(rng() * FIXTURE_COUNT);
    const fixture = `gen-${String(idx + 1).padStart(2, "0")}`;
    return { ok: true, assetUrl: `/fixtures/${fixture}.png`, assetKind: job.kind as "image" | "video" };
  },
};
