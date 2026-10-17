"use client";

import { useState } from "react";
import { Eye, History, RefreshCw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CharacterBuilder } from "@/components/studios/influencer/character-builder";
import { cn } from "@/lib/utils";
import { modelHue } from "@/lib/model-registry";

/**
 * /ai-influencer-studio — the AI Influencer surface (private, StudioGate-wrapped).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json,
 * root "AI Influencer | Higgsfield", 813 a11y nodes):
 * - workspace region 301 'AI Influencer workspace' with tablist 303 'Page view'
 *   (tabs 304 'Explore' / 307 'History');
 * - hero: heading 322 'YOUR INFLUENCER, YOUR VIRAL HIT' (lines 323/324) +
 *   paragraph 326 'Build your AI influencer with the face, body, and style you
 *   want. Choose a motion preset and watch them perform it in a video ready to
 *   share';
 * - preset source tablist 328 with tabs 329 'AI Influencers' / 333 'Higgsfield
 *   Presets' / 337 'Community Trends';
 * - preset articles 341-395: 'AI Influencer 38', '52', '35', '50', '18', '36',
 *   '41', '43', '10', '47' — each with an image, button 'View character sheet'
 *   and button 'Recreate';
 * - settings panel: complementary 116 'AI Influencer settings' → see
 *   character-builder.tsx for its full evidence citations.
 *
 * Clone-side scoping (disclosed): preset card tiles are deterministic gradients
 * (the live images are CDN assets not captured); 'View character sheet' and
 * 'Recreate' start uncaptured flows → disabled with visible notes; the
 * 'Higgsfield Presets' / 'Community Trends' preset tabs and the 'History' page
 * tab render disclosed empty states (not captured). The builder itself is fully
 * interactive client-side state (see character-builder.tsx).
 */

const PRESETS = [
  { id: "ai-influencer-38", name: "AI Influencer 38" },
  { id: "ai-influencer-52", name: "AI Influencer 52" },
  { id: "ai-influencer-35", name: "AI Influencer 35" },
  { id: "ai-influencer-50", name: "AI Influencer 50" },
  { id: "ai-influencer-18", name: "AI Influencer 18" },
  { id: "ai-influencer-36", name: "AI Influencer 36" },
  { id: "ai-influencer-41", name: "AI Influencer 41" },
  { id: "ai-influencer-43", name: "AI Influencer 43" },
  { id: "ai-influencer-10", name: "AI Influencer 10" },
  { id: "ai-influencer-47", name: "AI Influencer 47" },
] as const;

const PRESET_SOURCES = ["ai-influencers", "higgsfield-presets", "community-trends"] as const;

const PRESET_SOURCE_LABELS: Record<(typeof PRESET_SOURCES)[number], string> = {
  "ai-influencers": "AI Influencers",
  "higgsfield-presets": "Higgsfield Presets",
  "community-trends": "Community Trends",
};

function PresetCard({ id, name }: { id: string; name: string }) {
  const hue = modelHue(id);
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card"
      aria-label={name}
    >
      <div
        className="relative flex aspect-[3/4] items-end p-3"
        style={{
          background: `linear-gradient(160deg, hsl(${hue} 60% 50% / 0.5), hsl(${(hue + 45) % 360} 60% 35% / 0.15))`,
        }}
      >
        <Badge variant="secondary" className="bg-background/70 backdrop-blur-sm">{name}</Badge>
      </div>
      <div className="space-y-2 p-3">
        {/* ev: buttons 'View character sheet' (343 et al.) / 'Recreate' (344 et al.) — flows uncaptured */}
        <Button variant="secondary" size="sm" className="w-full" disabled aria-disabled="true">
          <Eye className="mr-1 h-3.5 w-3.5" aria-hidden />
          View character sheet
        </Button>
        <Button variant="outline" size="sm" className="w-full" disabled aria-disabled="true">
          <RefreshCw className="mr-1 h-3.5 w-3.5" aria-hidden />
          Recreate
        </Button>
        <p className="text-[10px] leading-tight text-muted-foreground">
          Demo scope — character sheet + recreate flows not captured
        </p>
      </div>
    </article>
  );
}

function EmptyScope({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm font-medium">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
        <span className="font-semibold text-amber-500">Demo scope:</span> {note}
      </p>
    </div>
  );
}

export function InfluencerStudio() {
  const [pageView, setPageView] = useState<"explore" | "history">("explore");
  const [presetSource, setPresetSource] = useState<(typeof PRESET_SOURCES)[number]>("ai-influencers");

  return (
    <div className="mx-auto w-full max-w-7xl gap-6 space-y-6 py-2 lg:grid lg:grid-cols-[380px_1fr] lg:space-y-0 lg:py-4">
      {/* Settings panel — ev: complementary 116 'AI Influencer settings' */}
      <aside aria-label="AI Influencer settings" className="lg:sticky lg:top-20 lg:self-start">
        <CharacterBuilder />
      </aside>

      {/* Workspace — ev: region 301 'AI Influencer workspace' */}
      <main aria-label="AI Influencer workspace" className="min-w-0 space-y-6">
        {/* Page view tabs — ev: tablist 303 'Page view' (Explore / History) */}
        <div
          role="group"
          aria-label="Page view"
          className="flex overflow-hidden rounded-lg border border-border"
        >
          <button
            type="button"
            onClick={() => setPageView("explore")}
            aria-pressed={pageView === "explore"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
              pageView === "explore"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Users className="h-4 w-4" aria-hidden />
            Explore
          </button>
          <button
            type="button"
            onClick={() => setPageView("history")}
            aria-pressed={pageView === "history"}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
              pageView === "history"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <History className="h-4 w-4" aria-hidden />
            History
          </button>
        </div>

        {pageView === "explore" ? (
          <div className="space-y-6">
            {/* Hero — ev: heading 322 + paragraph 326 */}
            <header className="space-y-2">
              <h1 className="text-2xl font-bold leading-tight tracking-tight lg:text-3xl">
                <span className="block">YOUR INFLUENCER,</span>
                <span className="block">YOUR VIRAL HIT</span>
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Build your AI influencer with the face, body, and style you want. Choose a motion preset
                and watch them perform it in a video ready to share
              </p>
            </header>

            {/* Preset source tabs — ev: tablist 328 'Preset source' */}
            <div
              role="group"
              aria-label="Preset source"
              className="flex flex-wrap gap-2"
            >
              {PRESET_SOURCES.map((source) => {
                const active = source === presetSource;
                return (
                  <button
                    key={source}
                    type="button"
                    onClick={() => setPresetSource(source)}
                    aria-pressed={active}
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-foreground/80 hover:border-foreground/25 hover:text-foreground"
                    )}
                  >
                    {PRESET_SOURCE_LABELS[source]}
                  </button>
                );
              })}
            </div>

            {/* Preset gallery — ev: tabpanel 2297 + articles 341-395 */}
            {presetSource === "ai-influencers" ? (
              <section aria-label="AI Influencers presets" className="space-y-3">
                <div className="scrollbar-slim grid max-h-[38rem] grid-cols-2 gap-4 overflow-y-auto pr-1 sm:grid-cols-3 xl:grid-cols-4">
                  {PRESETS.map((p) => (
                    <PresetCard key={p.id} id={p.id} name={p.name} />
                  ))}
                </div>
              </section>
            ) : presetSource === "higgsfield-presets" ? (
              <EmptyScope
                label="Higgsfield Presets"
                note="this preset source tab exists in the live product (tab node 333) but its cards were not captured in the evidence survey."
              />
            ) : (
              <EmptyScope
                label="Community Trends"
                note="this preset source tab exists in the live product (tab node 337) but its cards were not captured in the evidence survey."
              />
            )}
          </div>
        ) : (
          <EmptyScope
            label="History"
            note="the History page view exists in the live product (tab node 307) but no history surface was captured — and no influencer jobs exist in this build."
          />
        )}

        <Card className="border-border bg-card">
          <CardContent className="p-4 text-xs leading-relaxed text-muted-foreground">
            Structure captured from the live AI Influencer studio (2026-10-17 evidence survey). The
            character builder on the left is fully interactive client-side state; every uncaptured
            flow (character sheets, recreate, motion presets, generation) is visibly scoped rather
            than faked.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
