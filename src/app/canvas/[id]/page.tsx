import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, Clapperboard, FlaskConical, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StudioGate } from "@/components/studios/studio-gate";
import { effectHue } from "@/lib/effects-catalog";

/**
 * /canvas/[id] — routed AI Canvas workspace shell (private; live counterpart
 * /_private/canvas/$id in route-preload-manifest.json).
 *
 * The canvas workspace surface itself was NOT captured in the 2026-10-17
 * evidence survey (inspect-canvas.json covers only the /canvas landing —
 * hero, 'Create Canvas', and the template strip). This route therefore
 * renders a disclosed workspace shell: the canvas id verbatim, a deterministic
 * inert board preview, and NO interactive canvas tooling (nothing faked).
 * The honest generation CTA routes into the wave-2 Cinema Studio pipeline.
 *
 * Guard: /canvas/templates (no templateId) is not a valid canvas id — 404
 * instead of rendering the shell with id='templates'.
 */

export const metadata: Metadata = {
  title: "Canvas — HF Studio",
  description: "AI Canvas workspace (routed shell).",
};

export default async function CanvasByIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (id === "templates") notFound();

  // Deterministic board tile hues from the canvas id (no Math.random).
  const hue = effectHue(`canvas-${id}`);

  return (
    <StudioGate>
      <div className="mx-auto w-full max-w-5xl space-y-6 py-2 lg:py-4">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link href="/canvas">
                <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
                AI Canvas
              </Link>
            </Button>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Canvas workspace</h1>
            <p className="text-xs tabular-nums text-muted-foreground">
              Canvas ID: <code className="rounded bg-muted px-1.5 py-0.5">{id}</code>
            </p>
          </div>
          <Button asChild size="sm" variant="secondary">
            <Link href="/">
              <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
              Continue in Cinema Studio
            </Link>
          </Button>
        </header>

        {/* Inert deterministic board preview — evokes the canvas board without faking editing */}
        <section
          aria-label="Canvas board preview (inert)"
          className="grid aspect-[16/9] w-full grid-cols-2 gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-3 sm:p-4"
        >
          {["board-a", "board-b", "board-c", "board-d", "board-e", "board-f"].map((tile, i) => (
            <div
              key={tile}
              className="rounded-lg border border-dashed border-border"
              style={{
                background: `linear-gradient(135deg, hsl(${(hue + i * 47) % 360} 60% 50% / 0.22), transparent)`,
              }}
              aria-hidden
            />
          ))}
        </section>

        <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
          <CardContent className="space-y-3 p-4 sm:p-6">
            <p className="flex items-center gap-2 text-sm font-medium">
              <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
              <span className="font-semibold text-amber-500">Demo scope — routed workspace shell</span>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              This route exists in the live product (route-preload-manifest.json key{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/_private/canvas/$id</code>)
              but the canvas workspace surface was not captured in the 2026-10-17 survey — no
              board tools, media layers, or collaboration calls are implemented here, and none are
              simulated. The board preview above is inert decoration only.
            </p>
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <MousePointerClick className="h-3.5 w-3.5" aria-hidden />
              Generation in this build happens in Cinema Studio — the link above routes there.
            </p>
          </CardContent>
        </Card>
      </div>
    </StudioGate>
  );
}
