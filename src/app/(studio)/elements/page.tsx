"use client";

import { Shapes } from "lucide-react";

import { EmptyState } from "@/components/studio/empty-state";

export default function ElementsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        My elements
      </h1>
      <EmptyState
        icon={<Shapes className="size-7" aria-hidden="true" />}
        title="No elements yet"
        description="Reference elements you pin will live here. (Wave 2)"
      />
    </div>
  );
}
