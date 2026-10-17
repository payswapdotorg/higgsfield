"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, LayoutGrid, Megaphone, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * /ads-studio — Ads Studio landing (private, StudioGate-wrapped).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-ads-studio.json,
 * root "Ads Studio", 377 a11y nodes):
 * - hero: StaticText 11858 'ADS STUDIO' + heading 11859 'EVERYTHING YOU NEED TO
 *   CREATE ADS THAT CONVERT' (LineBreak 13087 splits the two lines: 11860
 *   'EVERYTHING YOU NEED' / 11861 'TO CREATE ADS THAT CONVERT').
 * - tools: heading 11893 'Start with tools'; card 1 — button 11895 'Create
 *   performing static ads', StaticText 11896 title + 11897 'On-brand ads for
 *   every product at scale' + CTA 11898 'Create ads'; card 2 — button 11899
 *   'Ad multiplier', StaticText 11900 title + 11901 'Recreate ad with your
 *   products, characters' + CTA 11902 'Try ad multiplier'. Card media = Video
 *   nodes 11734/11735 ('Unable to play media.') — replaced by deterministic
 *   gradient tiles here (disclosed).
 * - how it works: heading 11904 'HOW IT WORKS'; step buttons 11916-11922
 *   ('Step 1: Your brand kit is created from your website' … 'Step 4: Every ad
 *   is shaped by market insights'); Previous/Next step buttons 11914/11924;
 *   step-1 panel = heading 11910 'YOUR BRAND KIT IS CREATED FROM YOUR WEBSITE'
 *   + paragraph 11913 'Enter your website. Your logo, colors, brand voice, and
 *   selling points load automatically. Edit anything'.
 *
 * Clone-side choices (disclosed): the "Create ads" CTA starts an uncaptured fnf
 * flow → visibly scoped (disabled + note), never faked; "Try ad multiplier"
 * links to the real /ads-studio/ad-multiplier route (itself a disclosed
 * placeholder); the "All projects" header link → /ads-studio/all is a clone-side
 * convenience (evidence for the label: inspect-marketing-studio.json node 2916
 * 'All projects'); step descriptions for steps 2-4 were not captured → visible
 * demo-scope notes.
 */

const HOW_IT_WORKS_STEPS = [
  {
    // ev: step button 11916 + panel heading 11910 + paragraph 11913
    title: "Your brand kit is created from your website",
    panelHeading: "YOUR BRAND KIT IS CREATED FROM YOUR WEBSITE",
    description:
      "Enter your website. Your logo, colors, brand voice, and selling points load automatically. Edit anything",
    captured: true,
  },
  // ev: step buttons 11918 / 11920 / 11922 — panel text not captured
  { title: "Your products are imported automatically", panelHeading: null, description: null, captured: false },
  { title: "Fresh ads for any product, anytime", panelHeading: null, description: null, captured: false },
  { title: "Every ad is shaped by market insights", panelHeading: null, description: null, captured: false },
] as const;

function ToolCard({
  title,
  subtitle,
  cta,
  href,
  disabledNote,
  icon,
  hue,
}: {
  title: string;
  subtitle: string;
  cta: string;
  href?: string;
  disabledNote?: string;
  icon: React.ReactNode;
  hue: number;
}) {
  return (
    <Card className="gap-0 overflow-hidden border-border bg-card p-0">
      <div
        className="relative flex h-36 items-center justify-center sm:h-44"
        style={{
          background: `linear-gradient(135deg, hsl(${hue} 65% 52% / 0.4), hsl(${(hue + 40) % 360} 65% 40% / 0.1))`,
        }}
        aria-hidden
      >
        {icon}
      </div>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="space-y-1">
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {href ? (
          <Button asChild size="sm">
            <Link href={href}>{cta}</Link>
          </Button>
        ) : (
          <div className="space-y-1.5">
            <Button size="sm" disabled aria-disabled="true">
              {cta}
            </Button>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              <span className="font-semibold text-amber-500">Demo scope:</span> {disabledNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdsStudioLanding() {
  const [step, setStep] = useState(0);
  const active = HOW_IT_WORKS_STEPS[step];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-12 py-2 lg:py-4">
      {/* Hero — ev: 11858 + 11859 (two-line heading per LineBreak 13087) */}
      <header className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--signal)]">
            Ads Studio
          </p>
          {/* Clone-side convenience link (label ev: marketing-studio node 2916 'All projects') */}
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
            <Link href="/ads-studio/all">
              <LayoutGrid className="mr-1 h-4 w-4" aria-hidden />
              All projects
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
          <span className="block">EVERYTHING YOU NEED</span>
          <span className="block">TO CREATE ADS THAT CONVERT</span>
        </h1>
      </header>

      {/* Start with tools — ev: heading 11893 */}
      <section aria-label="Start with tools" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight lg:text-2xl">Start with tools</h2>
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {/* ev: card 11895-11898 */}
          <ToolCard
            title="Create performing static ads"
            subtitle="On-brand ads for every product at scale"
            cta="Create ads"
            disabledNote="the ad creation flow (website → brand kit → product ads) was not captured in the evidence survey — this build will not fake it."
            icon={<Megaphone className="h-10 w-10 text-foreground/70" aria-hidden />}
            hue={18}
          />
          {/* ev: card 11899-11902 */}
          <ToolCard
            title="Ad multiplier"
            subtitle="Recreate ad with your products, characters"
            cta="Try ad multiplier"
            href="/ads-studio/ad-multiplier"
            icon={<Wand2 className="h-10 w-10 text-foreground/70" aria-hidden />}
            hue={200}
          />
        </div>
      </section>

      {/* HOW IT WORKS — ev: heading 11904, buttons 11914/11916-11922/11924, panel 11910/11913 */}
      <section aria-label="How it works" className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight lg:text-2xl">HOW IT WORKS</h2>
        <Card className="border-border bg-card">
          <CardContent className="space-y-5 p-4 sm:p-6">
            <div
              role="group"
              aria-label="Steps"
              className="flex flex-wrap items-center gap-2"
            >
              {HOW_IT_WORKS_STEPS.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  onClick={() => setStep(i)}
                  aria-current={i === step ? "step" : undefined}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    i === step
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                  )}
                >
                  Step {i + 1}: {s.title}
                </button>
              ))}
            </div>

            <div className="min-h-28 space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
              {active.panelHeading ? (
                <>
                  {/* ev: 11910 + 11913 (step 1 = the brand-kit panel) */}
                  <h3 className="text-sm font-semibold uppercase tracking-wide">{active.panelHeading}</h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    {active.description}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold uppercase tracking-wide">{active.title}</h3>
                  <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                    <span className="font-semibold text-amber-500">Demo scope:</span> this step&rsquo;s
                    panel text was not captured in the evidence survey — only the step title above is
                    evidence-derived.
                  </p>
                </>
              )}
            </div>

            {/* ev: buttons 11914 'Previous step' / 11924 'Next step' */}
            <div className="flex items-center justify-between">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                disabled={step === 0}
              >
                <ChevronLeft className="mr-1 h-4 w-4" aria-hidden />
                Previous step
              </Button>
              <Badge variant="secondary" className="tabular-nums">
                Step {step + 1} of {HOW_IT_WORKS_STEPS.length}
              </Badge>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setStep((s) => Math.min(HOW_IT_WORKS_STEPS.length - 1, s + 1))}
                disabled={step === HOW_IT_WORKS_STEPS.length - 1}
              >
                Next step
                <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t border-border pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Structure captured from the live Ads Studio (2026-10-17 evidence survey). Tool media tiles are
          deterministic placeholders (the live cards autoplay videos); flows that were not captured — ad
          creation, brand-kit import — are visibly scoped rather than faked.
        </p>
        <Button asChild variant="ghost" size="sm" className="mt-3 text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Back to the Cinema Studio composer
          </Link>
        </Button>
      </footer>
    </div>
  );
}
