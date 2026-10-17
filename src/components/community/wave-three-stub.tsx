"use client";

import type { LucideIcon } from "lucide-react";

/**
 * Centered wave-3 placeholder used by the "originals" and "projects" tabs —
 * their route families exist on the live manifest and ship in Wave 3.
 */
export function WaveThreeStub({
  icon: Icon,
  title,
  subtext,
}: {
  icon: LucideIcon;
  title: string;
  subtext: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Icon className="h-7 w-7 text-muted-foreground" aria-hidden />
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="max-w-md text-sm text-muted-foreground">{subtext}</p>
    </div>
  );
}
