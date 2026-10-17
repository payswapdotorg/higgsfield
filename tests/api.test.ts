/**
 * HF Studio — wave 1 API contract tests.
 * Hits the RUNNING dev server on http://localhost:3000.
 * Run: `bun test tests/api.test.ts`
 */
/// <reference types="bun-types" />
import { beforeAll, describe, expect, test } from "bun:test";
import { createAuthedClient, type AuthedClient } from "./helpers/auth";

const TEST_EMAIL = "w1-test@hf-studio.local";
const TIMEOUT = 60_000; // generous: first hit per route compiles it in dev

let client: AuthedClient;

beforeAll(async () => {
  client = await createAuthedClient(TEST_EMAIL);
}, TIMEOUT);

async function deleteProjectsByName(name: string) {
  const list = await client.fetch(
    "/api/folders/accessible?surface=cinematic_studio&size=200",
  );
  for (const folder of list.body.items ?? []) {
    if (folder.name === name) {
      const res = await client.fetch(`/api/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (res.status !== 200) {
        throw new Error(`pre-clean delete failed for ${name}: ${res.status}`);
      }
    }
  }
}

describe("HF Studio wave 1 API", () => {
  test(
    "folders round trip",
    async () => {
      // Pre-clean leftovers from a prior run.
      await deleteProjectsByName("W1 Test Project");

      // Create — body mirrors the captured evidence exactly.
      const created = await client.fetch("/api/folders", {
        method: "POST",
        body: JSON.stringify({
          name: "W1 Test Project",
          access_mode: "private",
          surface: "cinematic_studio",
          workspace_id: null,
        }),
      });
      expect(created.status).toBe(201);
      expect(Object.keys(created.body)).toEqual([
        "id",
        "name",
        "access_mode",
        "surface",
        "workspace_id",
        "pinned_at",
        "created_at",
        "recent_jobs_count",
      ]);
      expect(created.body.name).toBe("W1 Test Project");
      expect(created.body.access_mode).toBe("private");
      expect(created.body.surface).toBe("cinematic_studio");
      expect(created.body.workspace_id).toBeNull();
      expect(created.body.pinned_at).toBeNull();
      expect(created.body.recent_jobs_count).toBe(0);

      // Accessible listing contains it.
      const accessible = await client.fetch(
        "/api/folders/accessible?surface=cinematic_studio&size=100",
      );
      expect(accessible.status).toBe(200);
      expect(
        (accessible.body.items ?? []).some(
          (f: any) => f.id === created.body.id,
        ),
      ).toBe(true);

      // Pin it, then it appears in the pinned listing.
      const patched = await client.fetch(`/api/folders/${created.body.id}`, {
        method: "PATCH",
        body: JSON.stringify({ pinned: true }),
      });
      expect(patched.status).toBe(200);
      expect(patched.body.pinned_at).not.toBeNull();

      const pinned = await client.fetch(
        "/api/folders/pinned?recent_jobs_count=true",
      );
      expect(pinned.status).toBe(200);
      expect(
        (pinned.body.items ?? []).some((f: any) => f.id === created.body.id),
      ).toBe(true);

      // Delete — gone from accessible.
      const deleted = await client.fetch(`/api/folders/${created.body.id}`, {
        method: "DELETE",
      });
      expect(deleted.status).toBe(200);
      expect(deleted.body).toEqual({ deleted: true });

      const after = await client.fetch(
        "/api/folders/accessible?surface=cinematic_studio&size=100",
      );
      expect(
        (after.body.items ?? []).some((f: any) => f.id === created.body.id),
      ).toBe(false);
    },
    TIMEOUT,
  );

  test(
    "user shape parity",
    async () => {
      const res = await client.fetch("/api/user");
      expect(res.status).toBe(200);
      expect(Object.keys(res.body).sort()).toEqual(
        [
          "id",
          "email",
          "username",
          "image",
          "credits",
          "plan_tier",
          "is_guest",
          "onboarding_completed",
          "created_at",
        ].sort(),
      );
      expect(res.body.email).toBe(TEST_EMAIL);
      expect(res.body.is_guest).toBe(false);
      expect(typeof res.body.credits).toBe("number");
      expect(typeof res.body.created_at).toBe("string");
    },
    TIMEOUT,
  );

  test(
    "user meta shape",
    async () => {
      const res = await client.fetch("/api/user/meta");
      expect(res.status).toBe(200);
      expect(typeof res.body.user_id).toBe("string");
      expect("username" in res.body).toBe(true);
      expect("credits" in res.body).toBe(true);
      expect("plan_tier" in res.body).toBe(true);
      expect("onboarding_completed" in res.body).toBe(true);
      expect(typeof res.body.personal_promo.promo_code).toBe("string");
      expect(res.body.personal_promo.discount_percent).toBe(55);
    },
    TIMEOUT,
  );

  test(
    "contests shape parity",
    async () => {
      const res = await client.fetch("/api/contests?size=50");
      expect(res.status).toBe(200);
      const items = res.body.items ?? [];
      expect(items.length).toBeGreaterThan(0);
      expect(Object.keys(items[0])).toEqual([
        "id",
        "slug",
        "title",
        "description",
        "start_at",
        "end_at",
        "status",
        "preview_image",
        "preview_video",
      ]);
      const festival = items.find(
        (c: any) => c.slug === "higgsfield-global-film-festival",
      );
      expect(festival).toBeDefined();
      expect(festival.title).toBe("Higgsfield Festival");
      expect(festival.id).toBe("4263b5fb-fead-441d-aa37-62f8aa367aa1");
    },
    TIMEOUT,
  );

  test(
    "free gens stub",
    async () => {
      const res = await client.fetch("/api/user/free-gens/v2");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ free_gens_remaining: 0 });
    },
    TIMEOUT,
  );

  test(
    "generation queue + cost",
    async () => {
      // Pre-clean leftovers from a prior run.
      await deleteProjectsByName("W1 Gen Project");

      const project = await client.fetch("/api/folders", {
        method: "POST",
        body: JSON.stringify({
          name: "W1 Gen Project",
          access_mode: "private",
          surface: "cinematic_studio",
          workspace_id: null,
        }),
      });
      expect(project.status).toBe(201);

      // Default video config prices at exactly 80 credits.
      const gen = await client.fetch("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          project_id: project.body.id,
          mode: "video",
          prompt: "test scene",
          model: "cinema-studio-4",
          resolution: "1080p",
          aspect_ratio: "16:9",
          duration_seconds: 5,
          motion: true,
          steps: 1,
        }),
      });
      expect(gen.status).toBe(201);
      expect(gen.body.status).toBe("queued");
      expect(gen.body.credit_cost).toBe(80);
      expect(gen.body.project_id).toBe(project.body.id);
      expect(gen.body.prompt).toBe("test scene");
      expect(gen.body.motion).toBe(true);

      // 4K / 10s variant: 80 * 2.2 * 1.9 rounded → 334.
      const gen4k = await client.fetch("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          project_id: project.body.id,
          mode: "video",
          prompt: "test scene 4k",
          model: "cinema-studio-4",
          resolution: "4k",
          aspect_ratio: "16:9",
          duration_seconds: 10,
          motion: true,
          steps: 1,
        }),
      });
      expect(gen4k.status).toBe(201);
      expect(gen4k.body.credit_cost).toBe(334);

      // Empty prompt → 400.
      const empty = await client.fetch("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          project_id: project.body.id,
          mode: "video",
          prompt: "",
          model: "cinema-studio-4",
          resolution: "1080p",
          aspect_ratio: "16:9",
          duration_seconds: 5,
          motion: true,
          steps: 1,
        }),
      });
      expect(empty.status).toBe(400);
      expect(typeof empty.body.error).toBe("string");

      // Unknown project → 404.
      const missingProject = await client.fetch("/api/generations", {
        method: "POST",
        body: JSON.stringify({
          project_id: "nonexistent-project-id",
          mode: "video",
          prompt: "orphan",
        }),
      });
      expect(missingProject.status).toBe(404);

      // Grouped recent_jobs_count reflects the two queued generations.
      const accessible = await client.fetch(
        "/api/folders/accessible?surface=cinematic_studio&size=200",
      );
      const entry = (accessible.body.items ?? []).find(
        (f: any) => f.id === project.body.id,
      );
      expect(entry.recent_jobs_count).toBe(2);

      // Cleanup (folder DELETE cascades its generations).
      const del = await client.fetch(`/api/folders/${project.body.id}`, {
        method: "DELETE",
      });
      expect(del.status).toBe(200);
    },
    TIMEOUT,
  );

  test(
    "username claim",
    async () => {
      // Claim (idempotent for the same test user on re-runs).
      const claim = await client.fetch("/api/user/username", {
        method: "POST",
        body: JSON.stringify({ username: "w1testuser" }),
      });
      expect(claim.status).toBe(200);
      expect(claim.body.username).toBe("w1testuser");
      expect(claim.body.onboarding_completed).toBe(true);

      // Re-claim by self → idempotent success.
      const reClaim = await client.fetch("/api/user/username", {
        method: "POST",
        body: JSON.stringify({ username: "w1testuser" }),
      });
      expect(reClaim.status).toBe(200);
      expect(reClaim.body.username).toBe("w1testuser");

      // Invalid format → 400.
      const invalid = await client.fetch("/api/user/username", {
        method: "POST",
        body: JSON.stringify({ username: "AB!" }),
      });
      expect(invalid.status).toBe(400);
      expect(typeof invalid.body.error).toBe("string");
    },
    TIMEOUT,
  );
});
