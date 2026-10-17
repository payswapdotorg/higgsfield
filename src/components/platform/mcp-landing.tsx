"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  MessageSquare,
  Plug,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SiteFooter } from "@/components/platform/site-footer";
import { cn } from "@/lib/utils";

/**
 * /mcp — the MCP landing page body (public).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-mcp.json (1476 a11y
 * nodes; root 7138 "Higgsfield MCP | AI Image & Video Generation for Any
 * Agent"). Nodes used:
 * - hero region 7236 + heading 7261 'GENERATE IMAGES & VIDEOS IN CHATGPT WITH
 *   HIGGSFIELD' (lines 7262/7263/7265/7267).
 * - install tabs 7237-7257: 'ChatGPT Plugin' / 'Claude' / 'Claude Code' /
 *   'Telegram' / 'CLI' / 'Other'; captured panel: link 7268 'Install
 *   Higgsfield plugin', button 7271 'How to connect?', button 7274 'Copy
 *   connector URL', StaticText 7276 'https://mcp.higgsfield.ai/mcp'.
 * - demo slides region 7291: tabs 7279 'Generate video' / 7283 'Generate
 *   image' / 7287 'Edit a photo'; captured panel: heading 7294 'Generate a
 *   cinematic video', '@Higgsfield' 7297, prompt 7298 (truncated in the
 *   capture), link 7299 'Try in ChatGPT', button 7302 'Copy prompt', button
 *   7292 'Unmute video'.
 * - skill presets region 7277: heading 7420 'Discover what you can create';
 *   filter group 8972 'Filter presets' (buttons 7426-7450: Popular / Paid Ads
 *   / Motion Design / Marketing / Production / UGC / Faceless / For After
 *   Effects / For Blender); 7 preset cards 7457-7556 with slugs ('katana',
 *   'ugc-flow', …), blurbs, category chips and 'Try in ChatGPT' links.
 * - model marquee region 7559: heading 7560 'EVERY CREATIVE MODEL, INSIDE
 *   CHATGPT' + subtitle 7565 + model names 7569-7601.
 * - site footer (sectionfooter 7602): heading 7603 'AI-NATIVE CREATIVE SUITE'
 *   — rendered by the shared src/components/platform/site-footer.tsx
 *   (captured identically on /mcp and /academy).
 *
 * Clone-side adaptations (disclosed in docs/wave-3c-worker-worklog.md):
 * - install CTAs ('Install Higgsfield plugin', 'How to connect?', 'Try in
 *   ChatGPT', 'Unmute video') are uncaptured fnf flows → disabled + scoped;
 *   'Copy connector URL' / 'Copy prompt' are real clipboard copies of the
 *   captured strings;
 * - only the ChatGPT Plugin install panel and the 'Generate video' demo
 *   panel were captured — the other tabs render visible not-captured notes;
 * - preset filter chips wire the captured per-preset category chips;
 *   categories with no captured presets ('For After Effects', 'For Blender')
 *   render an honest empty state;
 * - footer links point only at clone surfaces that exist (see
 *   site-footer.tsx); every other entry is inert text (live hrefs were not
 *   captured — same policy as the 3A registry href rule);
 * - the model marquee renders as a static chip row (no animation).
 */

const CONNECTOR_URL = "https://mcp.higgsfield.ai/mcp"; // ev: StaticText 7276

/** ev: install tabs 7237-7257 (tab + StaticText pairs). */
const INSTALL_TARGETS = ["ChatGPT Plugin", "Claude", "Claude Code", "Telegram", "CLI", "Other"] as const;

/** ev: demo slides tabs 7279/7283/7287. */
const DEMO_TABS = ["Generate video", "Generate image", "Edit a photo"] as const;

/** ev: demo prompt 7298 (truncated at 110 chars in the capture). */
const DEMO_PROMPT =
  "Make a 14-second video of a young woman with dark hair in a pixie cut, wearing a green crop top and a grey mid…";

/** ev: filter group 8972 buttons 7426-7450. */
const PRESET_FILTERS = [
  "Popular",
  "Paid Ads",
  "Motion Design",
  "Marketing",
  "Production",
  "UGC",
  "Faceless",
  "For After Effects",
  "For Blender",
] as const;

interface McpPreset {
  slug: string;
  name: string;
  isNew?: boolean;
  blurb: string;
  categories: string[];
}

/** ev: preset cards 7457-7556 — slugs/chips/blurbs verbatim from the capture. */
const PRESETS: McpPreset[] = [
  // ev: 7455/7457/7458/7459 'katana' — chips 7465 'Production', 7467 'Motion Design', blurb 7461, Try 7470.
  {
    slug: "katana",
    name: "Recreate aura edits",
    isNew: true,
    blurb:
      "Turn your footage into an aura edit, or recreate a reference with your own subject, pacing, transitions, and visual style.",
    categories: ["Production", "Motion Design"],
  },
  // ev: 7472/7474/7475 'ugc-flow' — chip 7481 'UGC', blurb 7477, Try 7482.
  {
    slug: "ugc-flow",
    name: "Product review UGC",
    blurb: "Create a creator-style product review from your product brief and reference images.",
    categories: ["UGC"],
  },
  // ev: 7486/7488/7489 'marketing-adapt-video' — chip 7495 'Paid Ads', blurb 7491, Try 7496.
  {
    slug: "marketing-adapt-video",
    name: "Ad Recreator",
    blurb: "Turn a reference video’s storytelling and sales structure into an original video ad for your product.",
    categories: ["Paid Ads"],
  },
  // ev: 7500/7502/7503 'marketing-research-to-ads' — chip 7509 'Paid Ads', blurb 7505, Try 7510.
  {
    slug: "marketing-research-to-ads",
    name: "Ad Strategist",
    blurb:
      "Turn product and competitor research into static ads tailored to your market. Explore different angles grounded in your positioning.",
    categories: ["Paid Ads"],
  },
  // ev: 7514/7516/7517 'marketing-hook-variants' — chip 7523 'Paid Ads', blurb 7519, Try 7524.
  {
    slug: "marketing-hook-variants",
    name: "Hook Multiplier",
    blurb:
      "Give one video multiple opening hooks. Get complete edited versions ready to test different ways of grabbing attention.",
    categories: ["Paid Ads"],
  },
  // ev: 7528/7530/7531 'vox-mixed-media' — chips 7537 'Marketing', 7539 'Faceless', blurb 7533, Try 7540.
  {
    slug: "vox-mixed-media",
    name: "Editorial Motion Graphics",
    blurb: "Explain a story using editorial motion graphics and mixed visual media.",
    categories: ["Marketing", "Faceless"],
  },
  // ev: 7544/7546/7547 'stickman-explainer' — chips 7553 'Marketing', 7555 'Faceless', blurb 7549, Try 7556.
  {
    slug: "stickman-explainer",
    name: "Stickman cartoon",
    blurb: "Turn a story or concept into an animated explainer with simple stickman characters.",
    categories: ["Marketing", "Faceless"],
  },
];

/** ev: model marquee names 7569-7601. */
const MARQUEE_MODELS = [
  "Nano Banana Pro",
  "Google Omni Flash",
  "Seedance 2.5",
  "Seedream 5.0 Lite",
  "Seedance 2.0",
  "Kling 3",
  "GPT Image 2.5",
  "Soul 2.0",
];

function useCopied(): [string | null, (key: string, text: string) => () => void] {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => () => {
    void navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1600);
    });
  };
  return [copied, copy];
}

function NotCapturedPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
      The {label} install panel was not captured in the 2026-10-17 evidence survey — nothing is rendered
      or faked here.
    </div>
  );
}

export function McpLanding() {
  const [installTarget, setInstallTarget] = useState<string>("ChatGPT Plugin");
  const [demoTab, setDemoTab] = useState<string>("Generate video");
  const [filter, setFilter] = useState<string>("Popular");
  const [copied, copy] = useCopied();

  const visiblePresets =
    filter === "Popular"
      ? PRESETS
      : PRESETS.filter((p) => p.categories.includes(filter));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 py-2 lg:py-4">
      {/* Hero — ev: region 7236 + heading 7261 (lines 7262/7263/7265/7267) */}
      <header className="space-y-6">
        <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
          GENERATE IMAGES &amp; VIDEOS IN CHATGPT WITH HIGGSFIELD
        </h1>

        {/* Install panel — ev: tabs 7237-7257; captured CTAs 7268/7271/7274/7276 */}
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-6">
          <div
            role="tablist"
            aria-label="Install target"
            className="flex flex-wrap items-center gap-1"
          >
            {INSTALL_TARGETS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={installTarget === t}
                onClick={() => setInstallTarget(t)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  installTarget === t
                    ? "bg-[var(--signal)] text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {installTarget === "ChatGPT Plugin" ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-2">
                {/* ev: link 7268 — install flow uncaptured → visibly scoped */}
                <span title="Install flow not captured — no fake action" className="block">
                  <Button disabled className="gap-1.5">
                    <Plug className="h-4 w-4" aria-hidden />
                    Install Higgsfield plugin
                  </Button>
                </span>
                <p className="text-xs text-muted-foreground">
                  The plugin install flow was not captured in the evidence survey — this button is
                  intentionally inert.
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="flex items-center gap-2">
                  <code className="rounded-lg border border-border bg-muted px-3 py-2 text-xs">
                    {CONNECTOR_URL}
                  </code>
                  {/* ev: button 7274 'Copy connector URL' — real clipboard copy of 7276 */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copy("connector", CONNECTOR_URL)}
                    className="gap-1.5"
                  >
                    {copied === "connector" ? (
                      <Check className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                    )}
                    {copied === "connector" ? "Copied" : "Copy connector URL"}
                  </Button>
                </div>
                {/* ev: button 7271 'How to connect?' — uncaptured → scoped */}
                <span title="Connection guide not captured" className="block">
                  <Button variant="ghost" size="sm" disabled className="gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                    How to connect?
                  </Button>
                </span>
              </div>
            </div>
          ) : (
            <NotCapturedPanel label={installTarget} />
          )}
        </div>
      </header>

      {/* Demo slides — ev: region 7291 'Demo slides', tabs 7279/7283/7287 */}
      <section aria-label="Demo slides" className="space-y-4">
        <div
          role="tablist"
          aria-label="Demo"
          className="flex w-max items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {DEMO_TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={demoTab === t}
              onClick={() => setDemoTab(t)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                demoTab === t
                  ? "bg-[var(--signal)] text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {demoTab === "Generate video" ? (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {/* ev: button 7292 'Unmute video' — no media captured → scoped overlay chip */}
            <div className="relative flex aspect-video items-center justify-center bg-gradient-to-br from-[var(--signal)]/20 via-card to-muted">
              <span title="Demo video not captured" className="absolute right-3 top-3">
                <Button variant="secondary" size="sm" disabled className="gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" aria-hidden />
                  Unmute video
                </Button>
              </span>
              <div className="max-w-md space-y-3 p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">
                  Demo video placeholder
                </p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  The live hero autoplays a demo clip that was not captured; the captured chat
                  transcript is reproduced below instead.
                </p>
              </div>
            </div>
            <div className="space-y-3 p-4 sm:p-6">
              {/* ev: heading 7294 'Generate a cinematic video' */}
              <h2 className="text-lg font-bold tracking-tight">Generate a cinematic video</h2>
              <div className="space-y-2 rounded-lg border border-border bg-muted/40 p-3">
                <p className="text-xs font-semibold text-muted-foreground">@Higgsfield</p>
                {/* ev: prompt StaticText 7298 (truncated in the capture — ellipsis marks it) */}
                <p className="text-sm leading-relaxed">{DEMO_PROMPT}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {/* ev: link 7299 'Try in ChatGPT' — uncaptured target → scoped */}
                <span title="Try-in-ChatGPT flow not captured">
                  <Button disabled className="gap-1.5">
                    <ArrowRight className="h-4 w-4" aria-hidden />
                    Try in ChatGPT
                  </Button>
                </span>
                {/* ev: button 7302 'Copy prompt' — real clipboard copy of 7298 */}
                <Button
                  variant="outline"
                  onClick={copy("prompt", DEMO_PROMPT)}
                  className="gap-1.5"
                >
                  {copied === "prompt" ? (
                    <Check className="h-3.5 w-3.5" aria-hidden />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {copied === "prompt" ? "Copied" : "Copy prompt"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
            The “{demoTab}” demo slide was not captured in the evidence survey — nothing is rendered
            or faked here.
          </div>
        )}
      </section>

      {/* Skill presets — ev: region 7277, heading 7420, filter group 8972, cards 7457-7556 */}
      <section aria-label="Skill presets" className="space-y-5">
        <h2 className="text-2xl font-bold tracking-tight">Discover what you can create</h2>
        <div
          role="group"
          aria-label="Filter presets"
          className="flex flex-wrap items-center gap-1.5"
        >
          {PRESET_FILTERS.map((f) => (
            <button
              key={f}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                filter === f
                  ? "border-[var(--signal)]/60 bg-[var(--signal)]/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visiblePresets.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4"
              aria-label={`Preset: ${p.name}`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold leading-tight">{p.name}</h3>
                {p.isNew && (
                  /* ev: StaticText 7459 'New' on the katana card */
                  <Badge className="gap-1 px-2 text-[10px] font-semibold uppercase tracking-wide">
                    <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
                    new
                  </Badge>
                )}
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">{p.blurb}</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {p.categories.map((c) => (
                  <Badge key={c} variant="secondary" className="px-2 text-[10px] font-medium">
                    {c}
                  </Badge>
                ))}
                <code className="ml-auto text-[10px] text-muted-foreground/70">/{p.slug}</code>
              </div>
              {/* ev: 'Try in ChatGPT' links (e.g. 7470) — uncaptured targets → scoped */}
              <span title="Try-in-ChatGPT flow not captured" className="mt-auto block">
                <Button variant="secondary" size="sm" disabled className="w-full gap-1.5">
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                  Try in ChatGPT
                </Button>
              </span>
            </article>
          ))}
        </div>

        {visiblePresets.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-card/60 p-4 text-sm text-muted-foreground">
            No presets were captured in the “{filter}” category in the 2026-10-17 survey — the live
            category exists, its cards do not exist in the capture, and none are invented here.
          </p>
        )}
      </section>

      {/* Model marquee — ev: region 7559, heading 7560, subtitle 7565, names 7569-7601 */}
      <section aria-label="Every creative model, inside ChatGPT" className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight lg:text-3xl">
          EVERY CREATIVE MODEL, INSIDE CHATGPT
        </h2>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Give ChatGPT access to the most powerful image and video models.
        </p>
        <div className="flex flex-wrap gap-2">
          {MARQUEE_MODELS.map((m) => (
            <span
              key={m}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground/80"
            >
              {m}
            </span>
          ))}
        </div>
      </section>

      {/* Site footer sitemap — ev: sectionfooter 7602, heading 7603 'AI-NATIVE CREATIVE SUITE' */}
      <SiteFooter />
    </div>
  );
}
