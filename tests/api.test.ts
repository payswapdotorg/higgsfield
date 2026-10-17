/// <reference types="bun-types" />
/**
 * HF-W2 §3.6 API tests — run against the live server:
 *   TEST_BASE_URL=http://localhost:3000 bun test tests/api.test.ts
 *
 * Covers: jobs POST §1a shape parity (exact field names), atomic credit spend (concurrent ×2),
 * status machine walk, free-gens burn order, feed pagination, trash count, and the §1d/§1a
 * client retry behaviors (unit level against the pure apiFetch wrapper).
 */
import { beforeEach, afterAll, describe, expect, test } from "bun:test";
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
  type CookieJar,
} from "./helpers";
import { apiFetch, ApiError } from "@/lib/api-client";

beforeEach(async () => {
  await cleanupTestUsers();
});

afterAll(async () => {
  await cleanupTestUsers();
  await db.$disconnect();
});

describe("§1a jobs POST validation — shape parity (exact field names)", () => {
  test("verbatim evidence body is accepted and echoed exactly", async () => {
    const jar = await login("hf-w2-test-shape@hf-test.local", "shape_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("neon portrait over a rainy city"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: Record<string, unknown> };

    // Exact §1a-driven fields on the returned job.
    expect(job["aspect_ratio"]).toBe("3:4");
    expect(job["resolution"]).toBe("1k");
    expect(job["batch_size"]).toBe(1);
    expect(job["width"]).toBe(896);
    expect(job["height"]).toBe(1200);
    expect(job["model_version"]).toBe("nano-banana-2");
    expect(job["job_set_type"]).toBe("nano_banana_2");
    expect(job["kind"]).toBe("image");
    expect(job["status"]).toBe("queued");
    expect(job["cost"]).toBe(2);
    expect(job["input_images"]).toEqual([]);
    expect(typeof job["workspace_id"]).toBe("string");
    // Status machine fields present.
    expect(typeof job["seed"]).toBe("number");
    expect(Array.isArray(job["credits_spent"])).toBe(true);
    expect(job["asset_url"]).toBeNull();
    expect(job["error"]).toBeNull();
    expect(Array.isArray(job["notices"])).toBe(true);
  });

  test("aspect presets drive width/height — server values win over client-sent ones", async () => {
    const jar = await login("hf-w2-test-preset@hf-test.local", "preset_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(
      jar,
      "nano-banana-2",
      verbatimJobBody("wide cinematic still", { aspect_ratio: "16:9", width: 999, height: 999 })
    );
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: Record<string, unknown> };
    expect(job["width"]).toBe(1200);
    expect(job["height"]).toBe(672);

    const res2 = await postJob(
      jar,
      "nano-banana-2",
      verbatimJobBody("square still", { aspect_ratio: "1:1", resolution: "2k" })
    );
    const { job: job2 } = (await res2.json()) as { job: Record<string, unknown> };
    expect(job2["width"]).toBe(2048);
    expect(job2["height"]).toBe(2048);
  });

  test("missing §1a field → 400", async () => {
    const jar = await login("hf-w2-test-missing@hf-test.local", "missing_tester");
    const body = verbatimJobBody("x");
    delete (body.params as Record<string, unknown>)["is_storyboard"];
    const res = await postJob(jar, "nano-banana-2", body);
    expect(res.status).toBe(400);
    const detail = (await res.json()) as { detail: string };
    expect(typeof detail.detail).toBe("string");
  });

  test("renamed field (camelCase) → 400", async () => {
    const jar = await login("hf-w2-test-camel@hf-test.local", "camel_tester");
    const body = verbatimJobBody("x") as { params: Record<string, unknown> };
    body.params["aspectRatio"] = "3:4";
    delete body.params["aspect_ratio"];
    const res = await postJob(jar, "nano-banana-2", body);
    expect(res.status).toBe(400);
  });

  test("unknown extra field → 400 (strict shape)", async () => {
    const jar = await login("hf-w2-test-extra@hf-test.local", "extra_tester");
    const body = verbatimJobBody("x") as { params: Record<string, unknown> };
    body.params["surprise"] = true;
    const res = await postJob(jar, "nano-banana-2", body);
    expect(res.status).toBe(400);
  });

  test("bad aspect_ratio value → 400", async () => {
    const jar = await login("hf-w2-test-aspect@hf-test.local", "aspect_tester");
    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("x", { aspect_ratio: "4:3" }));
    expect(res.status).toBe(400);
  });

  test("unknown model slug → 404", async () => {
    const jar = await login("hf-w2-test-model@hf-test.local", "model_tester");
    const res = await postJob(jar, "not-a-model", verbatimJobBody("x"));
    expect(res.status).toBe(404);
  });

  test("unauthenticated → 401 with §1d verbatim detail", async () => {
    const res = await fetch(`${BASE_URL}/api/jobs/nano-banana-2`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(verbatimJobBody("x")),
    });
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ detail: "Invalid or expired token" });
  });
});

describe("atomic credit spend — concurrent ×2 cannot double-spend", () => {
  test("wallet holds exactly one job's cost → one 200, one 402, balance 0", async () => {
    const email = "hf-w2-test-spend@hf-test.local";
    const jar = await login(email, "spend_tester");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 2 }]);
    await setGrant(user.id, "nano_banana_2", 0);

    const [a, b] = await Promise.allSettled([
      postJob(jar, "nano-banana-2", verbatimJobBody("first concurrent shot")),
      postJob(jar, "nano-banana-2", verbatimJobBody("second concurrent shot")),
    ]);

    const statuses = [a, b]
      .map((r) => (r.status === "fulfilled" ? r.value.status : `rejected:${r.reason}`))
      .sort();
    expect(statuses).toEqual([200, 402]);

    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(0); // exactly one spend of 2, never negative

    const jobCount = await db.generation.count({ where: { userId: user.id } });
    expect(jobCount).toBe(1);

    // Ledger for the single created job is exact.
    const ledger = await db.creditLedger.findMany({
      where: { userId: user.id, reason: "generation" },
    });
    expect(ledger.length).toBe(1);
    expect(ledger[0].delta).toBe(-2);
    expect(ledger[0].balanceAfter).toBe(0);
  });
});

describe("status machine walk — queued → processing → done / failed", () => {
  test("normal job reaches done with a fixture asset", async () => {
    const jar = await login("hf-w2-test-walk@hf-test.local", "walk_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("a calm lake at dawn"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string } };

    let lastStatus = "queued";
    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        lastStatus = body.job.status;
        return lastStatus === "done";
      },
      15000,
      "job done"
    );
    const finalRes = await authFetch(jar, `/api/jobs/${job.id}`);
    const final = (await finalRes.json()) as { job: Record<string, unknown> };
    expect(final.job["status"]).toBe("done");
    expect(String(final.job["asset_url"])).toMatch(/^\/fixtures\/gen-\d{2}\.png$/);
    expect(final.job["asset_url"]).not.toBeNull();
    expect(lastStatus).toBe("done");
  });

  test("[fail]-marked job reaches failed deterministically", async () => {
    const jar = await login("hf-w2-test-fail@hf-test.local", "fail_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 10 }]);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("[fail] deterministic failure walk"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string } };

    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "failed";
      },
      15000,
      "job failed"
    );
    const finalRes = await authFetch(jar, `/api/jobs/${job.id}`);
    const final = (await finalRes.json()) as { job: Record<string, unknown> };
    expect(final.job["status"]).toBe("failed");
    expect(final.job["error"]).toBeString();
    expect(final.job["asset_url"]).toBeNull();
  });

  test("wan2_2_animate_faceswap job carries the §1e notice", async () => {
    const jar = await login("hf-w2-test-notice@hf-test.local", "notice_tester");
    await setPools(await jarUserId(jar), [{ kind: "wallet", balance: 100 }]);

    const res = await postJob(jar, "wan-2-2-animate-faceswap", verbatimJobBody("portrait animation test"));
    expect(res.status).toBe(200);
    const { job } = (await res.json()) as { job: { id: string; notices: Array<{ badge: { label: string } }> } };
    expect(job.notices.length).toBeGreaterThan(0);
    expect(job.notices[0].badge.label).toBe("Temporary Issues");
  });
});

describe("free-gens burn order — grant first, wallet only after exhaustion", () => {
  test("grant burns before wallet, then splits, then falls through", async () => {
    const email = "hf-w2-test-free@hf-test.local";
    const jar = await login(email, "free_tester");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 100 }]);
    await setGrant(user.id, "nano_banana_2", 5); // §1c touring amount

    // 1) cost 2 — entirely from the grant.
    const r1 = await postJob(jar, "nano-banana-2", verbatimJobBody("free burn one"));
    expect(r1.status).toBe(200);
    const j1 = (await r1.json()) as { job: { credits_spent: Array<{ pool: string; amount: number }> } };
    expect(j1.job.credits_spent).toEqual([{ pool: "free_gens:nano_banana_2", amount: 2 }]);

    // 2) cost 2 again — still grant-only.
    const r2 = await postJob(jar, "nano-banana-2", verbatimJobBody("free burn two"));
    const j2 = (await r2.json()) as { job: { credits_spent: Array<{ pool: string; amount: number }> } };
    expect(j2.job.credits_spent).toEqual([{ pool: "free_gens:nano_banana_2", amount: 2 }]);

    // 3) grant now has 1 left — cost 2 splits 1 grant + 1 wallet.
    const r3 = await postJob(jar, "nano-banana-2", verbatimJobBody("free burn split"));
    const j3 = (await r3.json()) as { job: { credits_spent: Array<{ pool: string; amount: number }> } };
    expect(j3.job.credits_spent).toEqual([
      { pool: "free_gens:nano_banana_2", amount: 1 },
      { pool: "wallet", amount: 1 },
    ]);

    // 4) grant exhausted — wallet funds everything.
    const r4 = await postJob(jar, "nano-banana-2", verbatimJobBody("free burn exhausted"));
    const j4 = (await r4.json()) as { job: { credits_spent: Array<{ pool: string; amount: number }> } };
    expect(j4.job.credits_spent).toEqual([{ pool: "wallet", amount: 2 }]);

    const grant = await db.freeGensGrant.findUnique({
      where: { userId_jobSetType: { userId: user.id, jobSetType: "nano_banana_2" } },
    });
    expect(grant?.used).toBe(5);
    expect(grant?.amount).toBe(5);

    const wallet = await db.creditPool.findUnique({
      where: { userId_kind: { userId: user.id, kind: "wallet" } },
    });
    expect(wallet?.balance).toBe(97); // 100 - 1 (split) - 2 (exhausted)

    // free-gens v2 reflects zero remaining.
    const fg = await authFetch(jar, "/api/user/free-gens/v2");
    const fgBody = (await fg.json()) as { rewards: { free_generations: { remaining: number } } };
    expect(fgBody.rewards.free_generations.remaining).toBe(0);
  });

  test("all pools empty → 402 (upgrade gate)", async () => {
    const email = "hf-w2-test-broke@hf-test.local";
    const jar = await login(email, "broke_tester");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, []);
    await setGrant(user.id, "nano_banana_2", 0);

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("no credits anywhere"));
    expect(res.status).toBe(402);
    const body = (await res.json()) as { detail: string };
    expect(body.detail).toBe("insufficient credits");
  });
});

describe("feed pagination", () => {
  test("pages through the seeded feed without duplicates and with correct has_more", async () => {
    const total = await db.feedPublication.count();
    const seen = new Set<string>();
    let offset = 0;
    let pages = 0;
    for (;;) {
      const res = await fetch(`${BASE_URL}/api/community/generations/feed?limit=5&offset=${offset}`);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { items: Array<{ id: string }>; has_more: boolean };
      expect(body.items.length).toBeLessThanOrEqual(5);
      for (const item of body.items) {
        expect(seen.has(item.id)).toBe(false);
        seen.add(item.id);
      }
      pages++;
      offset += body.items.length;
      if (!body.has_more) break;
    }
    expect(seen.size).toBe(total);
    expect(pages).toBeGreaterThanOrEqual(Math.ceil(total / 5));
  });
});

describe("trash count — soft delete / restore / purge", () => {
  test("count tracks soft-deleted generations", async () => {
    const email = "hf-w2-test-trash@hf-test.local";
    const jar = await login(email, "trash_tester");
    const user = await db.user.findUnique({ where: { email } });
    if (!user) throw new Error("user missing");
    await setPools(user.id, [{ kind: "wallet", balance: 10 }]);

    const before = (await (await authFetch(jar, "/api/trash/library/count")).json()) as { count: number };

    const res = await postJob(jar, "nano-banana-2", verbatimJobBody("soon to be trashed"));
    const { job } = (await res.json()) as { job: { id: string } };
    await waitFor(
      async () => {
        const r = await authFetch(jar, `/api/jobs/${job.id}`);
        const body = (await r.json()) as { job: { status: string } };
        return body.job.status === "done";
      },
      15000,
      "job done before trash"
    );

    const del = await authFetch(jar, `/api/jobs/${job.id}`, { method: "DELETE" });
    expect(del.status).toBe(200);
    const after = (await (await authFetch(jar, "/api/trash/library/count")).json()) as { count: number };
    expect(after.count).toBe(before.count + 1);

    // Default list excludes trashed; trash=1 includes it.
    const active = (await (
      await authFetch(jar, "/api/jobs/accessible")
    ).json()) as { jobs: Array<{ id: string }> };
    expect(active.jobs.find((j) => j.id === job.id)).toBeUndefined();
    const trashed = (await (
      await authFetch(jar, "/api/jobs/accessible?trash=1")
    ).json()) as { jobs: Array<{ id: string; deleted_at: string | null }> };
    const found = trashed.jobs.find((j) => j.id === job.id);
    expect(found).toBeDefined();
    expect(found?.deleted_at).not.toBeNull();

    // Restore drops the count back.
    const restore = await authFetch(jar, `/api/jobs/${job.id}/restore`, { method: "POST" });
    expect(restore.status).toBe(200);
    const restored = (await (await authFetch(jar, "/api/trash/library/count")).json()) as { count: number };
    expect(restored.count).toBe(before.count);

    // Purge removes it entirely.
    const purge = await authFetch(jar, `/api/jobs/${job.id}?purge=1`, { method: "DELETE" });
    expect(purge.status).toBe(200);
    const gone = await db.generation.findUnique({ where: { id: job.id } });
    expect(gone).toBeNull();
  });
});

/// ── HF-W5 settings/profile surface — evidence-verbatim body shapes ──────────
/// (evidence/rea-2026-10-17/api-bodies-digest.json → settings / profile; the
/// net capture shows GET-only rows, so no mutation endpoints exist to test).
describe("HF-W5 settings + profile bodies — verbatim key sets", () => {
  test("GET /api/user/settings echoes the captured consent body exactly", async () => {
    const res = await fetch(`${BASE_URL}/api/user/settings`);
    expect(res.status).toBe(401); // guests rejected (§1d)
    const jar = await login("hf-w2-test-w5-settings@hf-test.local", "w5_settings_tester");
    const ok = await authFetch(jar, "/api/user/settings");
    expect(ok.status).toBe(200);
    const body = (await ok.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(
      [
        "media_consent",
        "media_consented_at",
        "audio_consent",
        "audio_consented_at",
        "unlimited_settings",
        "has_image_auto",
        "character_sheets_consent",
        "character_sheets_consented_at",
        "ai_influencer_consent",
        "ai_influencer_consented_at",
        "supercomputer_llm_consent",
        "supercomputer_llm_consented_at",
      ].sort()
    );
    // Fresh-account defaults match the captured body values verbatim.
    expect(body["media_consent"]).toBe(false);
    expect(body["audio_consent"]).toBeNull();
    expect(body["unlimited_settings"]).toBeNull();
    expect(body["has_image_auto"]).toBe(true);
    expect(body["supercomputer_llm_consent"]).toBe(false);
  });

  test("GET /api/user/profile returns the captured profile key set", async () => {
    const jar = await login("hf-w2-test-w5-profile@hf-test.local", "w5_profile_tester");
    const res = await authFetch(jar, "/api/user/profile");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(
      [
        "username",
        "avatar_url",
        "background_image_url",
        "bio",
        "headline",
        "instagram_handle",
        "twitter_handle",
        "youtube_handle",
        "tiktok_handle",
        "discord_handle",
        "linkedin_handle",
        "show_full_name",
        "full_name",
        "location",
        "badge",
        "badges",
        "total_projects_views",
        "total_projects_likes",
        "created_at",
        "account_created_at",
        "updated_at",
      ].sort()
    );
    expect(body["badges"]).toEqual([]);
    expect(body["show_full_name"]).toBe(false);
  });

  test("GET /api/user carries the captured subscription-state keys (free-plan values)", async () => {
    const jar = await login("hf-w2-test-w5-sub@hf-test.local", "w5_sub_tester");
    const res = await authFetch(jar, "/api/user");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body["plan_type"]).toBe("free");
    expect(body["billing_period"]).toBeNull();
    expect(body["is_cancel_inited"]).toBe(false);
    expect(body["promo_state"]).toBe("inactive");
    expect(body["cohort"]).toBe("tier_1");
    expect(body["workspace_type"]).toBe("private");
    expect(body["workspace_role"]).toBe("owner");
  });

  test("GET /api/profile/[username] serves seeded users and 404s unknowns", async () => {
    const seeded = await fetch(`${BASE_URL}/api/profile/demo_creator`);
    expect(seeded.status).toBe(200);
    const body = (await seeded.json()) as Record<string, unknown>;
    expect(body["username"]).toBe("demo_creator");
    // Captured-operator fixture renders the exact captured shape.
    const operator = await fetch(`${BASE_URL}/api/profile/radiatingcapybara1609`);
    expect(operator.status).toBe(200);
    const opBody = (await operator.json()) as Record<string, unknown>;
    expect(opBody["full_name"]).toBe("yaslen Catty");
    expect(opBody["show_full_name"]).toBe(false);
    const missing = await fetch(`${BASE_URL}/api/profile/no-such-user-w5`);
    expect(missing.status).toBe(404);
  });
});

describe("§1d/§1a client retry behavior (unit — pure apiFetch)", () => {
  test("401 → refresh + exactly one retry", async () => {
    let calls: Array<[string, string | undefined]> = [];
    const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push([input, init?.method]);
      if (input === "/api/auth/refresh") return jsonResponse(200, { ok: true });
      if (calls.filter(([p]) => p === "/api/data").length === 1) return jsonResponse(401, { detail: "Invalid or expired token" });
      return jsonResponse(200, { value: 42 });
    };
    const result = await apiFetch<{ value: number }>("/api/data", { fetchImpl });
    expect(result.value).toBe(42);
    expect(calls).toEqual([
      ["/api/data", "GET"],
      ["/api/auth/refresh", "POST"],
      ["/api/data", "GET"],
    ]);
  });

  test("429 challenge → notify + one automatic retry", async () => {
    let count = 0;
    const fetchImpl = async (): Promise<Response> => {
      count++;
      if (count === 1) return jsonResponse(429, { detail: "challenge" });
      return jsonResponse(200, { ok: true });
    };
    const notices: string[] = [];
    const result = await apiFetch("/api/jobs/nano-banana-2", {
      fetchImpl,
      notify: (m) => notices.push(m),
    });
    expect(result).toEqual({ ok: true });
    expect(count).toBe(2);
    expect(notices).toEqual(["Something went wrong, please try again"]);
  });

  test("persistent 403 challenge → ApiError after the single retry", async () => {
    const fetchImpl = async (): Promise<Response> => jsonResponse(403, { detail: "challenge" });
    const notices: string[] = [];
    try {
      await apiFetch("/api/jobs/nano-banana-2", { fetchImpl, notify: (m) => notices.push(m) });
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(403);
    }
    expect(notices).toEqual(["Something went wrong, please try again"]);
  });
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Resolve the userId behind a session jar via the session API. */
async function jarUserId(jar: CookieJar): Promise<string> {
  const res = await authFetch(jar, "/api/auth/session");
  const body = (await res.json()) as { user: { id: string } };
  return body.user.id;
}
