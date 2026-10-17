"use client";

/**
 * Client-side API wrapper — adds the sonner toast notifier to the pure apiFetch logic
 * (§1a challenge → "Something went wrong, please try again" toast).
 */
import { toast } from "sonner";
import { apiFetch, type ApiFetchOptions } from "@/lib/api-client";

export function api<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  return apiFetch<T>(path, { ...opts, notify: (message) => toast.error(message) });
}

export { ApiError } from "@/lib/api-client";
