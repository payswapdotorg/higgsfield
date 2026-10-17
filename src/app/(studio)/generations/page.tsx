"use client";

import { useRouter } from "next/navigation";
import { Film } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/studio/empty-state";

export default function GenerationsPage() {
  const router = useRouter();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-50">
        My generations
      </h1>
      <EmptyState
        icon={<Film className="size-7" aria-hidden="true" />}
        title="Nothing here yet"
        description="Your generations from Cinema Studio will appear here."
        action={
          <Button
            type="button"
            className="h-10 rounded-full bg-white px-6 text-sm font-semibold text-black hover:bg-zinc-200"
            onClick={() => router.push("/generate")}
          >
            Open Cinema Studio
          </Button>
        }
      />
    </div>
  );
}
