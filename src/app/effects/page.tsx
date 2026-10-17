import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Sparkles, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EFFECTS_CATALOG, effectHue, type EffectEntry } from "@/lib/effects-catalog";
import { cn } from "@/lib/utils";

/**
 * /effects — the Visual Effects catalog (PUBLIC, no session gate).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-effects.json, 1235 a11y
 * nodes):
 * - hero heading 19992 'VISUAL EFFECTS' (StaticText 19993) — rendered verbatim;
 * - quick-link strip navigation 19994 'Effects' → 51 links over the effect
 *   names with ' new' badges on 7 (AGAMEMNON/FALLEN ANGEL/BULLET TIME/
 *   CYCLOPE/PIGEONS/PEARL EARRING/SKATEDOG) — rendered as an in-page anchor
 *   strip over the gallery (the live quick-nav jumps to the effect cards);
 * - region 20102 'VFX gallery' → one flat list (21767) of 50 figure cards.
 *   Clone renders the 45 unique effects in first-occurrence order (5 names
 *   repeat in the live gallery — disclosed in effects-catalog.ts) grouped in
 *   a single 'VFX gallery' section (no captured sub-sections; none invented).
 * - each live card = 'View {Name}' link + '{NAME}' heading + 'Generate' link
 *   (e.g. 20105/20106/20108) — the clone card links to /effects/[slug]
 *   (detail), per the wave-3B order.
 *
 * No per-effect blurbs or media were captured: card tiles are deterministic
 * fnv1a-seeded gradients (same convention as model-registry modelHue; no
 * Math.random).
 */

export const metadata: Metadata = {
  title: "Visual Effects — HF Studio",
  description:
    "The HF Studio visual-effects catalog: named effects from the live Higgsfield VFX gallery, each with a Cinema Studio deep link.",
};

export default function EffectsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 py-2 lg:py-4">
      {/* ev: heading 19992 'VISUAL EFFECTS' (StaticText 19993) */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Wand2 className="h-4 w-4 text-[var(--signal)]" aria-hidden />
          {/* ev: page root name 'Visual Effects'; eyebrow composed from it */}
          Visual effects
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">VISUAL EFFECTS</h1>
        {/* Clone-side subtitle (no hero paragraph captured in the spec) */}
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          {EFFECTS_CATALOG.length} named effects captured from the live VFX gallery — each card
          opens its detail page with a direct route into the studio.
        </p>
      </header>

      {/* ev: navigation 19994 'Effects' — the page's own quick-link strip over
          the effect names (51 links incl. the 7 'new' badges). Rendered as
          in-page anchors into the gallery below. */}
      <nav aria-label="Effects" className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex w-max items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card p-1.5">
          {EFFECTS_CATALOG.map((effect) => (
            <a
              key={`jump-${effect.slug}`}
              href={`#effect-${effect.slug}`}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {effect.name}
              {effect.isNew && (
                <span className="ml-1.5 rounded-full bg-[var(--signal)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--signal)]">
                  new
                </span>
              )}
            </a>
          ))}
        </div>
      </nav>

      {/* ev: region 20102 'VFX gallery' — single flat gallery, no sub-sections */}
      <section aria-labelledby="vfx-gallery-heading" className="space-y-4 pb-8">
        <div className="flex items-baseline justify-between gap-4">
          <h2 id="vfx-gallery-heading" className="text-lg font-semibold tracking-tight">
            VFX gallery
          </h2>
          <p className="text-xs text-muted-foreground">
            {/* ev: 50 figure cards / 45 unique names in list 21767 */}
            50 gallery cards · {EFFECTS_CATALOG.length} unique effects
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {EFFECTS_CATALOG.map((effect) => (
            <EffectCard key={effect.slug} effect={effect} />
          ))}
        </div>
      </section>
    </div>
  );
}

function EffectCard({ effect }: { effect: EffectEntry }) {
  const hue = effectHue(effect.slug);
  return (
    <article
      id={`effect-${effect.slug}`}
      className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
      aria-label={effect.name}
    >
      <Link
        href={`/effects/${effect.slug}`}
        className="block focus-visible:outline-none"
        aria-label={effect.viewLabel}
      >
        <div
          className="relative flex aspect-[3/2] items-end p-3"
          style={{
            background: `linear-gradient(135deg, hsl(${hue} 70% 50% / 0.5), hsl(${(hue + 40) % 360} 70% 38% / 0.14))`,
          }}
        >
          {/* ev: 'new' badge from quick-nav links (e.g. 20077 'PIGEONS new') */}
          {effect.isNew && (
            <Badge className="gap-1 bg-background/75 px-2 text-[10px] font-semibold uppercase tracking-wide backdrop-blur-sm hover:bg-background/75">
              <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
              new
            </Badge>
          )}
          {/* ev: each card carries a 'Generate' link (e.g. 20108) — the honest
              clone target is the wave-2 studio pipeline at '/', disclosed. */}
          <span
            className="ml-auto inline-flex translate-x-1 items-center gap-1 rounded-full bg-background/75 px-2.5 py-1 text-[11px] font-medium text-foreground/90 opacity-0 backdrop-blur-sm transition-all group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:translate-x-0 group-focus-within:opacity-100"
            aria-hidden
          >
            Generate
            <ArrowRight className="h-3 w-3" aria-hidden />
          </span>
        </div>
        <div className="space-y-1.5 p-3">
          {/* ev: card heading (e.g. 20106 'FLOATING FALL'), verbatim */}
          <h3 className="text-sm font-bold uppercase leading-tight tracking-wide">{effect.name}</h3>
          <p className="text-[11px] text-muted-foreground">{effect.viewLabel}</p>
          {effect.occurrences.length > 1 && (
            <p className="text-[10px] tabular-nums text-muted-foreground/70">
              {/* ev: repeated gallery card (e.g. CUTOUT figures 20223 + 20351) */}
              Appears {effect.occurrences.length}× in the live gallery
            </p>
          )}
        </div>
      </Link>
    </article>
  );
}
