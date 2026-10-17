import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { AdsAllProjects } from "@/components/studios/ads-all-projects";

/**
 * /ads-studio/all — Ads Studio projects list (private route; live counterpart
 * /_private/ads-studio/all in route-preload-manifest.json; surface not captured).
 * Evidence citations + the no-ads-surface disclosure: ads-all-projects.tsx header.
 */
export const metadata: Metadata = {
  title: "Ads Studio — All projects — HF Studio",
};

export default function AdsAllProjectsPage() {
  return (
    <StudioGate>
      <AdsAllProjects />
    </StudioGate>
  );
}
