import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGate } from "@/components/studios/studio-gate";

/**
 * /canvas/[id]/embed — routed AI Canvas embed placeholder (private; live
 * counterpart /_private/canvas/$id/embed in route-preload-manifest.json).
 *
 * The embed surface was NOT captured in the 2026-10-17 survey. Rendered as a
 * minimal centered disclosure (embeds typically render standalone, so the
 * shell stays deliberately sparse) — the canvas id is displayed verbatim and
 * nothing is simulated.
 */

export const metadata: Metadata = {
  title: "Canvas embed — HF Studio",
  description: "AI Canvas embed (routed placeholder).",
};

export default async function CanvasEmbedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!id || id === "templates") notFound();

  return (
    <StudioGate>
      <div className="mx-auto flex min-h-[60vh] w-full max-w-xl items-center justify-center py-8">
        <Card className="w-full border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-3 p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
              <span className="font-semibold text-amber-500">Demo scope — embed placeholder</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This route exists in the live product (route-preload-manifest.json key{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/_private/canvas/$id/embed</code>
              ) but its surface was not captured in the evidence survey, so no embeddable canvas is
              rendered here. Canvas ID:{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{id}</code>.
            </p>
            <p className="text-xs text-muted-foreground">
              <Link href={`/canvas/${id}`} className="underline underline-offset-4 hover:text-foreground">
                Open the canvas workspace shell instead
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </StudioGate>
  );
}
