"use client";

import * as React from "react";

import { ComposerTabs, type ComposerTab } from "@/components/studio/composer/tabs";
import { PromptBox } from "@/components/studio/composer/prompt-box";
import { FilmSetup } from "@/components/studio/composer/film-setup";
import { SettingsChips } from "@/components/studio/composer/settings-chips";
import { GenerateBar } from "@/components/studio/composer/generate-bar";
import { ProjectPicker } from "@/components/studio/composer/project-picker";
import { ReferencesTab } from "@/components/studio/composer/references-tab";
import {
  UpgradeModal,
  type UpgradeModalContext,
} from "@/components/studio/upgrade-modal";
import { useComposer } from "@/store/composer";

/**
 * The Cinema Studio composer — hero header plus the generation card
 * (tabs, project picker, prompt, film setup, settings chips, generate bar).
 */
export function Composer() {
  const mode = useComposer((s) => s.mode);
  const setMode = useComposer((s) => s.setMode);

  // `null` means "follow the store mode" — only the References tab is an
  // explicit override, so the Image/Video triggers stay in sync with the
  // persisted mode even after rehydration.
  const [tabOverride, setTabOverride] = React.useState<ComposerTab | null>(
    null,
  );
  const tab: ComposerTab = tabOverride ?? mode;

  const [upgradeContext, setUpgradeContext] = React.useState<
    UpgradeModalContext | undefined
  >(undefined);
  const [upgradeOpen, setUpgradeOpen] = React.useState(false);

  const handleTabChange = (next: ComposerTab) => {
    if (next === "image" || next === "video") {
      setMode(next);
      setTabOverride(null);
    } else {
      setTabOverride(next);
    }
  };

  const handleNeedUpgrade = (context: UpgradeModalContext) => {
    setUpgradeContext(context);
    setUpgradeOpen(true);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pt-10 pb-12 sm:px-6">
      <h1 className="text-center text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl lg:text-4xl">
        BRING YOUR STORIES TO LIFE
      </h1>

      <div className="mt-8 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/50">
        {/* Header row: mode tabs + project picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 p-4">
          <ComposerTabs value={tab} onChange={handleTabChange} />
          <ProjectPicker />
        </div>

        {tab === "references" ? <ReferencesTab /> : <PromptBox />}

        <FilmSetup />
        <SettingsChips />
        <GenerateBar onNeedUpgrade={handleNeedUpgrade} />
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        context={upgradeContext}
      />
    </div>
  );
}
