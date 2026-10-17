"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Film, FolderGit2 } from "lucide-react";
import { ContestsTab } from "@/components/community/contests-tab";
import { CreatorsTab } from "@/components/community/creators-tab";
import { GenerationsTab } from "@/components/community/generations-tab";
import type { CommunityHeader, CommunityTab } from "@/components/community/types";
import { WaveThreeStub } from "@/components/community/wave-three-stub";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

/**
 * Hardcoded tab list — mirrors the /(public)/community/_tabs/* route family
 * (also returned by GET /api/community/discovery/header).
 */
const TABS: { key: CommunityTab; label: string }[] = [
  { key: "generations", label: "Generations" },
  { key: "contests", label: "Contests" },
  { key: "creators", label: "Creators" },
  { key: "originals", label: "Originals" },
  { key: "projects", label: "Projects" },
];

const TAB_KEYS = new Set<string>(TABS.map((t) => t.key));

function parseTab(raw: string | null): CommunityTab {
  const candidate = raw ?? "generations";
  return TAB_KEYS.has(candidate) ? (candidate as CommunityTab) : "generations";
}

/**
 * Community discovery content. Reads the active tab from ?tab= (default
 * "generations"). MUST stay wrapped in <Suspense> by the page because it calls
 * useSearchParams() during the static prerender.
 */
export function CommunityContent() {
  const searchParams = useSearchParams();
  const tab = parseTab(searchParams.get("tab"));

  const { data: header } = useQuery({
    queryKey: ["community-header"],
    queryFn: () => api<CommunityHeader>("/api/community/discovery/header"),
    staleTime: 5 * 60_000,
    retry: false,
  });

  const activeLabel = TABS.find((t) => t.key === tab)?.label ?? "Generations";

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {header?.title ?? "Community"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {header?.subtitle ?? "Explore generations from HF Studio creators"}
          </p>
        </div>

        <nav aria-label="Community sections" className="-mx-1 overflow-x-auto px-1 scrollbar-slim">
          <div
            role="tablist"
            aria-label="Community tabs"
            className="flex w-max items-center gap-1 whitespace-nowrap rounded-full border border-border bg-card p-1"
          >
            {TABS.map((t) => {
              const active = t.key === tab;
              return (
                <Link
                  key={t.key}
                  href={`/community?tab=${t.key}`}
                  role="tab"
                  aria-selected={active}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-[var(--signal)] text-white"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      <section role="tabpanel" aria-label={`${activeLabel} tab content`}>
        {tab === "generations" && <GenerationsTab />}
        {tab === "contests" && <ContestsTab />}
        {tab === "creators" && <CreatorsTab />}
        {/*
         * Originals tab (HF-W3B B6 decision): left as a stub — the evidence
         * does NOT support an originals publications view. The captured
         * community surface (inspect-community.json, 969 nodes) is the live
         * Discovery tab (nav links 3437-3443 'Discovery'/'Projects'/'Shots'/
         * 'Creators') whose sections are FEATURED CREATORS / Grants /
         * CONTESTS / OPEN PROJECTS / SHOTS BY CREATORS / CREATOR PARTNERSHIP
         * PROGRAM / CREATOR HUB / DISCORD COMMUNITY — no originals section,
         * and the live community page carries no originals tab. The clone's
         * feed API (/api/community/generations/feed) already serves the
         * generations tab (the SHOTS BY CREATORS equivalent); re-serving it
         * under "originals" would mislabel content. The live 'Originals'
         * mega-menu entry (inspect-effects.json link 19966) maps to the
         * /(public)/original-series route family, which was not captured.
         */}
        {tab === "originals" && (
          <WaveThreeStub
            icon={Film}
            title="Originals surface not captured"
            subtext="The evidence survey captured the community Discovery tab — creators, contests, open projects and shots — but no originals section. The live Originals entry maps to the original-series route family, whose surface was not captured; nothing is invented here."
          />
        )}
        {tab === "projects" && (
          <WaveThreeStub
            icon={FolderGit2}
            title="Projects ship in Wave 3"
            subtext="The projects route family mirrors the live product manifest — it arrives in Wave 3."
          />
        )}
      </section>
    </div>
  );
}
