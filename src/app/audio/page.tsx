import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { AudioStudio } from "@/components/tools/audio-studio";

/**
 * /audio — Higgsfield Audio (private route; live counterpart /_private/audio
 * in route-preload-manifest.json). Title verbatim from the evidence
 * RootWebArea: inspect-audio.json root 'Higgsfield Audio - AI Voice Over &
 * Voice Translation Tool'. Component-level evidence citations:
 * audio-studio.tsx header.
 */
export const metadata: Metadata = {
  title: "Higgsfield Audio - AI Voice Over & Voice Translation Tool — HF Studio",
  description: "Turn text into speech, pick or clone a voice, write, describe and generate.",
};

export default function AudioPage() {
  return (
    <StudioGate>
      <AudioStudio />
    </StudioGate>
  );
}
