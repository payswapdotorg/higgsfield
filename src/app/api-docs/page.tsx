import type { Metadata } from "next";
import { ApiPlatformLanding } from "@/components/platform/api-platform-landing";

/**
 * /api-docs — the Open Platform page (public, no SessionGate).
 *
 * ROUTE RENAME (disclosed clone-side choice): the live page sits at `/api`
 * (evidence root: "Open Higgsfield AI | Official Higgsfield API Platform"),
 * but in this Next.js App Router build `src/app/api/` is the API route-handler
 * namespace (auth/jobs/folders/... route.ts files) and cannot host a page —
 * a page at src/app/api/page.tsx would collide with the existing handler tree.
 * The page therefore lives at `/api-docs` and is linked from the nav as "API".
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-api.json (2577 a11y
 * nodes) — hero/banner/tabs/model-grid citations live in
 * src/components/platform/api-platform-landing.tsx; card data comes from
 * src/lib/model-registry.ts (wave-3A, same evidence base).
 */
export const metadata: Metadata = {
  title: "Open Higgsfield AI | Official Higgsfield API Platform — HF Studio",
  description:
    "The HF Studio open platform: every image and video model, workflows, and API pricing notes, with the cashback banner from the captured platform page.",
};

export default function ApiDocsPage() {
  return <ApiPlatformLanding />;
}
