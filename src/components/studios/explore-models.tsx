"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Image as ImageIcon, Sparkles, Video, Workflow } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MODEL_CATALOG } from "@/lib/catalog";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  WORKFLOWS,
  modelHue,
  type RegistryModel,
  type RegistryWorkflow,
} from "@/lib/model-registry";

/**
 * /explore — the model catalog surface (public, no SessionGate).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-api.json):
 * - hero: link 10719 'Explore models' (platform sidebar); nav 'Explore' link
 *   (inspect-ads-studio.json node 11764, inspect-ai-influencer-studio.json node 27).
 * - section headings: a11y groups 11374 'Image models' / 11640 'Video models';
 *   section subtitles StaticText 11369 'Explore the latest in text-to-image
 *   generation' and 11635 'Turn prompts, stills and storyboards into moving footage'.
 * - toggle pattern: heading/link 11364-11365 'Show all Image models', buttons
 *   11370/11372 'Show previous Image models' / 'Show more Image models';
 *   heading/link 11630-11631 'Show all Video models', buttons 11636/11638.
 * - card fields: link 'vendor / Model [N modes]', heading 'vendor / Model',
 *   paragraph blurb, price generic text, StaticText badges 'Image'/'Video'/
 *   'Higgsfield Exclusive'/'Workflow' (per-entry citations in model-registry.ts).
 * - workflows section: heading 12003 'Workflows' + group 12011 'Workflows and agents'.
 *
 * Clone-side adaptations (disclosed in docs/wave-3a-worker-worklog.md):
 * - the live surface is a horizontal paged carousel; this clone renders vertical
 *   vendor-grouped grids with a Show all / Show previous toggle per section
 *   (collapsed = first 4 vendor groups, clone-side count);
 * - the live /_private/explore surface itself was not captured — this page renders
 *   the model catalog from the platform page capture per the wave-3A packet;
 * - card hrefs are clone-side mappings to real clone surfaces only (see
 *   model-registry.ts href policy); non-linked cards are inert with a visible
 *   "catalog entry only" state — no fake links.
 */

/** Collapsed view shows the first N vendor groups per section (clone-side count). */
const COLLAPSED_VENDOR_GROUPS = 4;

function KindBadge({ kind }: { kind: "image" | "video" }) {
  return (
    <Badge
      variant="secondary"
      className="gap-1 bg-background/70 px-2 font-medium uppercase tracking-wide backdrop-blur-sm"
    >
      {kind === "image" ? <ImageIcon className="h-3 w-3" aria-hidden /> : <Video className="h-3 w-3" aria-hidden />}
      {kind}
    </Badge>
  );
}

function CardTile({ slug, children }: { slug: string; children: React.ReactNode }) {
  const hue = modelHue(slug);
  return (
    <div
      className="relative flex aspect-[3/2] items-start justify-end gap-1.5 p-3"
      style={{
        background: `linear-gradient(135deg, hsl(${hue} 65% 52% / 0.45), hsl(${(hue + 40) % 360} 65% 40% / 0.12))`,
      }}
    >
      {children}
    </div>
  );
}

function ModelCard({ model }: { model: RegistryModel }) {
  const catalogModel = model.catalogId ? MODEL_CATALOG[model.catalogId] : undefined;
  const cardBody = (
    <>
      <CardTile slug={model.slug}>
        <KindBadge kind={model.kind} />
        {model.exclusive && (
          <Badge className="gap-1 bg-background/70 px-2 font-medium backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
            Higgsfield Exclusive
          </Badge>
        )}
      </CardTile>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{model.vendor}</span>
          <span aria-hidden className="text-xs text-muted-foreground">/</span>
          <h3 className="text-sm font-semibold leading-tight">{model.name}</h3>
          {model.modes && (
            <Badge variant="outline" className="ml-auto px-1.5 tabular-nums text-[10px] font-normal">
              {model.modes} modes
            </Badge>
          )}
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{model.blurb}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground/80">{model.priceNote}</p>
        {catalogModel && (
          <Badge className="gap-1 rounded-full border border-[var(--signal)]/40 bg-[var(--signal)]/10 px-2 text-[11px] font-medium text-[var(--signal)] hover:bg-[var(--signal)]/10">
            <Sparkles className="h-3 w-3" aria-hidden />
            Generate in this build · {catalogModel.creditCost} credits
          </Badge>
        )}
      </div>
    </>
  );

  if (model.href) {
    return (
      <article
        className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
        aria-label={`${model.vendor} / ${model.name}`}
      >
        <Link href={model.href} className="block focus-visible:outline-none">
          {cardBody}
        </Link>
      </article>
    );
  }

  // No honest clone target: inert catalog entry (visible scoping, not a fake link).
  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card/60"
      aria-label={`${model.vendor} / ${model.name} — catalog entry only, not generate-able in this build`}
      title="Catalog entry only — this model is not wired to a generation surface in this build"
    >
      {cardBody}
      <div className="border-t border-dashed border-border px-4 py-2">
        <span className="text-[11px] text-muted-foreground">Catalog entry only — not yet wired in this clone</span>
      </div>
    </article>
  );
}

function WorkflowCard({ workflow }: { workflow: RegistryWorkflow }) {
  const inner = (
    <>
      <CardTile slug={workflow.slug}>
        <Badge variant="secondary" className="gap-1 bg-background/70 px-2 font-medium backdrop-blur-sm">
          <Workflow className="h-3 w-3" aria-hidden />
          Workflow
        </Badge>
        {workflow.exclusive && (
          <Badge className="gap-1 bg-background/70 px-2 font-medium backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-[var(--signal)]" aria-hidden />
            Higgsfield Exclusive
          </Badge>
        )}
      </CardTile>
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          {workflow.vendor && (
            <>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">{workflow.vendor}</span>
              <span aria-hidden className="text-xs text-muted-foreground">/</span>
            </>
          )}
          <h3 className="text-sm font-semibold leading-tight">{workflow.name}</h3>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">{workflow.blurb}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground/80">{workflow.priceNote}</p>
      </div>
    </>
  );

  if (workflow.href) {
    return (
      <article
        className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
        aria-label={`${workflow.vendor ? `${workflow.vendor} / ` : ""}${workflow.name}`}
      >
        <Link href={workflow.href} className="block focus-visible:outline-none">
          {inner}
        </Link>
      </article>
    );
  }

  return (
    <article
      className="overflow-hidden rounded-xl border border-border bg-card/60"
      aria-label={`${workflow.vendor ? `${workflow.vendor} / ` : ""}${workflow.name} — catalog entry only`}
      title="Catalog entry only — not wired in this build"
    >
      {inner}
      <div className="border-t border-dashed border-border px-4 py-2">
        <span className="text-[11px] text-muted-foreground">Catalog entry only — not yet wired in this clone</span>
      </div>
    </article>
  );
}

interface SectionState {
  models: RegistryModel[];
  heading: string;
  subtitle: string;
  toggleLabels: { expand: string; collapse: string };
}

function CatalogSection({ section }: { section: SectionState }) {
  const [expanded, setExpanded] = useState(false);

  const vendors: string[] = [];
  for (const m of section.models) {
    if (!vendors.includes(m.vendor)) vendors.push(m.vendor);
  }
  const visibleVendors = expanded || vendors.length <= COLLAPSED_VENDOR_GROUPS ? vendors : vendors.slice(0, COLLAPSED_VENDOR_GROUPS);
  const canToggle = vendors.length > COLLAPSED_VENDOR_GROUPS;

  return (
    <section aria-label={section.heading} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight lg:text-2xl">{section.heading}</h2>
        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
      </div>
      <div className="space-y-6">
        {visibleVendors.map((vendor) => {
          const vendorModels = section.models.filter((m) => m.vendor === vendor);
          return (
            <div key={vendor} className="space-y-3">
              <div className="flex items-center gap-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {vendor}
                </h3>
                <span className="text-[11px] tabular-nums text-muted-foreground/70">
                  {vendorModels.length} model{vendorModels.length === 1 ? "" : "s"}
                </span>
                <span aria-hidden className="h-px flex-1 bg-border" />
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {vendorModels.map((m) => (
                  <ModelCard key={m.slug} model={m} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {canToggle && (
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
          className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="mr-1 h-4 w-4" aria-hidden />
              {section.toggleLabels.collapse}
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" aria-hidden />
              {section.toggleLabels.expand}
            </>
          )}
        </Button>
      )}
    </section>
  );
}

export function ExploreModels() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-12 py-2 lg:py-4">
      {/* Hero — ev: 'Explore models' (inspect-api.json link 10719) + nav 'Explore' */}
      <header className="space-y-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">Explore</p>
        <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Explore models</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          The HF Studio model catalog — every vendor, image and video, in one place. Cards for models that
          are generate-able in this build link straight into the studio.
        </p>
      </header>

      {/* Image models — ev: group 11374 'Image models', StaticText 11369 subtitle */}
      <CatalogSection
        section={{
          models: IMAGE_MODELS,
          heading: "Image models",
          subtitle: "Explore the latest in text-to-image generation",
          toggleLabels: {
            expand: "Show all Image models",
            collapse: "Show previous Image models",
          },
        }}
      />

      {/* Video models — ev: group 11640 'Video models', StaticText 11635 subtitle */}
      <CatalogSection
        section={{
          models: VIDEO_MODELS,
          heading: "Video models",
          subtitle: "Turn prompts, stills and storyboards into moving footage",
          toggleLabels: {
            expand: "Show all Video models",
            collapse: "Show previous Video models",
          },
        }}
      />

      {/* Workflows — ev: heading 12003 'Workflows', group 12011 'Workflows and agents' */}
      <section aria-label="Workflows" className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight lg:text-2xl">Workflows</h2>
          <p className="text-sm text-muted-foreground">
            Preset pipelines that bundle models into ready-made creative flows.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {WORKFLOWS.map((w) => (
            <WorkflowCard key={w.slug} workflow={w} />
          ))}
        </div>
      </section>

      <footer className="border-t border-border pt-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Catalog data captured from the product&rsquo;s platform page (2026-10-17 evidence survey). Prices
          shown are the captured platform pricing notes, not this build&rsquo;s credit costs. Generate-able
          cards open the Cinema Studio composer — the studio does not take a model parameter in this build,
          so pick the model from its model picker.
        </p>
      </footer>
    </div>
  );
}
