/**
 * Client-side API wrapper (§1d + §1a challenge behavior):
 * - 401 → one transparent retry after POSTing /api/auth/refresh (stale-token behavior).
 * - 429/403 "challenge" (DataDome-modeled) → toast "Something went wrong, please try again"
 *   + ONE automatic retry.
 *
 * Pure fetch logic (no React imports) so it is unit-testable with an injected fetchImpl + notifier.
 */

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown, message?: string) {
    const detail =
      (body && typeof body === "object" && "detail" in body && typeof (body as { detail: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : null) ?? `Request failed with status ${status}`;
    super(message ?? detail);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface ApiFetchOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Injectable for tests. */
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
  /** Injectable toast/notifier for tests. */
  notify?: (message: string) => void;
  /** Set when the call itself is an auth endpoint (avoids refresh loops). */
  isAuthCall?: boolean;
}

const AUTH_PATHS = ["/api/auth/login", "/api/auth/logout", "/api/auth/refresh", "/api/auth/session"];
const CHALLENGE_MESSAGE = "Something went wrong, please try again";

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const doFetch: (input: string, init?: RequestInit) => Promise<Response> =
    opts.fetchImpl ?? ((input, init) => fetch(input, init));
  const isAuthCall = opts.isAuthCall ?? AUTH_PATHS.some((p) => path.startsWith(p));

  const call = (): Promise<Response> => {
    const headers: Record<string, string> = { ...opts.headers };
    let body: string | undefined;
    if (opts.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(opts.body);
    }
    return doFetch(path, {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      credentials: "same-origin",
    });
  };

  let res = await call();

  // §1d: automatic retry-once on 401 after refreshing the session token.
  if (res.status === 401 && !isAuthCall) {
    await doFetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" }).catch(() => null);
    res = await call();
  }

  // §1a: 429/403 "challenge" → surface toast + ONE automatic retry.
  if ((res.status === 429 || res.status === 403) && !isAuthCall) {
    opts.notify?.(CHALLENGE_MESSAGE);
    res = await call();
  }

  if (!res.ok) {
    let parsed: unknown = null;
    try {
      parsed = await res.json();
    } catch {
      parsed = null;
    }
    throw new ApiError(res.status, parsed);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
