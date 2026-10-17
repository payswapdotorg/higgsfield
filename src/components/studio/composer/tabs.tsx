"use client";

import { ImageIcon, Sparkles, Video, type LucideIcon } from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAX_REFERENCES } from "@/lib/pricing";

export type ComposerTab = "image" | "video" | "references";

interface ComposerTabsProps {
  value: ComposerTab;
  onChange: (tab: ComposerTab) => void;
}

const TABS: { value: ComposerTab; label: string; icon: LucideIcon }[] = [
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
];

export function ComposerTabs({ value, onChange }: ComposerTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(next) => onChange(next as ComposerTab)}
    >
      <TabsList
        aria-label="Generation mode"
        className="h-auto w-fit gap-1 rounded-full border border-zinc-800 bg-zinc-900/80 p-1"
      >
        {TABS.map(({ value: tabValue, label, icon: Icon }) => (
          <TabsTrigger
            key={tabValue}
            value={tabValue}
            className="gap-1.5 rounded-full border-none px-4 py-1.5 text-sm font-medium text-zinc-400 shadow-none data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900"
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </TabsTrigger>
        ))}
        <TabsTrigger
          value="references"
          className="gap-1.5 rounded-full border-none px-4 py-1.5 text-sm font-medium text-zinc-400 shadow-none data-[state=active]:bg-zinc-100 data-[state=active]:text-zinc-900 dark:data-[state=active]:bg-zinc-100 dark:data-[state=active]:text-zinc-900 [&[data-state=active]_.references-count]:bg-zinc-900/10 [&[data-state=active]_.references-count]:text-zinc-600"
        >
          <Sparkles className="size-4" aria-hidden="true" />
          References
          <span className="references-count ml-0.5 rounded-full bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-zinc-400">
            0/{MAX_REFERENCES}
          </span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
