"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BadgeDollarSign,
  BookOpen,
  Braces,
  ChartLine,
  ChevronDown,
  ChevronUp,
  CircleDollarSign,
  Filter,
  Image as ImageIcon,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  Search,
  Sparkles,
  Video,
  Wallet,
  Workflow,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  WORKFLOWS,
  modelHue,
  type RegistryModel,
  type RegistryWorkflow,
} from "@/lib/model-registry";

/**
 * /api-docs — the Open Platform page body (public).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-api.json (2577 a11y
 * nodes; root 10705 "Open Higgsfield AI | Official Higgsfield API Platform").
 * Nodes used here:
 * - platform chrome: image 10709 'Higgsfield' + StaticText 10710 'Higgsfield
 *   API'; sidebar complementary 10707 'Primary navigation' with links 10716
 *   'Dashboard', 10719 'Explore models', 10722 'Quick start', 10725
 *   'Documentation', 10729 'Pricing UP TO 75% OFF' (StaticTexts 10731/10733),
 *   button 10734 'Playground', links 10737 'API keys', 10740 'Cashback',
 *   10743 'Analytics', 10746 'Billing'; top links 10749 'Contact sales',
 *   10752 'Status', 10755 'Pricing', 10758 'Log in'.
 * - cashback banner: StaticTexts 11099 'ENDS ' + 11100 'SEP 30 23:59 UTC' +
 *   11102 'UP TO $200,000 FREE'; heading 11103 'GET 100% CASHBACK ON API
 *   SPENDINGS'; link 11107 'Sign up'.
 * - featured strip: region 10763 'Featured models' + group 11119 'Select
 *   featured model' + Show buttons 11120-11124 + link 11087 'Explore
 *   Seedance 2.5'; featured card headings 11173/11201/11227/11252/11277/
 *   11302/11326/11353 (8 cards).
 * - tabs 11127 'All models' / 11131 'Image' / 11135 'Video'; searchbox 10696
 *   'Search models'; Filter button 11142.
 * - sections: heading/link 11364/11365 'Show all Image models' + subtitle
 *   11369 + group 11374 'Image models' + paging 11370/11372; 11630/11631
 *   'Show all Video models' + 11635 + 11640 + 11636/11638; region 12002
 *   'Workflows Launch ads and campaigns' + heading 12003 + StaticText 12006
 *   'Launch ads and campaigns' + group 12011 'Workflows and agents' +
 *   paging 12007/12009.
 * Model/workflow card data is imported from src/lib/model-registry.ts
 * (wave-3A, extracted from the same capture; per-entry citations there).
 *
 * Clone-side adaptations (disclosed in docs/wave-3c-worker-worklog.md):
 * - route renamed /api → /api-docs (Next.js route-handler namespace);
 * - the live sidebar is a docs-app rail; here it renders as an in-page
 *   navigation column. Entries whose docs surfaces were NOT captured
 *   (Dashboard / Quick start / Documentation / Playground / API keys /
 *   Cashback / Analytics / Billing / Contact sales / Status) are visibly
 *   scoped disabled stubs, not fake links;
 * - the live paged horizontal carousels render as flat grids with a
 *   Show all / Show previous toggle (collapsed = 6 cards, clone-side count);
 * - card hrefs link to /explore (the clone model-catalog surface) per the
 *   wave-3C order.
 */

/** Collapsed grid shows the first N cards per section (clone-side count). */
const COLLAPSED_CARDS = 6;

type KindTab = "all" | "image" | "video";

interface DocNavItem {
  label: string;
  note?: string;
  badge?: string;
  href?: string;
  icon: React.ReactNode;
}

/** ev: sidebar links 10716-10746 + top links 10749-10758. */
const DOC_NAV: DocNavItem[] = [
  { label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Explore models", href: "/explore", icon: <Search className="h-4 w-4" aria-hidden /> },
  { label: "Quick start", icon: <Zap className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Documentation", icon: <BookOpen className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Pricing", badge: "UP TO 75% OFF", href: "/pricing", icon: <BadgeDollarSign className="h-4 w-4" aria-hidden /> },
  { label: "Playground", icon: <Braces className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "API keys", icon: <KeyRound className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Cashback", icon: <CircleDollarSign className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Analytics", icon: <ChartLine className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
  { label: "Billing", icon: <Wallet className="h-4 w-4" aria-hidden />, note: "Docs surface not captured" },
];

/** ev: featured carousel headings 11173, 11201, 11227, 11252, 11277, 11302, 11326, 11353. */
const FEATURED: { vendor: string; name: string; kind: "image" | "video" }[] = [
  { vendor: "bytedance", name: "Seedance 2.5", kind: "video" },
  { vendor: "higgsfield", name: "Genjutsu", kind: "video" },
  { vendor: "kling", name: "Kling 3.0", kind: "video" },
  { vendor: "minimax", name: "MiniMax H3", kind: "video" },
  { vendor: "alibaba", name: "Wan 3.0 Prime", kind: "video" },
  { vendor: "higgsfield", name: "Marketing Studio Image", kind: "image" },
  { vendor: "bytedance", name: "Seedance 2.0", kind: "video" },
  { vendor: "higgsfield", name: "AI Influencer", kind: "image" },
];

/**
 * The live "Workflows" region (group 12011) carries 6 cards: the 5 exported
 * by the wave-3A registry plus a Cinema Studio 4.0 workflow card
 * (link 12067 'higgsfield / Cinema Studio 4.0', heading 12069, blurb 12074,
 * price 14409 'from $0.206 per second') — added here so the section matches
 * the capture without editing the 3A registry file.
 */
const API_WORKFLOWS: RegistryWorkflow[] = [
  ...WORKFLOWS,
  {
    slug: "cinema-studio-4-workflow",
    vendor: "higgsfield",
    name: "Cinema Studio 4.0",
    blurb: "Cinematic video generation with automatic scene direction and optional references",
    priceNote: "from $0.206 per second",
    exclusive: true,
    href: "/explore",
  },
];

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

/** Docs-style model card — links to /explore per the wave-3C order. */
function ModelCard({ model }: { model: RegistryModel }) {
  return (
    <article
      className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
      aria-label={`${model.vendor} / ${model.name}`}
    >
      <Link href="/explore" className="block focus-visible:outline-none">
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
          {model.priceNote && <p className="text-[11px] tabular-nums text-muted-foreground/80">{model.priceNote}</p>}
        </div>
      </Link>
    </article>
  );
}

function WorkflowCard({ workflow }: { workflow: RegistryWorkflow }) {
  return (
    <article
      className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/25"
      aria-label={`${workflow.vendor ? `${workflow.vendor} / ` : ""}${workflow.name}`}
    >
      <Link href="/explore" className="block focus-visible:outline-none">
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
          {workflow.priceNote && <p className="text-[11px] tabular-nums text-muted-foreground/80">{workflow.priceNote}</p>}
        </div>
      </Link>
    </article>
  );
}

interface SectionState {
  id: string;
  heading: string;
  subtitle: string;
  models: RegistryModel[];
  expandLabel: string;
  collapseLabel: string;
}

function CatalogSection({ section }: { section: SectionState }) {
  const [expanded, setExpanded] = useState(false);
  const canToggle = section.models.length > COLLAPSED_CARDS;
  const visible = expanded || !canToggle ? section.models : section.models.slice(0, COLLAPSED_CARDS);

  return (
    <section aria-label={section.heading} className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight lg:text-2xl">{section.heading}</h2>
        <p className="text-sm text-muted-foreground">{section.subtitle}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((m) => (
          <ModelCard key={m.slug} model={m} />
        ))}
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
              {section.collapseLabel}
            </>
          ) : (
            <>
              <ChevronDown className="mr-1 h-4 w-4" aria-hidden />
              {section.expandLabel}
            </>
          )}
        </Button>
      )}
    </section>
  );
}

export function ApiPlatformLanding() {
  const [tab, setTab] = useState<KindTab>("all");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();
  const filterModels = (models: RegistryModel[]) =>
    q ? models.filter((m) => `${m.vendor} ${m.name} ${m.blurb}`.toLowerCase().includes(q)) : models;

  // Small static catalogs (≤24 entries) — plain derived values, no memo needed.
  const imageModels = filterModels(IMAGE_MODELS);
  const videoModels = filterModels(VIDEO_MODELS);
  const workflows = q
    ? API_WORKFLOWS.filter((w) => `${w.vendor ?? ""} ${w.name} ${w.blurb}`.toLowerCase().includes(q))
    : API_WORKFLOWS;

  const resultCount = imageModels.length + videoModels.length + workflows.length;

  return (
    <div className="mx-auto w-full max-w-7xl gap-8 space-y-8 py-2 lg:grid lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10 lg:space-y-0 lg:py-4">
      {/* Platform docs navigation — ev: complementary 10707 'Primary navigation' (10716-10746) */}
      <aside aria-label="Platform navigation" className="space-y-3 lg:sticky lg:top-20 lg:self-start">
        <div className="flex items-center gap-2 px-1">
          {/* ev: image 10709 'Higgsfield' + StaticText 10710 'Higgsfield API' */}
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Braces className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-sm font-semibold tracking-wide">Higgsfield API</span>
        </div>
        <nav className="space-y-1">
          {DOC_NAV.map((item) => {
            if (item.href) {
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
                >
                  {item.icon}
                  {item.label}
                  {item.badge && (
                    <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--signal)]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            }
            return (
              <span
                key={item.label}
                title={item.note}
                className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60"
                aria-label={`${item.label} — docs surface not captured in this clone`}
              >
                {item.icon}
                {item.label}
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold uppercase tracking-wide text-[var(--signal)]/70">
                    {item.badge}
                  </span>
                )}
              </span>
            );
          })}
          <div className="my-2 border-t border-border" />
          {/* ev: top links 10749 'Contact sales', 10752 'Status', 10755 'Pricing', 10758 'Log in' */}
          <Link
            href="/pricing"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent hover:text-foreground"
          >
            <LifeBuoy className="h-4 w-4" aria-hidden />
            Pricing
          </Link>
          <span
            title="Live pages Contact sales / Status / Log in were not captured"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/60"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            Log in
          </span>
        </nav>
      </aside>

      <div className="min-w-0 space-y-10">
        {/* Hero — ev: RootWebArea 10705 'Open Higgsfield AI | Official Higgsfield API Platform' */}
        <header className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--signal)]">
            Higgsfield API
          </p>
          <h1 className="text-3xl font-bold tracking-tight lg:text-4xl">Open Higgsfield AI</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            The official Higgsfield API platform — every image and video model behind the studio, with
            workflows and per-output pricing notes.
          </p>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground/80">
            Route note: the live product serves this page at <code className="rounded bg-muted px-1 py-0.5">/api</code>;
            this build reserves that segment for its API route handlers, so the page lives at{" "}
            <code className="rounded bg-muted px-1 py-0.5">/api-docs</code>.
          </p>
        </header>

        {/* Cashback banner — ev: 11099/11100/11102/11103 + link 11107 'Sign up' */}
        <section
          aria-label="Cashback banner"
          className="overflow-hidden rounded-xl border border-[var(--signal)]/30 bg-gradient-to-br from-[var(--signal)]/15 via-card to-card"
        >
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--signal)]">
                ENDS SEP 30 23:59 UTC · UP TO $200,000 FREE
              </p>
              <h2 className="text-xl font-bold tracking-tight lg:text-2xl">
                GET 100% CASHBACK ON API SPENDINGS
              </h2>
            </div>
            <Button asChild size="lg" className="shrink-0">
              <Link href="/">Sign up</Link>
            </Button>
          </div>
        </section>

        {/* Featured models strip — ev: region 10763 'Featured models', group 11119,
            Show buttons 11120-11124, 'Explore Seedance 2.5' link 11087 */}
        <section aria-label="Featured models" className="space-y-3">
          <h2 className="text-lg font-bold tracking-tight">Featured models</h2>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-slim">
            {FEATURED.map((f) => (
              <Link
                key={`${f.vendor}-${f.name}`}
                href="/explore"
                className="flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-foreground/25 hover:bg-accent"
              >
                {f.kind === "image" ? (
                  <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                ) : (
                  <Video className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                )}
                <span className="text-xs uppercase tracking-wider text-muted-foreground">{f.vendor}</span>
                <span aria-hidden className="text-xs text-muted-foreground">/</span>
                {f.name}
              </Link>
            ))}
          </div>
        </section>

        {/* Catalog controls — ev: tabs 11127/11131/11135, searchbox 10696, Filter button 11142 */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div
            role="tablist"
            aria-label="Model catalog filter"
            className="flex w-max items-center gap-1 rounded-full border border-border bg-card p-1"
          >
            {(
              [
                { key: "all", label: "All models" },
                { key: "image", label: "Image" },
                { key: "video", label: "Video" },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={tab === t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  tab === t.key
                    ? "bg-[var(--signal)] text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              aria-label="Search models"
              className="pl-9"
            />
          </div>
          <span title="Live filter panel was not captured" aria-label="Filter — live panel not captured">
            <Button variant="outline" size="sm" disabled className="gap-1.5">
              <Filter className="h-3.5 w-3.5" aria-hidden />
              Filter
            </Button>
          </span>
        </div>

        {q && (
          <p className="text-xs tabular-nums text-muted-foreground" role="status">
            {resultCount} result{resultCount === 1 ? "" : "s"} for “{query.trim()}”
          </p>
        )}

        {/* Image models — ev: group 11374, subtitle 11369, toggle 11364/11365, paging 11370/11372 */}
        {tab !== "video" && (
          <CatalogSection
            section={{
              id: "image",
              heading: "Image models",
              subtitle: "Explore the latest in text-to-image generation",
              models: imageModels,
              expandLabel: "Show all Image models",
              collapseLabel: "Show previous Image models",
            }}
          />
        )}

        {/* Video models — ev: group 11640, subtitle 11635, toggle 11630/11631, paging 11636/11638 */}
        {tab !== "image" && (
          <CatalogSection
            section={{
              id: "video",
              heading: "Video models",
              subtitle: "Turn prompts, stills and storyboards into moving footage",
              models: videoModels,
              expandLabel: "Show all Video models",
              collapseLabel: "Show previous Video models",
            }}
          />
        )}

        {/* Workflows — ev: heading 12003 'Workflows', StaticText 12006 'Launch ads and
            campaigns', group 12011 'Workflows and agents', paging 12007/12009 */}
        <section aria-label="Workflows" className="space-y-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight lg:text-2xl">Workflows</h2>
            <p className="text-sm text-muted-foreground">Launch ads and campaigns</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {workflows.map((w) => (
              <WorkflowCard key={w.slug} workflow={w} />
            ))}
          </div>
        </section>

        {/* Docs/code affordances — disclosed stub (no captured docs content beyond nav headings) */}
        <section
          aria-label="Docs scope note"
          className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 sm:p-6"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-500">
            <BookOpen className="h-4 w-4" aria-hidden />
            Demo scope — platform docs surfaces not captured
          </p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The 2026-10-17 survey captured the platform page itself (model catalog, workflows, cashback
            banner, docs navigation) but none of the linked docs pages — Quick start, Documentation,
            Playground, API keys, Cashback, Analytics and Billing have no captured content, so no code
            samples or doc bodies are rendered here. Those nav entries above are visibly scoped for the
            same reason.
          </p>
        </section>

        <footer className="border-t border-border pt-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Catalog data captured from the live platform page (2026-10-17 evidence survey). Pricing lines
            are the captured platform notes, not this build&rsquo;s credit costs. Cards link to the clone&rsquo;s{" "}
            <Link href="/explore" className="underline hover:text-foreground">
              model catalog
            </Link>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
