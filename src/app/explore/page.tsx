import type { Metadata } from "next";
import { ExploreModels } from "@/components/studios/explore-models";

/**
 * /explore — public model catalog surface (no SessionGate).
 *
 * Evidence: the live route is /_private/explore (route-preload-manifest.json)
 * but its surface was not captured; per the wave-3A packet this page renders the
 * model catalog extracted from surfaces/inspect-api.json (root "Open Higgsfield
 * AI | Official Higgsfield API Platform"). Title follows the platform-page
 * 'Explore models' evidence string (inspect-api.json link node 10719).
 * Component-level evidence citations: src/components/studios/explore-models.tsx.
 */
export const metadata: Metadata = {
  title: "Explore models — HF Studio",
  description:
    "The HF Studio model catalog: image and video models from every vendor, with workflows and platform pricing notes.",
};

export default function ExplorePage() {
  return <ExploreModels />;
}
