import type { NextConfig } from "next";

/**
 * HF-W6 (postgres/Vercel port) — two build-time gates + a serverless tracing rule:
 *
 * 1. `output: "standalone"` is now gated on HF_STANDALONE=1. Standalone is the LOCAL
 *    self-hosting recipe (the Task-70 dfork prod server: `HF_STANDALONE=1 bun run
 *    build:standalone` then launch .next/standalone/server.js). Vercel builds get the
 *    default output — the Next.js platform handles packaging there, and the unconditional
 *    standalone output was a local-only concern.
 * 2. `outputFileTracingIncludes` (the catch-all route key, value globbing the whole
 *    node_modules/.prisma tree — see the config object below) carries the Prisma client
 *    + its native query engine into the traced serverless bundle. They load through
 *    dynamic requires that Next's tracer cannot see, so without this rule the Vercel
 *    function bundle omits them and every DB call fails at cold start.
 * 3. HF_DIST_DIR (optional) relocates the build directory — an escape hatch for building
 *    beside a live standalone server that serves from `.next/standalone` (a plain
 *    `next build` wipes `.next`, which would strand that server's lazily-loaded route
 *    chunks). Unset → default `.next`.
 */
const nextConfig: NextConfig = {
  ...(process.env.HF_STANDALONE === "1" ? { output: "standalone" as const } : {}),
  ...(process.env.HF_DIST_DIR ? { distDir: process.env.HF_DIST_DIR } : {}),
  outputFileTracingIncludes: {
    "/**": ["./node_modules/.prisma/**/*"],
  },
  reactStrictMode: false,
};

export default nextConfig;
