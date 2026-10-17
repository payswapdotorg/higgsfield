import type { Generation } from "@prisma/client";

export type AdapterResult =
  | { ok: true; assetUrl: string; assetKind: "image" | "video" }
  | { ok: false; error: string; retryable: boolean };

/**
 * Pluggable model adapter (HF-W2 §3.2): the worker delegates the actual "render" to an adapter.
 * The mock adapter resolves after N ms with a deterministic fixture asset (seeded PRNG), with
 * failure injection via seed.
 *
 * Wave-4 H2: `retryable` marks a failure cause the worker may retry ONCE (maxAttempts = 2) —
 * transient model errors are the retry case. Non-retryable causes (billing/content rejections)
 * go straight to terminal `failed` — e.g. insufficient credits never creates a job at all
 * (the POST returns a terminal 402 before the queue is touched).
 */
export interface ModelAdapter {
  name: string;
  run(job: Generation): Promise<AdapterResult>;
}
