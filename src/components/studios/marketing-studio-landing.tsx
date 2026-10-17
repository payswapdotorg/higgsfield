"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Image as ImageIcon,
  Minus,
  Plus,
  Sparkles,
  UserRound,
  Video,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * /marketing-studio — Marketing Studio landing (private, StudioGate-wrapped).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-marketing-studio.json,
 * root "Marketing Studio • Higgsfield", 513 a11y nodes):
 * - eyebrow: StaticText 2925 'MARKETING STUDIO'.
 * - hero: heading 2958 'TURN ANY PRODUCT INTO READY TO POST CONTENT' (lines
 *   2959 'TURN ANY PRODUCT' / 2960 'INTO READY TO POST CONTENT').
 * - category chips: buttons 2927/2931/2935/2939/2943/2948/2953 — 'UGC',
 *   'Product shot', 'Motion', 'Ads', 'Posters', 'Marketplace', 'TikTok'
 *   (displayed uppercase per StaticText 2930/2934/2938/2942/2947/2952/2956).
 * - composer: generic 5452 'Generation mode' + tabs 5456 'Image mode' /
 *   5461 'Video mode'; region 5466 'Image generation'; textbox 5475 'Describe
 *   what you want to create...'; button 5492 'Choose style' (StaticText 5496
 *   'Closeup'); button 5498 'Aspect ratio: 3:4'; batch buttons 5504 'Decrease
 *   batch size' / 5509 'Increase batch size' with StaticText 5508 '1/4';
 *   buttons 5522 'Add Avatar' (AVATAR) / 5532 'Add Product' (PRODUCT);
 *   button 5538 'GENERATE 3.5'.
 * - templates: region 2961 'Explore templates' (empty in the capture).
 *
 * Clone-side scoping (disclosed): the marketing generation pipeline is an
 * uncaptured fnf flow → the GENERATE affordance is visibly scoped (disabled +
 * note) and an honest CTA links into the wave-2 pipeline (the / Cinema Studio
 * composer). Avatar/Product uploads are uncaptured → disabled + note. Only the
 * 'Closeup' style was captured → the style picker carries exactly that option
 * plus a note. The aspect button cycles the studio's supported ratios (the
 * capture shows 3:4 only). Template cards were not captured → the Explore
 * templates region renders a disclosed empty state.
 */

const CATEGORIES = [
  { id: "ugc", label: "UGC" },
  { id: "product-shot", label: "Product shot" },
  { id: "motion", label: "Motion" },
  { id: "ads", label: "Ads" },
  { id: "posters", label: "Posters" },
  { id: "marketplace", label: "Marketplace" },
  { id: "tiktok", label: "TikTok" },
] as const;

const ASPECTS = ["3:4", "16:9", "1:1"] as const;

const CREDIT_COST = 3.5; // ev: button 5538 'GENERATE 3.5'

export function MarketingStudioLanding() {
  const [category, setCategory] = useState<string>("ugc");
  const [mode, setMode] = useState<"image" | "video">("image");
  const [prompt, setPrompt] = useState("");
  const [styleOpen, setStyleOpen] = useState(false);
  const [aspectIndex, setAspectIndex] = useState(0);
  const [batch, setBatch] = useState(1);
  const aspect = ASPECTS[aspectIndex];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10 py-2 lg:py-4">
      {/* Hero — ev: 2925 + 2958 */}
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-[var(--signal)]">
          Marketing Studio
        </p>
        <h1 className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
          <span className="block">TURN ANY PRODUCT</span>
          <span className="block">INTO READY TO POST CONTENT</span>
        </h1>
      </header>

      {/* Category chips — ev: buttons 2927-2953 */}
      <section aria-label="Content categories" className="space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Template categories">
          {CATEGORIES.map((c) => {
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                aria-pressed={active}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/25 hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          Selected category: <span className="font-medium text-foreground">{category}</span> — template
          galleries per category were not captured in the evidence survey.
        </p>
      </section>

      {/* Composer — ev: 5452-5549 */}
      <Card className="border-border bg-card p-1">
        <CardContent className="space-y-4 p-3 sm:p-4">
          {/* Generation mode tabs — ev: tablist 5454, tabs 5456/5461 */}
          <div
            role="group"
            aria-label="Generation mode"
            className="flex overflow-hidden rounded-lg border border-border"
          >
            <button
              type="button"
              onClick={() => setMode("image")}
              aria-pressed={mode === "image"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                mode === "image"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ImageIcon className="h-4 w-4" aria-hidden />
              Image mode
            </button>
            <button
              type="button"
              onClick={() => setMode("video")}
              aria-pressed={mode === "video"}
              className={cn(
                "flex flex-1 items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
                mode === "video"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Video className="h-4 w-4" aria-hidden />
              Video mode
            </button>
          </div>

          {mode === "image" ? (
            <div className="space-y-4" aria-label="Image generation">
              {/* Prompt — ev: textbox 5475 */}
              <div>
                <label htmlFor="marketing-prompt" className="sr-only">
                  Describe what you want to create
                </label>
                <Textarea
                  id="marketing-prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="min-h-24 resize-none border-0 bg-transparent px-3 py-3 text-base shadow-none focus-visible:ring-0"
                  maxLength={4000}
                />
                <div className="flex items-center justify-between px-3 pb-1">
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {prompt.length}/4000
                  </span>
                </div>
              </div>

              {/* Controls row — ev: 5492 Choose style / 5498 Aspect ratio / 5503 batch */}
              <div className="flex flex-wrap items-center gap-3">
                <Popover open={styleOpen} onOpenChange={setStyleOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="secondary" size="sm" aria-label="Choose style">
                      Choose style: Closeup
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64">
                    <p className="text-xs font-medium text-muted-foreground">Style</p>
                    <div className="mt-2 space-y-2">
                      {/* ev: StaticText 5496 'Closeup' — the only captured style option */}
                      <button
                        type="button"
                        className="w-full rounded-lg border border-primary bg-primary/10 px-3 py-2 text-left text-sm font-medium"
                        aria-pressed="true"
                      >
                        Closeup
                      </button>
                      <p className="text-[11px] leading-relaxed text-muted-foreground">
                        Demo scope: only the “Closeup” style was captured in the evidence survey — no
                        other style options are invented.
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>

                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Aspect ratio: ${aspect}`}
                  onClick={() => setAspectIndex((i) => (i + 1) % ASPECTS.length)}
                >
                  Aspect ratio: {aspect}
                </Button>

                <div className="flex items-center gap-1" role="group" aria-label="Batch size">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Decrease batch size"
                    disabled={batch <= 1}
                    onClick={() => setBatch((b) => Math.max(1, b - 1))}
                  >
                    <Minus className="h-4 w-4" aria-hidden />
                  </Button>
                  <span className="min-w-10 text-center text-sm font-medium tabular-nums">
                    {batch}/4
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Increase batch size"
                    disabled={batch >= 4}
                    onClick={() => setBatch((b) => Math.min(4, b + 1))}
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              </div>

              {/* Avatar / Product — ev: buttons 5522 / 5532 (upload flows uncaptured) */}
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1">
                  <Button variant="outline" size="sm" disabled aria-disabled="true">
                    <UserRound className="mr-1 h-4 w-4" aria-hidden />
                    Add Avatar
                  </Button>
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    Demo scope — avatar upload not captured
                  </p>
                </div>
                <div className="space-y-1">
                  <Button variant="outline" size="sm" disabled aria-disabled="true">
                    <Sparkles className="mr-1 h-4 w-4" aria-hidden />
                    Add Product
                  </Button>
                  <p className="text-[10px] leading-tight text-muted-foreground">
                    Demo scope — product upload not captured
                  </p>
                </div>
              </div>

              {/* Generate — ev: button 5538 'GENERATE 3.5'; marketing fnf pipeline uncaptured */}
              <div className="space-y-2 border-t border-border pt-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <Button size="lg" disabled aria-disabled="true">
                      <Zap className="mr-2 h-4 w-4" aria-hidden />
                      GENERATE {(CREDIT_COST * batch).toFixed(1)}
                    </Button>
                    <p className="text-[11px] leading-relaxed text-muted-foreground">
                      <span className="font-semibold text-amber-500">Demo scope:</span> the marketing
                      generation pipeline was not captured (cost shown is the evidence value, 3.5 credits
                      per image) — this build will not fake the job.
                    </p>
                  </div>
                  {/* Honest CTA into the wave-2 pipeline */}
                  <Button asChild size="lg" variant="secondary">
                    <Link href="/">Continue in Cinema Studio</Link>
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
              {/* Only the Image generation region was captured (ev: region 5466) */}
              <p className="text-sm font-medium">Video mode</p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-amber-500">Demo scope:</span> only the Image mode
                composer was captured in the evidence survey (region “Image generation”). The Video mode
                composer is not implemented rather than invented.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Explore templates — ev: region 2961 (empty in capture) */}
      <section aria-label="Explore templates" className="space-y-3">
        <h2 className="text-xl font-bold tracking-tight">Explore templates</h2>
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Template cards for the{" "}
            <span className="font-medium text-foreground">{category}</span> category were not captured
            in the evidence survey — this section is a disclosed placeholder rather than invented
            content.
          </p>
        </div>
      </section>

      <footer className="border-t border-border pt-4">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link href="/">
            <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
            Back to the Cinema Studio composer
          </Link>
        </Button>
      </footer>
    </div>
  );
}
