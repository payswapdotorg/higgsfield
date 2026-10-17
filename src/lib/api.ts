import { NextRequest, NextResponse } from "next/server";
import type { z } from "zod";

/** Shared helpers for the HF Studio JSON API (snake_case envelopes). */

export type BodyResult<T> =
  | { ok: true; data: T }
  | { ok: false; res: NextResponse };

/**
 * Parse + validate a JSON request body against a zod schema.
 * Returns a 400 { error: string } response on invalid JSON or schema failure.
 */
export async function parseBody<S extends z.ZodType>(
  req: NextRequest,
  schema: S,
): Promise<BodyResult<z.output<S>>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return {
      ok: false,
      res: NextResponse.json({ error: "invalid_json" }, { status: 400 }),
    };
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "invalid_body";
    return {
      ok: false,
      res: NextResponse.json({ error: message }, { status: 400 }),
    };
  }

  return { ok: true, data: parsed.data };
}

/** Parse an integer `size` query param with a fallback and a hard cap. */
export function parseSizeParam(url: URL, fallback = 50, cap = 200): number {
  const raw = url.searchParams.get("size");
  if (raw === null) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), cap);
}
