"use client";

import { AtSign } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { useComposer } from "@/store/composer";

export function PromptBox() {
  const prompt = useComposer((s) => s.prompt);
  const setPrompt = useComposer((s) => s.setPrompt);

  return (
    <div className="flex flex-col gap-2 p-4 sm:p-5">
      <label htmlFor="composer-prompt" className="sr-only">
        Scene prompt
      </label>
      <Textarea
        id="composer-prompt"
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Describe the scene you imagine..."
        aria-describedby="composer-prompt-hint"
        className="min-h-32 resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-700 focus-visible:ring-offset-0 dark:bg-transparent"
      />
      <div
        id="composer-prompt-hint"
        className="flex items-center justify-between gap-4 text-xs text-zinc-500"
      >
        <span className="flex items-center gap-1.5">
          <AtSign className="size-3.5" aria-hidden="true" />
          Use @ to add characters &amp; locations
        </span>
        <span className="shrink-0 tabular-nums" aria-label="Prompt length">
          {prompt.length}
        </span>
      </div>
    </div>
  );
}
