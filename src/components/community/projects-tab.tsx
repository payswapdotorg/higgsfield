"use client";

import { Eye, Heart, FolderGit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { modelHue } from "@/lib/model-registry";

/**
 * Community "projects" tab — the OPEN PROJECTS section (HF-W3C C5).
 *
 * Evidence: evidence/rea-2026-10-17/surfaces/inspect-community.json (969 a11y
 * nodes) — region 3653 'OPEN PROJECTS'; heading 3655 + subtitle 3659
 * 'Standout projects making waves around the web'; filter group 3660 'Filter
 * projects' with buttons 3661 'Popular' / 3664 'Global Film Festival' / 3667
 * 'Higgsfield Originals'; 'See all' link 3670; 8 project cards (View buttons
 * 3675/3689/3703/3717/3731/3745/3759/3773, titles 3677/3691/3705/3719/3733/
 * 3747/3761/3775, author profile links 3678/3692/3706/3720/3734/3748/3762/
 * 3776, like counts 3685/3699/3713/3727/3741/3755/3769/3783, Like buttons
 * 3683/3697/3711/3725/3739/3753/3767/3781); 'Explore all projects' link 3810.
 *
 * Scope decision (per the wave-3C order): the live OPEN PROJECTS feed is an
 * editorially curated showcase — NOT a shape the clone's existing APIs serve
 * (folders are private containers; publications are per-generation shots).
 * The captured cards (title / author / like count) are therefore rendered as
 * a static evidence-based view — the same policy as the /effects catalog —
 * with a visible disclosure. The filter chips render inert (no filter
 * semantics were captured), and 'View' / 'Like' are uncaptured fnf flows →
 * visibly scoped.
 */

const FILTER_CHIPS = ["Popular", "Global Film Festival", "Higgsfield Originals"] as const;

const PROJECTS = [
  // ev: 3675/3677/3678/3685 — 'View Anime production - Launch video'.
  { title: "Anime production - Launch video", author: "higgsfield.launch", likes: 864 },
  // ev: 3689/3691/3692/3699.
  { title: "Nala - Heads Drop", author: "higgsfield.creative", likes: 906 },
  // ev: 3703/3705/3706/3713.
  { title: "4K Blockbuster Breakdown", author: "adilinthewild", likes: 427 },
  // ev: 3717/3719/3720/3727.
  { title: "Higgsfield Academy", author: "higgsfield.launch", likes: 279 },
  // ev: 3731/3733/3734/3741.
  { title: "The new girl", author: "higgsfield.soul", likes: 230 },
  // ev: 3745/3747/3748/3755.
  { title: "Ultra Realistic AI Short Film Breakdown", author: "adilinthewild", likes: 149 },
  // ev: 3759/3761/3762/3769.
  { title: "Dusk", author: "higgsfield.soul", likes: 163 },
  // ev: 3773/3775/3776/3783.
  { title: "\"Top Up\" Cinematic AD Breakdown", author: "adilinthewild", likes: 107 },
];

export function ProjectsTab() {
  return (
    <div className="space-y-5">
      <header className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight lg:text-2xl">OPEN PROJECTS</h2>
        <p className="text-sm text-muted-foreground">
          Standout projects making waves around the web
        </p>
        {/* ev: filter group 3660 'Filter projects' (buttons 3661/3664/3667) —
            live filter semantics were not captured → inert chips. */}
        <div role="group" aria-label="Filter projects" className="flex flex-wrap items-center gap-1.5 pt-1">
          {FILTER_CHIPS.map((f) => (
            <span
              key={f}
              title="Live filter behavior not captured — chip is inert in this clone"
              className="cursor-not-allowed rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground/70"
            >
              {f}
            </span>
          ))}
          {/* ev: 'See all' link 3670 — live href uncaptured → scoped */}
          <span
            title="Live 'See all' target not captured"
            className="ml-auto cursor-not-allowed text-xs font-medium text-muted-foreground/70"
          >
            See all
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROJECTS.map((p) => {
          const hue = modelHue(p.title);
          return (
            <article
              key={p.title}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
              aria-label={`Project: ${p.title}`}
            >
              {/* Deterministic fnv1a-seeded tile (live project media are
                  uncaptured CDN assets; no Math.random). */}
              <div
                className="flex aspect-[16/9] items-end p-3"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 65% 52% / 0.45), hsl(${(hue + 40) % 360} 65% 40% / 0.12))`,
                }}
                aria-hidden
              />
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3 className="text-sm font-semibold leading-snug">{p.title}</h3>
                {/* ev: author profile links (e.g. 3678 'higgsfield.launch’s
                    profile') — clone has no profile pages → inert text. */}
                <p className="text-xs text-muted-foreground">@{p.author}</p>
                <div className="flex items-center justify-between gap-2">
                  {/* ev: like counts (e.g. 3685 '864') + Like buttons (3683) —
                      the like flow is an uncaptured fnf call → scoped. */}
                  <span className="inline-flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                    <Heart className="h-3.5 w-3.5" aria-hidden />
                    {p.likes.toLocaleString("en-US")}
                  </span>
                  <span title="Like flow not captured" className="inline-block">
                    <Button variant="ghost" size="icon" disabled className="h-7 w-7" aria-label={`Like ${p.title}`}>
                      <Heart className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </span>
                </div>
                {/* ev: 'View {title}' buttons (e.g. 3675) — uncaptured fnf flow → scoped */}
                <span title="Project detail flow not captured" className="mt-auto block pt-2">
                  <Button variant="secondary" size="sm" disabled className="w-full gap-1.5">
                    <Eye className="h-3.5 w-3.5" aria-hidden />
                    View project
                  </Button>
                </span>
              </div>
            </article>
          );
        })}
      </div>

      {/* ev: 'Explore all projects' link 3810 — live href uncaptured → scoped */}
      <div className="flex justify-center pt-2">
        <span title="Live 'Explore all projects' target not captured">
          <Button variant="outline" disabled>
            Explore all projects
          </Button>
        </span>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-xs leading-relaxed text-muted-foreground">
        <FolderGit2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
        <span>
          <span className="font-semibold text-amber-500">Demo scope —</span> the live OPEN PROJECTS
          feed is an editorially curated showcase whose API was not captured (it is not the folder
          or publication shapes this clone serves). The eight cards above are the captured 2026-10-17
          state, rendered verbatim (title / author / like count); nothing beyond them is invented.
        </span>
      </p>
    </div>
  );
}
