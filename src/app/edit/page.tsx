import type { Metadata } from "next";
import { StudioGate } from "@/components/studios/studio-gate";
import { EditLanding } from "@/components/tools/edit-landing";

/**
 * /edit — Image Edit landing (private route; live counterpart /_private/edit
 * in route-preload-manifest.json). Title follows the evidence RootWebArea:
 * inspect-edit.json root 'Image Edit — Turn Flat Images Into Editable Layers'.
 * Component-level evidence citations: edit-landing.tsx header.
 */
export const metadata: Metadata = {
  title: "Image Edit — Turn Flat Images Into Editable Layers — HF Studio",
  description: "Turn flat images into editable layers.",
};

export default function EditPage() {
  return (
    <StudioGate>
      <EditLanding />
    </StudioGate>
  );
}
