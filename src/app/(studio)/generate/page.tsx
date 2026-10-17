import type { Metadata } from "next";

import { Composer } from "@/components/studio/composer";

export const metadata: Metadata = {
  title: "Cinema Studio — HF Studio",
  description: "Compose cinematic image and video generations.",
};

export default function GeneratePage() {
  return <Composer />;
}
