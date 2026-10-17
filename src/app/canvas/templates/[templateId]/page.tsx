import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGate } from "@/components/studios/studio-gate";

/**
 * /canvas/templates/[templateId] — routed AI Canvas template placeholder
 * (private; live counterpart /_private/canvas/templates/$templateId in
 * route-preload-manifest.json).
 *
 * Evidence: the landing capture (inspect-canvas.json) carries the five
 * template buttons 23713/23721/23729/23737/23745 — 'Long Video Example',
 * 'Simple Seedance 2.0', 'Extend Video', 'Image Edit', 'StoryBoard With
 * Elements' (each with an image + 'Canvas template' label). The
 * template→canvas instantiation flow was NOT captured → this page is a
 * disclosed placeholder: evidence name (when the templateId matches a
 * captured template) + visible demo-scope note. Nothing is faked.
 */

const TEMPLATE_IDS: Record<string, { name: string; viewNodeId: number }> = {
  // ev: template buttons on /canvas — names verbatim from the capture
  "long-video-example": { name: "Long Video Example", viewNodeId: 23713 },
  "simple-seedance-2-0": { name: "Simple Seedance 2.0", viewNodeId: 23721 },
  "extend-video": { name: "Extend Video", viewNodeId: 23729 },
  "image-edit": { name: "Image Edit", viewNodeId: 23737 },
  "storyboard-with-elements": { name: "StoryBoard With Elements", viewNodeId: 23745 },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}): Promise<Metadata> {
  const { templateId } = await params;
  const template = TEMPLATE_IDS[templateId];
  return {
    title: template ? `${template.name} — Canvas — HF Studio` : "Canvas template — HF Studio",
  };
}

export default async function CanvasTemplatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const template = TEMPLATE_IDS[templateId];
  // Unknown template ids render the generic placeholder (the route exists in
  // the live manifest; the id is displayed verbatim) — no 404, no invention.
  if (!templateId) notFound();

  return (
    <StudioGate>
      <div className="mx-auto w-full max-w-3xl space-y-8 py-2 lg:py-4">
        <header className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/canvas">
              <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
              AI Canvas
            </Link>
          </Button>
          {/* ev: captured template name when the id matches (buttons 23713-23745) */}
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {template ? template.name : "Canvas template"}
          </h1>
          <p className="text-xs tabular-nums text-muted-foreground">
            Template ID: <code className="rounded bg-muted px-1.5 py-0.5">{templateId}</code>
            {template && (
              <>
                {" "}
                · <span className="text-muted-foreground/80">Canvas template</span>
              </>
            )}
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
                /_private/canvas/templates/$templateId
              </code>
              ). The evidence survey captured the template strip on the canvas landing
              {template ? (
                <>
                  {" "}
                  — including this template&rsquo;s card (button {template.viewNodeId} &ldquo;
                  {template.name} Canvas template&rdquo;)
                </>
              ) : (
                <> — but not a template with this id</>
              )}
              — while the flow that instantiates a canvas from a template was not captured, so it
              is not implemented and not simulated.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudioGate>
  );
}
