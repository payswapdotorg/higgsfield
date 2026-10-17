import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { InfluencerStudio } from "@/components/studios/influencer/influencer-studio";

/**
 * /ai-influencer-studio — the AI Influencer character builder (private route;
 * live counterpart /_private/ai-influencer-studio in route-preload-manifest.json).
 * Title verbatim from the evidence RootWebArea: inspect-ai-influencer-studio.json
 * node 1 'AI Influencer | Higgsfield'. Evidence citations:
 * influencer-studio.tsx + character-builder.tsx headers.
 */
export const metadata: Metadata = {
  title: "AI Influencer — HF Studio",
  description: "Build your AI influencer with the face, body, and style you want.",
};

export default function AiInfluencerStudioPage() {
  return (
    <StudioGate>
      <InfluencerStudio />
    </StudioGate>
  );
}
