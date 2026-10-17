import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { ToolPlaceholder } from "@/components/studios/tool-placeholder";

/**
 * /ads-studio/b/[brandId] — routed placeholder (private; live counterpart
 * /_private/ads-studio/b/$brandId in route-preload-manifest.json — the brand
 * workspace). No surface capture exists for this route; heading derived from the
 * route segment, visible demo-scope note, brandId displayed verbatim.
 */
export const metadata: Metadata = {
  title: "Brand — HF Studio",
};

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brandId: string }>;
}) {
  const { brandId } = await params;

  return (
    <StudioGate>
      <ToolPlaceholder
        title="Brand"
        liveRoute="/_private/ads-studio/b/$brandId"
        brandId={brandId}
        extraDetail="In the live product this is the per-brand workspace (brand kit, products, generated ads) opened from the Ads Studio; its surface was not captured in the evidence survey."
      />
    </StudioGate>
  );
}
