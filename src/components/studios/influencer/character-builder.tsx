"use client";

import { useRef, useState } from "react";
import { Dices, Loader2, Upload, X, Zap } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  ANY,
  INFLUENCER_SETTINGS,
  randomizeSpec,
  type InfluencerSpec,
  type SettingKey,
} from "@/lib/influencer-options";

/**
 * AI Influencer character builder — the settings panel of /ai-influencer-studio,
 * wired to the HF-W7 backend (wave-7 functional parity: this is now the REAL
 * builder — the wave-3A "Any-only honest shell" doctrine is superseded by the
 * user's functional-parity mandate; provenance tags below).
 *
 * Evidence nodes used (evidence/rea-2026-10-17/surfaces/inspect-ai-influencer-studio.json,
 * root "AI Influencer | Higgsfield", 813 a11y nodes; complementary 116 'AI
 * Influencer settings'):
 * - header: paragraph 120 'Create your own character with' + heading 121
 *   'AI INFLUENCER'.
 * - photo: StaticText 129 'Optional' + button 132 'Upload your photo' (the upload
 *   FLOW itself was uncaptured — one-line disclosure below the control).
 * - Character type: heading 134 + collapse button 135 + group 2104 whose option
 *   buttons carry the FULL captured option set: 142 'Average', 145 'Bold',
 *   148 'Extreme', 151 'Insect', 154 'Frog', 157 'Cat', 160 'Dog', 163 'Rodent',
 *   166 'Bird' — ev: the only control whose option set was captured.
 * - the 18 remaining controls were captured as heading + collapse button pairs
 *   ONLY (option sets live in closed dropdowns): Gender 169/170, Build 176/177,
 *   Hairstyle 183/184, Hair Color 190/191, Style 197/198, Ethnicity 204/205,
 *   Age 211/212, Skin color 218/219, Height 225/226, Proportions 232/233,
 *   Head shape 239/240, Neck 246/247, Eye shape 253/254, Eye color 260/261,
 *   Features 267/268, Facial hair 274/275, Distinctive features 281/282,
 *   Accessories 288/289 — their option lists come from the option library
 *   (src/lib/influencer-options.ts, spec: curated per the wave-7 published-spec
 *   doctrine; "Any" is the documented unset value).
 * - actions: buttons 295 'Randomize' / 297 'Generate' with generic 2252
 *   '1.125 credits'.
 *
 * spec: provenance notes (clone-side, disclosed): the name field is a backend
 * affordance (POST/PATCH {name?}, default "Influencer") — not a captured
 * control; Randomize rolls the full 19-setting spec deterministically
 * (randomizeSpec, fnv1a law — no Math.random); Generate burns exactly 1.125
 * credits (ev: node 2252) through POST/PATCH /api/characters + POST
 * /api/characters/{id}/generate (the parent owns the network sequence).
 */

const CREDIT_COST = "1.125"; // ev: generic 2252 '1.125 credits'
const MAX_REFERENCE_BYTES = 4 * 1024 * 1024; // mirrors the server's ~4MB decoded cap

/** ev: 120 + 121 — the panel header, verbatim. */
function PanelHeader() {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">Create your own character with</p>
      <h2 className="text-lg font-bold tracking-tight">AI INFLUENCER</h2>
    </div>
  );
}

export interface CharacterBuilderProps {
  /** The live 19-setting spec (controlled — the parent owns it so the character library can load one in). */
  spec: InfluencerSpec;
  onSpecChange: (spec: InfluencerSpec) => void;
  /** Character name (spec: backend affordance, default "Influencer"). */
  name: string;
  onNameChange: (name: string) => void;
  /** The reference photo as a data:image/…;base64 URI (null = none). */
  referenceImage: string | null;
  onReferenceImageChange: (uri: string | null) => void;
  /** The Generate action — the parent runs the create/patch + generate sequence. */
  onGenerate: () => void;
  /** True while the generate sequence is in flight (disables the button). */
  generating: boolean;
}

export function CharacterBuilder({
  spec,
  onSpecChange,
  name,
  onNameChange,
  referenceImage,
  onReferenceImageChange,
  onGenerate,
  generating,
}: CharacterBuilderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [randomTick, setRandomTick] = useState(0);

  const setSetting = (key: SettingKey, value: string) => {
    onSpecChange({ ...spec, [key]: value });
  };

  // ev: button 295 'Randomize' — full-spec deterministic roll (fnv1a law; the
  // tick counter is the seed so consecutive clicks always differ).
  const randomize = () => {
    const next = randomTick + 1;
    setRandomTick(next);
    onSpecChange(randomizeSpec(next));
  };

  // ev: button 132 'Upload your photo' — a real file input → FileReader →
  // data:image/…;base64 URI. >4MB is rejected client-side with a toast (the
  // server re-validates the decoded size).
  const onFileChosen = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_REFERENCE_BYTES) {
      toast.error(`Image exceeds the 4MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB) — pick a smaller photo`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Pick an image file");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => toast.error("Could not read that file");
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result.startsWith("data:image/")) {
        onReferenceImageChange(reader.result);
      } else {
        toast.error("Could not read that file as an image");
      }
    };
    reader.readAsDataURL(file);
  };

  const characterType = INFLUENCER_SETTINGS[0]; // key: character_type (ev: 134/2104)
  const curatedSettings = INFLUENCER_SETTINGS.slice(1); // the 18 spec: curated selects

  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-5 p-4 sm:p-6">
        <PanelHeader />

        {/* Name — spec: backend affordance (POST/PATCH {name?}), not a captured control */}
        <div className="space-y-1.5">
          <Label htmlFor="influencer-name" className="text-xs text-muted-foreground">
            Name
          </Label>
          <Input
            id="influencer-name"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Influencer"
            maxLength={80}
            className="bg-card"
            autoComplete="off"
          />
        </div>

        {/* Upload your photo — ev: 129 'Optional' + button 132; upload flow uncaptured (one-line disclosure) */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Optional</Label>
          </div>
          {referenceImage ? (
            <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-2.5">
              {/* Plain img — data URI preview (the no-img-element rule is off in this config). */}
              <img
                src={referenceImage}
                alt="Reference photo preview"
                className="h-14 w-14 shrink-0 rounded-lg border border-border object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium">Reference photo</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  Conditions the portrait on your photo
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onReferenceImageChange(null)}
                aria-label="Remove reference photo"
              >
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="mr-2 h-4 w-4" aria-hidden />
              Upload your photo
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              onFileChosen(e.target.files?.[0]);
              e.target.value = ""; // allow re-picking the same file after remove
            }}
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            spec: the live upload flow was not captured in the evidence survey — this one uploads a
            data:image URI (≤4MB) with the character.
          </p>
        </div>

        {/* Character type — ev: heading 134 + group 2104 (the full captured option set) */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {characterType.label}
          </legend>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Character type">
            {characterType.options.map((t) => {
              const active = t === spec.character_type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSetting("character_type", t)}
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

        {/* The 18 curated settings — ev: heading+button pairs 169-289; option lists spec: curated */}
        <div className="grid grid-cols-2 gap-3">
          {curatedSettings.map((setting) => {
            const id = `influencer-${setting.key}`;
            return (
              <div key={setting.key} className="space-y-1.5">
                <Label htmlFor={id} className="text-xs text-muted-foreground">
                  {setting.label}
                </Label>
                <Select
                  value={spec[setting.key]}
                  onValueChange={(v) => setSetting(setting.key, v)}
                >
                  <SelectTrigger id={id} className="w-full bg-card" aria-label={setting.label}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ANY}>Any</SelectItem>
                    {setting.options.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            );
          })}
        </div>

        {/* Character summary panel — live values (unset shows as "Any") */}
        <div className="space-y-2 rounded-xl border border-dashed border-border bg-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Character summary
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
            {INFLUENCER_SETTINGS.map((setting) => (
              <div
                key={setting.key}
                className={cn(
                  "flex items-center justify-between gap-2",
                  setting.key === "character_type" &&
                    "col-span-2 border-b border-border/60 pb-1.5"
                )}
              >
                <dt className="truncate text-muted-foreground">{setting.label}</dt>
                <dd
                  className={cn(
                    "truncate font-medium",
                    setting.key === "character_type" ? "font-semibold" : undefined,
                    spec[setting.key] === ANY && setting.key !== "character_type"
                      ? "text-muted-foreground/80"
                      : "text-foreground"
                  )}
                >
                  {spec[setting.key]}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Actions — ev: buttons 295 'Randomize' / 297 'Generate' + 2252 '1.125 credits' */}
        <div className="space-y-2 border-t border-border pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" variant="secondary" onClick={randomize}>
              <Dices className="mr-2 h-4 w-4" aria-hidden />
              Randomize
            </Button>
            <Button type="button" size="lg" disabled={generating} onClick={onGenerate}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <Zap className="mr-2 h-4 w-4" aria-hidden />
              )}
              Generate
              <Badge variant="secondary" className="ml-2 tabular-nums">
                {CREDIT_COST} credits
              </Badge>
            </Button>
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Generate queues the character sheet — a portrait and a full-body render of this spec
            (1.125 credits total).
          </p>
          <p className="sr-only" aria-live="polite">
            {generating
              ? "Generating character sheet"
              : `Character type set to ${spec.character_type}`}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
