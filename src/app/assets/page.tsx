import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { AssetsIndex } from "@/components/tools/assets-index";

/**
 * /assets — Assets index (private route; live counterpart /_private/asset in
 * route-preload-manifest.json).
 *
 * Evidence: 'Assets' is a topbar entry of the live product nav with a folder
 * icon — inspect-effects.json link 19977 'Folder icon Assets' (same node in
 * the canvas/edit/audio captures: 22471 / 18109 / 1037). The assets-page
 * surface itself was NOT captured; per the wave-3B order this page renders a
 * simple index over the EXISTING done generations (no new API routes — the
 * jobs hooks/components from src/components/generations/ are reused).
 * Component-level citations: assets-index.tsx header.
 */
export const metadata: Metadata = {
  title: "Assets — HF Studio",
  description: "Your generated assets: every done generation, filed to its project folder.",
};

export default function AssetsPage() {
  return (
    <StudioGate>
      <AssetsIndex />
    </StudioGate>
  );
}
