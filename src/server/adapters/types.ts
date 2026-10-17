import type { Generation } from "@prisma/client";

export type AdapterResult =
  | { ok: true; assetUrl: string; assetKind: "image" | "video" }
  | { ok: false; error: string };

/**
 * Pluggable model adapter (HF-W2 §3.2): the worker delegates the actual "render" to an adapter.
 * The mock adapter resolves after N ms with a deterministic fixture asset (seeded PRNG), with
 * failure injection via seed.
 */
export interface ModelAdapter {
  name: string;
  run(job: Generation): Promise<AdapterResult>;
}
