/// <reference types="bun-types" />
/**
 * HF-W2 §3.6 E2E — the full local loop, run with the mock adapter at N=50ms:
 *   MOCK_ADAPTER_MS=50 on the server, then:
 *   TEST_BASE_URL=http://localhost:3000 bun test tests/e2e.test.ts
 *
 * Loop: sign in (fresh user with a §1c-style grant) → create folder → prompt → generate
 * (§1a body, folder association) → poll to done → asset visible in My generations
 * (jobs list) AND in the community feed (publish) → ledger exact.
 */
import { afterAll, beforeEach, describe, expect, test } from "bun:test";
import {
  BASE_URL,
  db,
  cleanupTestUsers,
  login,
  authFetch,
  postJob,
  verbatimJobBody,
  waitFor,
  setPools,
  setGrant,
} from "./helpers";

const EMAIL = "hf-w2-test-e2e@hf-test.local";
const USERNAME = "e2e_creator";

beforeEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await db.$disconnect();
});

describe("E2E — create folder → prompt → generate (N=50ms) → poll → My generations + feed; ledger exact", () => {
  test("the full loop", async () => {
    // ── Arrange: fresh user with wallet 50 + a 5-free-gens touring grant (§1c shape). ──
    const jar = await login(EMAIL, USERNAME);
    const sessionRes = await authFetch(jar, "/api/auth/session");
    const { user } = (await sessionRes.json()) as { user: { id: string; username: string } };
    await setPools(user.id, [{ kind: "wallet", balance: 50 }]);
    await setGrant(user.id, "nano_banana_2", 5);

    // ── Step 1: create folder ──
    const folderRes = await authFetch(jar, "/api/folders", {
      method: "POST",
      body: JSON.stringify({ name: "E2E Launch Set" }),
    });
    expect(folderRes.status).toBe(200);
    const { folder } = (await folderRes.json()) as { folder: { id: string; recent_jobs_count: number } };
    expect(folder.recent_jobs_count).toBe(0);

    // ── Step 2: prompt → generate (§1a verbatim body, folder via query string) ──
    const prompt = "E2E lighthouse rising over black waves at dusk, volumetric light";
    const genRes = await postJob(
      jar,
      "nano-banana-2",
      verbatimJobBody(prompt, { aspect_ratio: "3:4" }),
      `?folder_id=${folder.id}`
    );
    expect(genRes.status).toBe(200);
    const { job } = (await genRes.json()) as {
      job: { id: string; status: string; folder_id: string | null; cost: number };
    };
    expect(job.status).toBe("queued");
    expect(job.folder_id).toBe(folder.id);
    expect(job.cost).toBe(2);

    // ── Step 3: poll (accessible list, folder-scoped) until done ──
    await waitFor(
      async () => {
        const res = await authFetch(jar, `/api/jobs/accessible?folder_id=${folder.id}`);
        const body = (await res.json()) as { jobs: Array<{ status: string }> };
        return body.jobs.length === 1 && body.jobs[0].status === "done";
      },
      15000,
      "folder job done"
    );

    // ── Step 4: asset visible in My generations ──
    const myGens = (await (
      await authFetch(jar, "/api/jobs/accessible")
    ).json()) as { jobs: Array<{ id: string; asset_url: string | null; prompt: string }> };
    const mine = myGens.jobs.find((j) => j.id === job.id);
    expect(mine).toBeDefined();
    const assetUrl = mine?.asset_url ?? "";
    expect(assetUrl).toMatch(/^\/fixtures\/gen-\d{2}\.png$/);
    expect(mine?.prompt).toBe(prompt);

    // The asset itself is served.
    const assetRes = await fetch(`${BASE_URL}${mine?.asset_url}`);
    expect(assetRes.status).toBe(200);

    // Folder count reflects the job.
    const folderAfter = (await (
      await authFetch(jar, `/api/folders/${folder.id}`)
    ).json()) as { folder: { recent_jobs_count: number } };
    expect(folderAfter.folder.recent_jobs_count).toBe(1);

    // ── Step 5: publish → asset visible in the community feed ──
    const pubRes = await authFetch(jar, `/api/jobs/${job.id}/publish`, { method: "POST" });
    expect(pubRes.status).toBe(200);
    const publication = (await pubRes.json()) as { publication: { author_username: string } };
    expect(publication.publication.author_username).toBe(USERNAME);

    const feed = (await (
      await fetch(`${BASE_URL}/api/community/generations/feed?limit=50`)
    ).json()) as { items: Array<{ id: string; author_username: string; thumbnail_url: string }> };
    const inFeed = feed.items.find((p) => p.author_username === USERNAME);
    expect(inFeed).toBeDefined();
    expect(inFeed?.thumbnail_url).toBe(assetUrl);

    // ── Step 6: ledger exact ──
    const ledger = await db.creditLedger.findMany({ where: { jobId: job.id } });
    expect(ledger.length).toBe(1);
    expect(ledger[0].poolKind).toBe("free_gens:nano_banana_2");
    expect(ledger[0].delta).toBe(-2);
    expect(ledger[0].balanceAfter).toBe(3);
    expect(ledger[0].reason).toBe("free_generations");

    const grant = await db.freeGensGrant.findUnique({
      where: { userId_jobSetType: { userId: user.id, jobSetType: "nano_banana_2" } },
    });
    expect(grant?.used).toBe(2);

    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(50); // untouched — free-gens burned first

    const walletApi = (await (await authFetch(jar, "/api/user/wallet")).json()) as { credits_balance: number };
    expect(walletApi.credits_balance).toBe(50);

    const freeGens = (await (
      await authFetch(jar, "/api/user/free-gens/v2")
    ).json()) as { rewards: { free_generations: { remaining: number } } };
    expect(freeGens.rewards.free_generations.remaining).toBe(3);
  });
});
