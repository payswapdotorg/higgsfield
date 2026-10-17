#!/usr/bin/env node
/**
 * scripts/verify.mjs — wave-4 H6 final acceptance battery (zero-dep; bun or node).
 *
 * Runs, in order, and prints a PASS/FAIL table (exit 0 iff every row PASSes):
 *   1. lint          — `bun run lint` (eslint, 0 errors expected)
 *   2. tsc           — `bunx tsc --noEmit`
 *   3. build         — `bun run build`. If the standalone-COPY step fails in-sandbox (the
 *                      wave-2 honest-build-config note: `next build` can compile cleanly
 *                      while the trailing `cp -r … .next/standalone/…` cannot run), the
 *                      failure line is reported and the battery CONTINUES — but the row is
 *                      graded FAIL (no fake passes). A dev server sharing `.next` is stopped
 *                      first because `next build` and `next dev` conflict on that directory.
 *   4. route-parity  — `bun scripts/route-parity.mjs` (wave-3 exit gate, exit 0 expected)
 *   5. battery        — clean-server test run: pkill the :3111 dev server, relaunch it,
 *                      wait for HTTP 200 on /api/health (timeout 90 s), then
 *                      `bun test tests/api.test.ts tests/e2e.test.ts tests/hardening.test.ts`
 *                      with TEST_BASE_URL. THE SERVER IS LEFT RUNNING at exit.
 *
 * Environment pinning (disclosed): the server and the test process are launched with an
 * explicit DATABASE_URL so the repo-local SQLite file is used even when the invoking shell
 * carries an unrelated ambient DATABASE_URL (this sandbox's shells export one pointing at
 * another project's DB — the historical cause of "which database is this" confusion).
 * MOCK_ADAPTER_MS=50 on the battery server is the e2e-prescribed recipe
 * (tests/e2e.test.ts header) and keeps the retry walks inside the waitFor windows.
 *
 * Assumptions: `bun install`, `bun run db:push`, `bun run db:seed` have run (README
 * quickstart). Repo writes: NONE — this script only prints (the committed report is
 * docs/verify-report.md, produced by capturing this script's stdout).
 */

import { spawn } from "node:child_process";
import { openSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const PORT = 3111;
const BASE_URL = `http://localhost:${PORT}`;
const DATABASE_URL = "file:../db/hf.db"; // relative to prisma/schema.prisma → repo-local db/hf.db
const DEV_LOG = "/tmp/hf-verify-dev.log";

/** Run a shell command in ROOT, capturing combined stdout+stderr and the exit code. */
function sh(cmd, timeoutMs = 180_000) {
  return new Promise((resolve) => {
    const child = spawn(cmd, {
      cwd: ROOT,
      shell: true,
      env: { ...process.env, DATABASE_URL },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    const timer = setTimeout(() => {
      out += `\n[verify] TIMEOUT after ${timeoutMs}ms — killing\n`;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => (out += d.toString()));
    child.stderr.on("data", (d) => (out += d.toString()));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? -1, out });
    });
    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: -1, out: out + `\n[verify] spawn error: ${err.message}` });
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const rows = [];
function record(check, status, detail) {
  rows.push({ check, status, detail });
  console.log(`[${status}] ${check}${detail ? ` — ${detail}` : ""}`);
}

/** Kill any dev server bound to our port (exit 1 = nothing matched — fine). */
async function killDevServer() {
  await sh(`pkill -f "next dev -p ${PORT}" || true`, 10_000);
  await sleep(1500);
}

async function waitForServer(timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      if (res.status === 200) return true;
    } catch {
      /* not up yet */
    }
    await sleep(500);
  }
  return false;
}

function testCounts(out) {
  const m = out.match(/(\d+) pass\s*\n\s*(\d+) fail/);
  return m ? `${m[1]} pass / ${m[2]} fail` : "counts unparsed";
}

async function main() {
  console.log(`# verify.mjs — HF wave-4 acceptance battery`);
  console.log(`# repo: ${ROOT} · port: ${PORT} · db: ${DATABASE_URL} · started ${new Date().toISOString()}\n`);

  // ── 1. lint ──────────────────────────────────────────────────────────────────────
  {
    const { code, out } = await sh("bun run lint", 240_000);
    if (code === 0) record("lint", "PASS", "eslint 0 errors");
    else record("lint", "FAIL", lastLines(out, 3));
  }

  // ── 2. tsc ───────────────────────────────────────────────────────────────────────
  {
    const { code, out } = await sh("bunx tsc --noEmit", 300_000);
    if (code === 0) record("tsc", "PASS", "no type errors");
    else record("tsc", "FAIL", lastLines(out, 3));
  }

  // ── 3. build ─────────────────────────────────────────────────────────────────────
  {
    // next build and a live `next dev` share .next — stop the dev server first.
    await killDevServer();
    const { code, out } = await sh("bun run build", 600_000);
    if (code === 0) {
      record("build", "PASS", "next build + standalone copy exit 0");
    } else {
      // Report the actual failure lines. If the compile itself finished (route table
      // printed) and only the standalone-copy step failed, say so — but grade FAIL.
      const compiled = /\(Static\)|\(Dynamic\)|Compiled successfully/.test(out);
      const copyLine = out
        .split("\n")
        .filter((l) => /cp:|standalone|No such file or directory/i.test(l))
        .slice(0, 2)
        .join(" ⏎ ");
      const kind = compiled && copyLine ? "standalone-copy step" : "next build";
      record("build", "FAIL", `${kind} failed: ${copyLine || lastLines(out, 2)}`);
    }
  }

  // ── 4. route-parity ──────────────────────────────────────────────────────────────
  {
    const { code, out } = await sh("bun scripts/route-parity.mjs", 120_000);
    const summary = out
      .split("\n")
      .filter((l) => /IMPLEMENTED|MISSING|EXTRA|DEFERRED|CURATION/i.test(l))
      .slice(0, 2)
      .join(" · ");
    if (code === 0) record("route-parity", "PASS", summary || "exit 0");
    else record("route-parity", "FAIL", lastLines(out, 3));
  }

  // ── 5. clean-server battery (leaves the server RUNNING) ─────────────────────────
  {
    await killDevServer();
    const logFd = openSync(DEV_LOG, "a");
    const server = spawn("bunx", ["next", "dev", "-p", String(PORT)], {
      cwd: ROOT,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      env: { ...process.env, DATABASE_URL, MOCK_ADAPTER_MS: "50" },
    });
    server.unref();

    const ready = await waitForServer(90_000);
    if (!ready) {
      record("battery", "FAIL", `dev server on :${PORT} did not answer 200 on /api/health within 90 s (log: ${DEV_LOG})`);
    } else {
      const { code, out } = await sh(
        "TEST_BASE_URL=" + BASE_URL + " bun test tests/api.test.ts tests/e2e.test.ts tests/hardening.test.ts",
        300_000
      );
      const counts = testCounts(out);
      const files = (out.match(/Ran \d+ tests across \d+ files/) || [""])[0];
      if (code === 0) record("battery", "PASS", `${counts} · ${files} · server on :${PORT} left running`);
      else record("battery", "FAIL", `${counts} · ${lastLines(out, 6)}`);
    }
  }

  // ── table + exit ─────────────────────────────────────────────────────────────────
  console.log("\n## PASS/FAIL table\n");
  const width = Math.max(12, ...rows.map((r) => r.check.length));
  console.log(`| ${"check".padEnd(width)} | status | detail |`);
  console.log(`| ${"-".repeat(width)} | ------ | ------ |`);
  for (const r of rows) {
    console.log(`| ${r.check.padEnd(width)} | ${r.status} | ${(r.detail || "").replace(/\|/g, "/").replace(/\n/g, " ")} |`);
  }
  const failed = rows.filter((r) => r.status !== "PASS").length;
  console.log(
    `\nResult: ${failed === 0 ? "PASS" : "FAIL"} — ${rows.length - failed}/${rows.length} checks green` +
      ` · dev server on :${PORT} left running (log: ${DEV_LOG}) · finished ${new Date().toISOString()}`
  );
  process.exit(failed === 0 ? 0 : 1);
}

function lastLines(out, n) {
  const lines = out
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.slice(-n).join(" ⏎ ").slice(0, 300) || "(no output)";
}

main().catch((err) => {
  console.error("[verify] fatal:", err);
  process.exit(1);
});
