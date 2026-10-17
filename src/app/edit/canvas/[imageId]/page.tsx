import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGate } from "@/components/studios/studio-gate";

/**
 * /edit/canvas/[imageId] — routed Image Edit canvas-image placeholder
 * (private; live counterpart /_private/edit/canvas/$imageId in
 * route-preload-manifest.json).
 *
 * No canvas-image editing surface was captured in the 2026-10-17 survey
 * (inspect-edit.json covers the landing only). Routed placeholder: the image
 * id verbatim + disclosed demo-scope note. Nothing is faked.
 */

export const metadata: Metadata = {
  title: "Canvas image edit — HF Studio",
  description: "Image Edit canvas image (routed placeholder).",
};

export default async function EditCanvasImagePage({
  params,
}: {
  params: Promise<{ imageId: string }>;
}) {
  const { imageId } = await params;
  if (!imageId) notFound();

  return (
    <StudioGate>
      <div className="mx-auto w-full max-w-3xl space-y-8 py-2 lg:py-4">
        <header className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/edit">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              Image Edit
            </Link>
          </Button>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Canvas image edit</h1>
          <p className="text-xs tabular-nums text-muted-foreground">
            Image ID: <code className="rounded bg-muted px-1.5 py-0.5">{imageId}</code>
          </p>
        </header>

        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
              <span className="font-semibold text-amber-500">Demo scope — routed placeholder</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This route exists in the live product (route-preload-manifest.json key{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                /_private/edit/canvas/$imageId
              </code>
              ) but its surface was not captured in the evidence survey, so nothing beyond the
              heading above is implemented. This build will not fake the image editing flow.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudioGate>
  );
}
