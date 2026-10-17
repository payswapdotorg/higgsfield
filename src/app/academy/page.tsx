import type { Metadata } from "next";
import { AcademyLanding } from "@/components/platform/academy-landing";

/**
 * /academy — the Academy course landing page (public, no SessionGate).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-academy.json (1152 a11y
 * nodes; root "Academy | Higgsfield"). Section-level citations live in
 * src/components/platform/academy-landing.tsx.
 *
 * Route truth: route-preload-manifest.json key `/academy`. Its doc-tree
 * children (`/academy/_catalog/*`, `/academy/courses/$course…`) were not
 * captured and are deferred (see docs/route-parity-report.md).
 */
export const metadata: Metadata = {
  title: "Academy | Higgsfield — HF Studio",
  description:
    "Learn AI video from zero: 7 lessons, 90 minutes, no experience needed — the captured Academy course landing page.",
};

export default function AcademyPage() {
  return <AcademyLanding />;
}
