# verify-report — wave-4 H6 final acceptance battery

Run date: **2026-10-17 18:32:05Z → 18:33:04Z** · Runner: `scripts/verify.mjs` (zero-dep,
`node`/`bun`) · Branch: `hf/wave-4-hardening` · Result: **PASS — 5/5 checks green, exit 0**.

The battery: lint → tsc → `bun run build` (with the dev server stopped first — `next build`
and `next dev` share `.next`; if the standalone-copy step fails in a restricted sandbox the
failure line is reported and the run continues, graded FAIL — no fake passes) → route-parity
(wave-3 exit gate) → clean-server test battery (pkill the :3111 dev server, relaunch, wait
for 200 on `/api/health` ≤ 90 s, run api + e2e + hardening tests against it) → **the server
is left running**.

The test battery covers the original wave-2 suite (19 api + 1 e2e — zero regressions) plus
the wave-4 hardening suite (4 tests: H2 retry paths a/b/c + the H3 rate-limit hammer).

## Full output (verbatim)

```
# verify.mjs — HF wave-4 acceptance battery
# repo: /home/z/higgsfield · port: 3111 · db: file:../db/hf.db · started 2026-10-17T18:32:05.993Z

[PASS] lint — eslint 0 errors
[PASS] tsc — no type errors
[PASS] build — next build + standalone copy exit 0
[PASS] route-parity — IMPLEMENTED (matched pairs) — 40 · MISSING (in curated scope, no app route) — 0
[PASS] battery — 24 pass / 0 fail · Ran 24 tests across 3 files · server on :3111 left running

## PASS/FAIL table

| check        | status | detail |
| ------------ | ------ | ------ |
| lint         | PASS | eslint 0 errors |
| tsc          | PASS | no type errors |
| build        | PASS | next build + standalone copy exit 0 |
| route-parity | PASS | IMPLEMENTED (matched pairs) — 40 · MISSING (in curated scope, no app route) — 0 |
| battery      | PASS | 24 pass / 0 fail · Ran 24 tests across 3 files · server on :3111 left running |

Result: PASS — 5/5 checks green · dev server on :3111 left running (log: /tmp/hf-verify-dev.log) · finished 2026-10-17T18:33:04.305Z
```

## Post-run state checks

- `GET /api/health` (immediately after exit): `{"status":"ok","uptime_s":8,"db":"ok","queue":{"queued":0,"processing":0},"version":"0.2.1"}` — the battery's dev server is the process left running.
- Server log (`/tmp/hf-verify-dev.log`) carries the H4 lifecycle line: `[f-worker] started (tick=200ms, backoff<=60s, maxAttempts=2)`.

## Reproduction

```bash
bun scripts/verify.mjs        # or: node scripts/verify.mjs
```

Environment pinning (disclosed in the script): the battery server and the test process run
with an explicit `DATABASE_URL=file:../db/hf.db` (repo-local SQLite — guards against ambient
shell `DATABASE_URL` values pointing at unrelated databases) and `MOCK_ADAPTER_MS=50` (the
e2e-prescribed recipe). Assumes `bun install` + `bun run db:push` + `bun run db:seed` (README
quickstart).
