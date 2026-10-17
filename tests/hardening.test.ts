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

/** Resolve the userId behind a session jar via the session API. */
async function jarUserId(jar: CookieJar): Promise<string> {
  const res = await authFetch(jar, "/api/auth/session");
  const body = (await res.json()) as { user: { id: string } };
  return body.user.id;
}
