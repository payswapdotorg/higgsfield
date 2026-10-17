import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight, Clapperboard, FlaskConical, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EFFECTS_CATALOG, effectBySlug, effectHue } from "@/lib/effects-catalog";

/**
 * /effects/[slug] — visual-effect detail page (PUBLIC; statically generated
 * over EFFECTS_CATALOG, notFound() for unknown slugs).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-effects.json):
 * the live effect cards carry ONLY '{NAME}' heading + 'View {Name}' link +
 * 'Generate' link (e.g. FLOATING FALL: heading 20106, link 20105 'View
 * Floating fall', link 20108 'Generate'). No per-effect description, media,
 * or detail-surface capture exists in the 2026-10-17 survey — so this page
 * renders the captured facts and a visibly disclosed note instead of an
 * invented description. The honest CTA is "Try in Cinema Studio" → '/'
 * (the wave-2 generation pipeline), per the wave-3B order.
 */

export function generateStaticParams(): { slug: string }[] {
  return EFFECTS_CATALOG.map((effect) => ({ slug: effect.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const effect = effectBySlug(slug);
  if (!effect) return { title: "Effect not found — HF Studio" };
  return {
    title: `${effect.name} — Visual Effects — HF Studio`,
    description: `${effect.name}: named visual effect from the Higgsfield VFX gallery, with a direct route into the studio.`,
  };
}

export default async function EffectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const effect = effectBySlug(slug);
  if (!effect) notFound();

  const hue = effectHue(effect.slug);
  const effectIndex = EFFECTS_CATALOG.findIndex((e) => e.slug === effect.slug);
  const prev = effectIndex > 0 ? EFFECTS_CATALOG[effectIndex - 1] : null;
  const next = effectIndex < EFFECTS_CATALOG.length - 1 ? EFFECTS_CATALOG[effectIndex + 1] : null;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 py-2 lg:py-4">
      <header className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/effects">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Visual Effects
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          {/* Deterministic fnv1a-seeded tile (no effect media captured; no Math.random) */}
          <div
            className="h-28 w-full shrink-0 rounded-xl border border-border sm:h-28 sm:w-44"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.55), hsl(${(hue + 40) % 360} 70% 38% / 0.16))`,
            }}
            aria-hidden
          />
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {/* ev: card heading verbatim (e.g. 20106 'FLOATING FALL') */}
              <h1 className="text-3xl font-bold uppercase tracking-tight sm:text-4xl">{effect.name}</h1>
              {effect.isNew && (
                /* ev: quick-nav badge, e.g. link 20077 'PIGEONS new' */
                <Badge className="gap-1 px-2.5 text-[10px] font-semibold uppercase tracking-wide">
                  <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
                  new
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{effect.viewLabel}</p>
            {effect.occurrences.length > 1 && (
              <p className="text-xs tabular-nums text-muted-foreground">
                {/* ev: repeated gallery figures (e.g. CUTOUT 20223 + 20351) */}
                Appears {effect.occurrences.length}× in the live VFX gallery (figures{" "}
                {effect.occurrences.join(", ")}).
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Honest CTA into the wave-2 pipeline (order: "Try in Cinema Studio" → '/') */}
      <Card className="border-border bg-card">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="space-y-1">
            <p className="text-sm font-semibold">Use {effect.name} in a generation</p>
            <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
              The clone&rsquo;s generation pipeline lives in Cinema Studio — continue there with this
              effect as your creative direction.
            </p>
          </div>
          <Button asChild size="lg" className="shrink-0">
            <Link href="/">
              <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
              Try in Cinema Studio
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Visibly disclosed scope: no per-effect description was captured */}
      <Card className="border-dashed border-amber-500/40 bg-amber-500/5">
        <CardContent className="space-y-3 p-4 sm:p-6">
          <p className="flex items-center gap-2 text-sm font-medium">
            <FlaskConical className="h-4 w-4 text-amber-500" aria-hidden />
            <span className="font-semibold text-amber-500">Demo scope — no effect detail captured</span>
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The 2026-10-17 evidence survey captured the effect catalog cards (name +{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">View</code> +{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">Generate</code> affordances) but
            not a per-effect detail surface — no description, preview clip, or parameter set exists
            in the capture, so none is invented here. The effect pipeline itself (applying{" "}
            {effect.name} to a generation) is not implemented in this build; nothing is faked.
          </p>
        </CardContent>
      </Card>

      {/* Catalog navigation (prev/next in evidence gallery order) */}
      <nav aria-label="Effect catalog navigation" className="flex items-center justify-between gap-4 border-t border-border pt-4">
        {prev ? (
          <Link
            href={`/effects/${prev.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {prev.name}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/effects/${next.slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {next.name}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
      </nav>
    </div>
  );
}
