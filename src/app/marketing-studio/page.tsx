import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { MarketingStudioLanding } from "@/components/studios/marketing-studio-landing";

/**
 * /marketing-studio — Marketing Studio landing (private route; live counterpart
 * /_private/marketing-studio in route-preload-manifest.json).
 * Title verbatim from the evidence RootWebArea: inspect-marketing-studio.json
 * node 2887 'Marketing Studio • Higgsfield'. Evidence citations:
 * marketing-studio-landing.tsx header.
 */
export const metadata: Metadata = {
  title: "Marketing Studio — HF Studio",
  description: "Turn any product into ready to post content.",
};

export default function MarketingStudioPage() {
  return (
    <StudioGate>
      <MarketingStudioLanding />
    </StudioGate>
  );
}
