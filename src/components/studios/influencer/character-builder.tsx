"use client";

import { useState } from "react";
import { Dices, Loader2, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fnv1a } from "@/lib/seeded-rng";

/**
 * AI Influencer character builder — the settings panel of /ai-influencer-studio.
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json,
 * root "AI Influencer | Higgsfield", 813 a11y nodes; complementary 116 'AI
 * Influencer settings'):
 * - header: paragraph 120 'Create your own character with' + heading 121
 *   'AI INFLUENCER'.
 * - creation mode: tablist 2078 with tabs 124 'Create Influencer' / 126 'Motion'.
 * - photo: StaticText 129 'Optional' + button 132 'Upload your photo'.
 * - Character type: heading 134 + collapse button 135 + group 2104 whose option
 *   buttons carry the FULL captured option set: 142 'Average', 145 'Bold',
 *   148 'Extreme', 151 'Insect', 154 'Frog', 157 'Cat', 160 'Dog', 163 'Rodent',
 *   166 'Bird' (the only control whose option set was captured).
 * - the 18 remaining controls were captured as heading + collapse button pairs
 *   ONLY (option sets live in closed dropdowns, not in the a11y tree):
 *   Gender 169/170, Build 176/177, Hairstyle 183/184, Hair Color 190/191,
 *   Style 197/198, Ethnicity 204/205, Age 211/212, Skin color 218/219,
 *   Height 225/226, Proportions 232/233, Head shape 239/240, Neck 246/247,
 *   Eye shape 253/254, Eye color 260/261, Features 267/268, Facial hair 274/275,
 *   Distinctive features 281/282, Accessories 288/289.
 * - actions: buttons 295 'Randomize' / 297 'Generate' with generic 2252
 *   '1.125 credits'.
 *
 * Honest scoping (disclosed): the 18 un-captured controls render as selects
 * whose only value is 'Any' (unset) with a visible note — no option values are
 * invented. Randomize only randomizes the evidence-captured field
 * (Character type), deterministically (fnv1a-seeded, no Math.random). Generate
 * is disabled with the evidence credit cost (1.125) and a visible demo-scope
 * note — the influencer generation pipeline was not captured, so NO job is
 * created and no API is called.
 */

/** ev: group 2104 option buttons — the full captured Character type option set. */
const CHARACTER_TYPES = [
  "Average",
  "Bold",
  "Extreme",
  "Insect",
  "Frog",
  "Cat",
  "Dog",
  "Rodent",
  "Bird",
] as const;

/** ev: heading+button pairs 169-289 — option sets NOT captured. */
const UNCAPTURED_CONTROLS = [
  "Gender",
  "Build",
  "Hairstyle",
  "Hair Color",
  "Style",
  "Ethnicity",
  "Age",
  "Skin color",
  "Height",
  "Proportions",
  "Head shape",
  "Neck",
  "Eye shape",
  "Eye color",
  "Features",
  "Facial hair",
  "Distinctive features",
  "Accessories",
] as const;

const CREDIT_COST = "1.125"; // ev: generic 2252 '1.125 credits'

export function CharacterBuilder() {
  const [characterType, setCharacterType] = useState<(typeof CHARACTER_TYPES)[number]>("Average");
  const [randomTick, setRandomTick] = useState(0);

  const randomize = () => {
    const next = randomTick + 1;
    setRandomTick(next);
    // Deterministic pick — fnv1a over a tick-seeded string (no Math.random).
    const hash = fnv1a(`ai-influencer-character-type-${next}`);
    setCharacterType(CHARACTER_TYPES[hash % CHARACTER_TYPES.length]);
  };

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-5 p-4 sm:p-6">
        {/* Panel header — ev: 120 + 121 */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Create your own character with</p>
          <h2 className="text-lg font-bold tracking-tight">AI INFLUENCER</h2>
        </div>

        {/* Upload your photo — ev: 129 'Optional' + button 132; upload flow uncaptured */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Optional</Label>
          </div>
          <Button variant="outline" size="sm" className="w-full" disabled aria-disabled="true">
            <Upload className="mr-2 h-4 w-4" aria-hidden />
            Upload your photo
          </Button>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber-500">Demo scope:</span> the photo-upload flow was
            not captured in the evidence survey.
          </p>
        </div>

        {/* Character type — ev: heading 134 + group 2104 (full option set) */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Character type
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Character type">
            {CHARACTER_TYPES.map((t) => {
              const active = t === characterType;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCharacterType(t)}
                  aria-pressed={active}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-foreground/80 hover:border-foreground/25 hover:text-foreground"
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* The 18 remaining controls — ev: headings only, option sets NOT captured */}
        <div className="space-y-3">
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber-500">Demo scope:</span> the option sets for the
            controls below were not captured (they live in closed dropdowns in the live app) —{" "}
            <span className="font-medium">Any</span> (unset) is the only honest value, so nothing is
            invented.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {UNCAPTURED_CONTROLS.map((control) => (
              <div key={control} className="space-y-1.5">
                <Label htmlFor={`influencer-${control.replace(/\s+/g, "-").toLowerCase()}`} className="text-xs text-muted-foreground">
                  {control}
                </Label>
                <Select value="any" onValueChange={() => undefined}>
                  <SelectTrigger
                    id={`influencer-${control.replace(/\s+/g, "-").toLowerCase()}`}
                    className="w-full bg-card"
                    aria-label={control}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>

        {/* Character summary panel — clone-side panel surfacing the current state */}
        <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Character summary
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            <div className="col-span-2 flex items-center justify-between gap-2 border-b border-border/60 pb-1.5">
              <dt className="text-muted-foreground">Character type</dt>
              <dd className="font-semibold">{characterType}</dd>
            </div>
            {UNCAPTURED_CONTROLS.map((control) => (
              <div key={control} className="flex items-center justify-between gap-2">
                <dt className="truncate text-muted-foreground">{control}</dt>
                <dd className="font-medium text-muted-foreground/80">Any</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Actions — ev: buttons 295 'Randomize' / 297 'Generate' + 2252 '1.125 credits' */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={randomize}>
              <Dices className="mr-2 h-4 w-4" aria-hidden />
              Randomize
            </Button>
            <Button size="lg" disabled aria-disabled="true">
              <Loader2 className="mr-2 h-4 w-4 opacity-40" aria-hidden />
              Generate
              <Badge variant="secondary" className="ml-2 tabular-nums">
                {CREDIT_COST} credits
              </Badge>
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-amber-500">Demo scope:</span> the influencer generation
            pipeline was not captured (cost shown is the evidence value, 1.125 credits) — this build
            creates no job and calls no API. Randomize deterministically picks a captured Character
            type option.
          </p>
          <p className="sr-only" aria-live="polite">
            Character type set to {characterType}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
