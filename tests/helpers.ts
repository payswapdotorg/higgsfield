/**
 * HF-W2 test helpers (LOCAL-REAL receipts).
 * Tests talk HTTP to the live server (TEST_BASE_URL, default http://localhost:3000) and use a
 * direct Prisma client (same SQLite file) for arrange/assert.
 */
import { PrismaClient } from "@prisma/client";

export const BASE_URL = process.env.TEST_BASE_URL ?? "http://localhost:3000";
export const db = new PrismaClient();

export const TEST_EMAIL_PREFIX = "hf-w2-test-";

export class CookieJar {
  private cookie: string | null = null;

  extract(res: Response): void {
    const setCookies = res.headers.getSetCookie?.() ?? [];
    for (const c of setCookies) {
      if (c.startsWith("hf_session=")) this.cookie = c.split(";")[0];
    }
  }

  get header(): string | null {
    return this.cookie;
  }
}

export async function login(email: string, username?: string): Promise<CookieJar> {
  const jar = new CookieJar();
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, ...(username ? { username } : {}) }),
  });
  if (!res.ok) throw new Error(`login failed for ${email}: ${res.status}`);
  jar.extract(res);
  return jar;
}

export async function authFetch(
  jar: CookieJar,
  path: string,
  init?: RequestInit
): Promise<Response> {
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined) };
  if (init?.body !== undefined) headers["content-type"] = "application/json";
  if (jar.header) headers["cookie"] = jar.header;
  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  jar.extract(res);
  return res;
}

/** §1a-verbatim request body factory (exact field names). */
export function verbatimJobBody(prompt: string, overrides: Record<string, unknown> = {}) {
  return {
    params: {
      prompt,
      aspect_ratio: "3:4",
      resolution: "1k",
      batch_size: 1,
      is_storyboard: false,
      is_zoom_control: false,
      use_unlim: false,
      width: 896,
      height: 1200,
      input_images: [],
      ...overrides,
    },
    use_unlim: false,
  };
}

export async function postJob(jar: CookieJar, model: string, body: unknown, qs = ""): Promise<Response> {
  return authFetch(jar, `/api/jobs/${model}${qs}`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function waitFor(
  predicate: () => Promise<boolean>,
  timeoutMs: number,
  label: string,
  intervalMs = 30
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`timeout waiting for: ${label}`);
}

/** Delete all wave-2 test users (cascades their folders/jobs/pools/ledger/publications). */
export async function cleanupTestUsers(): Promise<void> {
  await db.user.deleteMany({ where: { email: { startsWith: TEST_EMAIL_PREFIX } } });
}

/** Give a user exactly the specified pools (deleting all others). */
export async function setPools(
  userId: string,
  pools: Array<{ kind: string; balance: number }>
): Promise<void> {
  await db.creditPool.deleteMany({ where: { userId } });
  for (const p of pools) {
    await db.creditPool.create({ data: { userId, kind: p.kind, balance: p.balance } });
  }
}

export async function setGrant(
  userId: string,
  jobSetType: string,
  amount: number
): Promise<void> {
  await db.freeGensGrant.deleteMany({ where: { userId } });
  if (amount > 0) {
    await db.freeGensGrant.create({ data: { userId, jobSetType, amount, used: 0, claimed: false } });
  }
}
