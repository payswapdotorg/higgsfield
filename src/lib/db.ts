import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  __hfSqlitePragmasApplied?: boolean
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

/**
 * SQLite contention hardening (wave-4 H1 — clone-side hardening, not product evidence).
 *
 * WHY: the station log shows P1008 ("Timed out fetching a new connection" / SQLite "Socket
 * timeout") storms when a long-lived dev server shares hf.db with a concurrent test run:
 * the rollback journal (journal_mode=delete) lets readers block the single writer and vice
 * versa, so queued lock waiters blow Prisma's 5 s pool/socket timeout, and the in-process
 * f-worker's 200 ms tick loop hot-loops failed transactions, amplifying the wedge
 * (reproduced 2026-10-17: 1073 consecutive tick errors; battery degraded 20/20 → 0/22).
 *
 * - `PRAGMA journal_mode=WAL` — write-ahead logging lets readers proceed while a writer
 *   holds the write lock. WAL PERSISTS IN THE DB FILE: once set, every process that opens
 *   hf.db (the dev server pool, the test runner's own PrismaClient, prisma db push/seed)
 *   runs in WAL mode — that persistence is what actually de-conflicts the two processes.
 * - `PRAGMA busy_timeout=5000` — PER-CONNECTION (unlike WAL it is not stored in the file):
 *   a lock collision waits up to 5 s instead of failing immediately. Prisma's SQLite driver
 *   already applies a 5000 ms busy_timeout on the connections it opens (verified with
 *   `PRAGMA busy_timeout` on a fresh client); re-issuing it here is a belt-and-suspenders
 *   set for the connection(s) that serve these statements. Additional pool connections the
 *   driver opens later rely on the driver's own default — documented, accepted.
 * - `PRAGMA synchronous=NORMAL` — the recommended durability/throughput tradeoff for WAL
 *   (safe for crash, does not fsync on every commit). Like busy_timeout this is PER-CONNECTION
 *   and not stored in the file; the once-per-process set below covers the connection(s) that
 *   serve these statements (driver default for later pool connections is synchronous=FULL —
 *   slower but strictly safer, so no correctness risk).
 *
 * Raw API note: these pragmas run through $queryRawUnsafe, not $executeRawUnsafe — in
 * Prisma 6.19 + SQLite, $executeRawUnsafe on a row-returning pragma fails with P2010
 * "Execute returned results, which is not allowed in SQLite" (journal_mode and
 * busy_timeout both return their new value as a row; verified in this environment).
 * $queryRawUnsafe executes all three statements cleanly — identical effect.
 *
 * HF-W6 GATE (postgres port): the whole block now runs ONLY when DATABASE_URL is a
 * SQLite file URL (`file:…`) — on the Postgres/Neon datasource (or any non-file URL)
 * the pragmas are skipped entirely: they are invalid PG SQL, previously failing into
 * the non-fatal warn path 3× per cold start (semantically wrong + log noise on every
 * serverless invocation). The WAL/busy_timeout rationale does not transfer anyway —
 * Postgres has MVCC and its own lock manager, so nothing is lost by skipping.
 *
 * Runs ONCE per process (globalThis-guarded so dev HMR re-imports do not re-run it),
 * strictly non-fatal per statement: on any error the app runs exactly as before (the
 * worker's tick backoff in src/server/worker.ts is the second half of this fix).
 */
const isSqlite = (process.env.DATABASE_URL ?? "").startsWith("file:")
if (isSqlite) void applySqlitePragmas()

async function applySqlitePragmas(): Promise<void> {
  if (globalForPrisma.__hfSqlitePragmasApplied) return
  globalForPrisma.__hfSqlitePragmasApplied = true
  for (const pragma of [
    'PRAGMA journal_mode=WAL;',
    'PRAGMA busy_timeout=5000;',
    'PRAGMA synchronous=NORMAL;',
  ]) {
    try {
      await db.$queryRawUnsafe(pragma)
    } catch (err) {
      // Non-fatal by order (H1): a momentarily locked DB at boot must never take the app down.
      console.warn('[hf-db] sqlite pragma failed (non-fatal):', pragma, err)
    }
  }
}
