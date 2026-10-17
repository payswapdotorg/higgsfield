"use client";

import * as React from "react";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

/**
 * Shared empty-state block: icon in a bordered circle, title, muted
 * description and an optional call-to-action. Centers itself in the
 * available space of the studio main area.
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
      <div
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-zinc-400"
      >
        {icon}
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
          {title}
        </h2>
        <p className="mx-auto max-w-sm text-sm text-zinc-400">{description}</p>
      </div>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
