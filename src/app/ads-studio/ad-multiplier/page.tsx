import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { ToolPlaceholder } from "@/components/studios/tool-placeholder";

/**
 * /ads-studio/ad-multiplier — routed placeholder (private; live counterpart
 * /_private/ads-studio/ad-multiplier in route-preload-manifest.json).
 * Heading + blurb are evidence-derived from the Ads Studio tools grid
 * (inspect-ads-studio.json nodes 11900 'Ad multiplier' + 11901 'Recreate ad
 * with your products, characters'); the tool's own flow surface was not
 * captured → visible demo-scope note (no faked flow).
 */
export const metadata: Metadata = {
  title: "Ad multiplier — HF Studio",
};

export default function AdMultiplierPage() {
  return (
    <StudioGate>
      <ToolPlaceholder
        title="Ad multiplier"
        blurb="Recreate ad with your products, characters"
        liveRoute="/_private/ads-studio/ad-multiplier"
        extraDetail="In the live product this is a tool that recreates an existing ad with your own products and characters; the interaction surface and its fnf endpoints were not captured."
      />
    </StudioGate>
  );
}
