import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { AdsStudioLanding } from "@/components/studios/ads-studio-landing";

/**
 * /ads-studio — Ads Studio landing (private route; live counterpart
 * /_private/ads-studio in route-preload-manifest.json).
 * Title verbatim from the evidence RootWebArea: inspect-ads-studio.json node
 * 11737 'Ads Studio'. Evidence citations: ads-studio-landing.tsx header.
 */
export const metadata: Metadata = {
  title: "Ads Studio — HF Studio",
  description: "Everything you need to create ads that convert.",
};

export default function AdsStudioPage() {
  return (
    <StudioGate>
      <AdsStudioLanding />
    </StudioGate>
  );
}
