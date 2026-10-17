"use client";

import { Heart } from "lucide-react";

import { EmptyState } from "@/components/studio/empty-state";

export default function FavoritesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        My favorites
      </h1>
      <EmptyState
        icon={<Heart className="size-7" aria-hidden="true" />}
        title="No favorites yet"
        description="Star generations to keep them close. (Wave 2)"
      />
    </div>
  );
}
