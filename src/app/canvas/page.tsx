import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Clapperboard, LayoutDashboard, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGate } from "@/components/studios/studio-gate";
import { cn } from "@/lib/utils";

/**
 * /canvas — AI Canvas landing (private route; live counterpart /_private/canvas
 * in route-preload-manifest.json).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-canvas.json, 354 a11y
 * nodes):
 * - eyebrow paragraph 22491 'HIGGSFIELD CANVAS';
 * - hero heading 22492 'GENERATE STUNNING MEDIA WITH AI CANVAS' (lines 22493
 *   'GENERATE STUNNING' + 22494 'MEDIA WITH AI CANVAS');
 * - hero lines: paragraph 22496 'No Boards' + paragraph 22498 'Make images,
 *   videos, and ideas in one place';
 * - primary button 22500 'Create Canvas' — the canvas-creation flow was NOT
 *   captured (uncaptured fnf flow) → visibly scoped (disabled + note), with
 *   the honest studio CTA 'Continue in Cinema Studio' → '/' (wave-2 pipeline);
 * - section StaticText 22503 'Explore canvas templates' → 5 template buttons
 *   23713/23721/23729/23737/23745 ('Long Video Example', 'Simple Seedance
 *   2.0', 'Extend Video', 'Image Edit', 'StoryBoard With Elements', each with
 *   an image + 'Canvas template' label) → clone links to the routed
 *   placeholders /canvas/templates/{slug} (the template→canvas flow is not
 *   captured);
 * - captured canvas-board example text 22487 (verbatim quote block).
 */

export const metadata: Metadata = {
  title: "AI Canvas — HF Studio",
  description: "Generate stunning media with AI Canvas.",
};

/** ev: template buttons 23713-23745 — names verbatim; slug is clone-side. */
const CANVAS_TEMPLATES: { name: string; slug: string }[] = [
  { name: "Long Video Example", slug: "long-video-example" },
  { name: "Simple Seedance 2.0", slug: "simple-seedance-2-0" },
  { name: "Extend Video", slug: "extend-video" },
  { name: "Image Edit", slug: "image-edit" },
  { name: "StoryBoard With Elements", slug: "storyboard-with-elements" },
];

export default function CanvasPage() {
  return (
    <StudioGate>
      <div className="mx-auto w-full max-w-5xl space-y-10 py-2 lg:py-4">
        <header className="space-y-5">
          {/* ev: paragraph 22491 'HIGGSFIELD CANVAS' */}
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            HIGGSFIELD CANVAS
          </p>
          {/* ev: heading 22492, lines 22493/22494 */}
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            GENERATE STUNNING
            <br />
            MEDIA WITH AI CANVAS
          </h1>
          {/* ev: paragraphs 22496 + 22498 */}
          <p className="text-sm text-muted-foreground sm:text-base">
            <span className="font-medium text-foreground/80">No Boards.</span>{" "}
            Make images, videos, and ideas in one place
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* ev: button 22500 'Create Canvas' — uncaptured flow → scoped */}
            <Button size="lg" disabled aria-describedby="create-canvas-scope">
              <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
              Create Canvas
            </Button>
            {/* Honest CTA into the wave-2 pipeline (per the wave-3B order) */}
            <Button asChild size="lg" variant="secondary">
              <Link href="/">
                <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
                Continue in Cinema Studio
              </Link>
            </Button>
          </div>
          <p id="create-canvas-scope" className="max-w-xl text-xs leading-relaxed text-amber-600 dark:text-amber-400">
            Demo scope: creating a canvas board is not part of this build — the live
            &ldquo;Create Canvas&rdquo; flow was not captured, so the button is inert rather than
            faked. Cinema Studio remains the real generation pipeline.
          </p>
        </header>

        {/* ev: captured canvas-board example text 22487 (verbatim) */}
        <Card className="border-border bg-card">
          <CardContent className="space-y-2 p-4 sm:p-6">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <Layers className="h-3.5 w-3.5" aria-hidden />
              From the captured canvas example
            </p>
            <blockquote className="border-l-2 border-border pl-4 text-sm leading-relaxed text-foreground/90">
              Two athletic friends take a break on an outdoor basketball court on a sunny day. A
              young woman in a fitted crop top and matching shorts sits in the foreground.
            </blockquote>
          </CardContent>
        </Card>

        {/* ev: StaticText 22503 'Explore canvas templates' + buttons 23713-23745 */}
        <section aria-labelledby="canvas-templates-heading" className="space-y-4 pb-8">
          <h2 id="canvas-templates-heading" className="text-lg font-semibold tracking-tight">
            Explore canvas templates
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CANVAS_TEMPLATES.map((template, i) => (
              <article
                key={template.slug}
                className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
                aria-label={`${template.name} canvas template`}
              >
                <Link
                  href={`/canvas/templates/${template.slug}`}
                  className="block focus-visible:outline-none"
                >
                  <div
                    className={cn(
                      "relative flex aspect-[16/10] items-end p-3",
                      // Deterministic tile per template (no Math.random; index is stable evidence order)
                      i % 3 === 0 && "bg-gradient-to-br from-primary/25 via-card to-card",
                      i % 3 === 1 && "bg-gradient-to-br from-[var(--signal)]/20 via-card to-card",
                      i % 3 === 2 && "bg-gradient-to-br from-secondary via-card to-card"
                    )}
                  >
                    {/* ev: every template card carries a 'Canvas template' label */}
                    <Badge variant="secondary" className="bg-background/75 backdrop-blur-sm">
                      Canvas template
                    </Badge>
                    <ArrowRight
                      className="ml-auto h-4 w-4 translate-x-1 text-foreground/60 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                  <div className="space-y-1 p-4">
                    <h3 className="text-sm font-semibold leading-tight">{template.name}</h3>
                    <p className="text-[11px] text-muted-foreground">
                      Opens as a routed template placeholder
                    </p>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </StudioGate>
  );
}
