/// <reference types="bun-types" />
/**
 * HF-W4 hardening tests (H2 job retries + H3 rate limiting) — run against the live server:
 *   TEST_BASE_URL=http://localhost:3111 bun test tests/hardening.test.ts
 *
 * Deterministic timing: the server should run with a small MOCK_ADAPTER_MS (e.g. 50 — the same
 * recipe tests/e2e.test.ts prescribes) so the retry walks complete inside the waitFor windows.
 *
 * H2 cases (evidence-scoped — the server-side mirror of the client's §1d/§1a one-transparent-retry):
 *   (a) retryable failure → ONE re-enqueue → attempt 2 succeeds → done with attempt = 2
 *       (mock token `[fail-once]`; ledger stays single — no double charge on retry);
 *   (b) non-retryable failure stays terminal at attempt = 1 (mock token `[fail-terminal]`);
 *   (c) maxAttempts caps at 2 — a persistent retryable failure (token `[fail]`) retries once,
 *       then lands terminal `failed` with attempt = 2.
 *
 * H3 cases: hammering POST /api/jobs/{model} past the per-user fixed-window limit → 429 with a
 * Retry-After header and the §1a challenge body the existing api-client already handles; a
 * second user in the same window is unaffected. The limiter is per-user and module-global in
 * the SERVER process — unique test users per case keep its state from leaking between tests
 * (cleanupTestUsers deletes the users; their limiter keys die with their ids — never reused,
 * since a re-created user gets a new id). The server-side map is unreachable from the test
 * process, so isolation relies on that per-user keying (disclosed; the limiter module also
 * exports __resetJobsRateLimiterForTests for any future in-process unit use, and
 * JOBS_RATE_LIMIT_PER_MIN=0 disables it wholesale).
 */
import { beforeEach, afterAll, describe, expect, test } from "bun:test";
import {
  db,
  cleanupTestUsers,
  login,
  authFetch,
  postJob,
  verbatimJobBody,
  waitFor,
  setPools,
  type CookieJar,
} from "./helpers";

beforeEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await db.$disconnect();
});

describe("H2 — job retries (maxAttempts = 2, retryable-cause classification)", () => {
  test("(a) retryable failure re-enqueues once; attempt 2 succeeds → done with attempt = 2, single ledger row", async () => {
    const jar = await login("hf-w2-test-retry@hf-test.local", "retry_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("[fail-once] transient blip then success"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string } };

    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "done";
      },
      20000,
      "retried job done"
    );

    const finalRes = await authFetch(jar, `/api/jobs/${job.id}`);
    const final = (await finalRes.json()) as { job: Record<string, unknown> };
    expect(final.job["status"]).toBe("done");
    expect(final.job["attempt"]).toBe(2); // H2 additive key — one retry consumed
    expect(String(final.job["asset_url"])).toMatch(/^\/fixtures\/gen-\d{2}\.png$/);
    expect(final.job["error"]).toBeNull();

    // The retry re-uses the paid slot: exactly ONE spend, wallet debited once, one ledger row.
    const email = "hf-w2-test-retry@hf-test.local";
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(8); // 10 - 2 (single charge; the retry did not re-spend)
    const ledger = await db.creditLedger.findMany({
      where: { userId: user.id, reason: "generation" },
    });
    expect(ledger.length).toBe(1);
    expect(ledger[0].delta).toBe(-2);
    expect(ledger[0].jobId).toBe(job.id);
  });

  test("(b) non-retryable failure stays terminal at attempt = 1", async () => {
    const jar = await login("hf-w2-test-noretry@hf-test.local", "noretry_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("[fail-terminal] rejected outright"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string } };

    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "failed";
      },
      20000,
      "non-retryable job failed"
    );

    const finalRes = await authFetch(jar, `/api/jobs/${job.id}`);
    const final = (await finalRes.json()) as { job: Record<string, unknown> };
    expect(final.job["status"]).toBe("failed");
    expect(final.job["attempt"]).toBe(1); // never re-enqueued
    expect(final.job["error"]).toBeString();
    expect(final.job["asset_url"]).toBeNull();
  });

  test("(c) maxAttempts caps at 2 — persistent retryable failure lands terminal failed at attempt = 2", async () => {
    const jar = await login("hf-w2-test-cap@hf-test.local", "cap_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("[fail] always fails both attempts"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string } };

    // The job re-enters `queued` between attempts — wait for the TERMINAL state, not any state.
    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "failed";
      },
      20000,
      "capped job failed"
    );

    const finalRes = await authFetch(jar, `/api/jobs/${job.id}`);
    const final = (await finalRes.json()) as { job: Record<string, unknown> };
    expect(final.job["status"]).toBe("failed");
    expect(final.job["attempt"]).toBe(2); // exactly one retry consumed, then terminal
    expect(final.job["error"]).toBeString();

    // And it does NOT re-enqueue again after reaching the cap (stable terminal state).
    await new Promise((r) => setTimeout(r, 500));
    const stable = (await (await authFetch(jar, `/api/jobs/${job.id}`)).json()) as {
      job: { status: string; attempt: number };
    };
    expect(stable.job.status).toBe("failed");
    expect(stable.job.attempt).toBe(2);
  });
});

describe("H3 — rate limiting on POST /api/jobs/{model} (per-user fixed window)", () => {
  test("hammering past the limit → 429 + Retry-After + §1a challenge body; a second user is unaffected", async () => {
    // The window limit is the server's JOBS_RATE_LIMIT_PER_MIN (default 30). The test discovers
    // it empirically instead of assuming the value: hammer until the first 429, then assert the
    // 429 contract (header, body, persistence within the window) and per-user isolation.
    const jarA = await login("hf-w2-test-rl@hf-test.local", "rl_hammer");
    const badBody = { not: "a §1a body" }; // authenticated POSTs count regardless of validation outcome

    const statuses: number[] = [];
    for (let i = 0; i < 45; i++) {
      const res = await authFetch(jarA, "/api/jobs/nano-banana-2", {
        method: "POST",
        body: JSON.stringify(badBody),
      });
      statuses.push(res.status);
    }

    const first429 = statuses.indexOf(429);
    expect(first429).toBeGreaterThan(0); // not the very first request — a real window limit
    expect(first429).toBeLessThan(45); // exceeded within the hammer

    // Within the open window, every further request is also limited.
    for (let i = first429; i < statuses.length; i++) {
      expect(statuses[i]).toBe(429);
    }

    // The 429 carries Retry-After (seconds until the window closes) and the §1a challenge body
    // the existing api-client already handles (toast + one retry — src/lib/api-client.ts).
    const limited = await authFetch(jarA, "/api/jobs/nano-banana-2", {
      method: "POST",
      body: JSON.stringify(badBody),
    });
    expect(limited.status).toBe(429);
    const retryAfter = Number(limited.headers.get("retry-after"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await limited.json()).toEqual({ detail: "challenge" });

    // A DIFFERENT user in the same window is unaffected: a valid job creation succeeds.
    const jarB = await login("hf-w2-test-rl-b@hf-test.local", "rl_second_user");
    await setPools(await jarUserId(jarB), [{ kind: "wallet", balance: 10 }]);
    const resB = await postJob(jarB, "nano-banana-2", verbatimJobBody("rate limit isolation check"));
    expect(resB.status).toBe(200);
    const jobB = (await resB.json()) as { job: { id: string; attempt: number } };
    expect(jobB.job.attempt).toBe(1);

    // Drain the created job so afterAll cleanup does not race an in-flight worker claim.
    await waitFor(
      async () => {
        const r = await authFetch(jarB, `/api/jobs/${jobB.job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "done" || body.job.status === "failed";
      },
      20000,
      "rl isolation job terminal"
    );
  });
});

/** Resolve the userId behind a session jar via the session API. */
async function jarUserId(jar: CookieJar): Promise<string> {
  const res = await authFetch(jar, "/api/auth/session");
  const body = (await res.json()) as { user: { id: string } };
  return body.user.id;
}
