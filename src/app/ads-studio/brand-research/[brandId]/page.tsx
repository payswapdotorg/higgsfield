import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { ToolPlaceholder } from "@/components/studios/tool-placeholder";

/**
 * /ads-studio/brand-research/[brandId] — routed placeholder (private; live
 * counterpart /_private/ads-studio/brand-research/$brandId in
 * route-preload-manifest.json). No surface capture exists for this route — the
 * heading is derived from the route segment itself; a visible demo-scope note
 * states exactly that. The brandId param is displayed verbatim.
 */
export const metadata: Metadata = {
  title: "Brand research — HF Studio",
};

export default async function BrandResearchPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;

  return (
    <StudioGate>
      <ToolPlaceholder
        title="Brand research"
        liveRoute="/_private/ads-studio/brand-research/$brandId"
        brandId={brandId}
        extraDetail="In the live product this page researches a brand (the brand workspace is reached after a website/brand import flow that was not captured in evidence)."
      />
    </StudioGate>
  );
}
