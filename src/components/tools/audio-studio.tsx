"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AudioLines,
  Clapperboard,
  History,
  Info,
  Mic,
  Minus,
  Plus,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * /audio — Higgsfield Audio landing + voice workspace (private).
 *
 * Evidence (evidence/rea-2026-10-17/surfaces/inspect-audio.json, 346 a11y
 * nodes):
 * - mode tabs (buttons 1047/1049/1051): 'Text to Speech' / 'Voice Change' /
 *   'Translate' — only the Text to Speech panel structure is captured; the
 *   other two render disclosed not-captured panels;
 * - script textbox 1063 with placeholder 'Write exactly what the voice will
 *   read out loud. Type @ to reference attachments' (label 1061 'Script');
 * - model button 1065 'Model Seed Audio 1.0' — the ONLY captured model;
 * - voice details textbox 929 ('Optional', counter '0/500' — nodes
 *   1078-1083);
 * - upload button 3089 'Upload media Up to 3 Voices/Audios or Image'
 *   ('Optional' 1059) — the clone/record flow was NOT captured → scoped;
 * - batch size 1069 with '1/4' (1072/1074) + decrease/increase buttons
 *   1070/1075 — interactive, clamped to the captured 1..4 range;
 * - Generate button 1089 — the audio generation pipeline was NOT captured →
 *   visibly scoped, NO fake job creation (order: "honest demo-scope on
 *   generate");
 * - 'How it works' step cards: heading 3164 'TURN TEXT INTO SPEECH' +
 *   paragraph 3167 'Lifelike speech from any script — ready for your
 *   projects'; heading 3171 'Pick or clone a voice' + paragraph 3174
 *   'Choose a preset, clone your own, or pick a model'; heading 3179 'Write,
 *   describe and generate' + paragraph 3182 'Type your script, describe how
 *   it sounds, and create';
 * - tabs 3141 'History' / 3146 'How it works', Filters button 3154,
 *   'More about Audio' button 3186 — History content and the Filters /
 *   More-about targets were not captured → disclosed inert states.
 *
 * VOICE LIST DISCLOSURE: no preset voice names exist anywhere in the capture
 * (the a11y tree carries no voice-name nodes; the typeahead listbox 3277 is
 * empty; api-bodies-digest.json has no voice fields — checked). The picker
 * therefore renders ONLY the captured affordances ('Choose a preset' /
 * 'clone your own' / 'pick a model' — paragraph 3174) with a visible
 * not-captured note. No voice names are invented.
 */

type AudioMode = "tts" | "voice-change" | "translate";

const MODES: { key: AudioMode; label: string; nodeId: number }[] = [
  { key: "tts", label: "Text to Speech", nodeId: 1047 },
  { key: "voice-change", label: "Voice Change", nodeId: 1049 },
  { key: "translate", label: "Translate", nodeId: 1051 },
];

const SCRIPT_MAX = 5000;
const VOICE_DETAILS_MAX = 500; // ev: counter nodes 1081/1083 '0' '/ '500'
const BATCH_MAX = 4; // ev: '1/4' nodes 1072-1074

export function AudioStudio() {
  const [mode, setMode] = useState<AudioMode>("tts");
  const [script, setScript] = useState("");
  const [voiceDetails, setVoiceDetails] = useState("");
  const [batch, setBatch] = useState(1);
  const [model, setModel] = useState<"seed-audio-1-0" | null>("seed-audio-1-0");
  const [panelTab, setPanelTab] = useState<"how-it-works" | "history">("how-it-works");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 py-2 lg:py-4">
      {/* ev: 'How it works' step 1 — heading 3164 + paragraph 3167 */}
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <AudioLines className="h-4 w-4 text-[var(--signal)]" aria-hidden />
          Higgsfield Audio
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          TURN TEXT INTO SPEECH
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Lifelike speech from any script — ready for your projects
        </p>
      </header>

      {/* ev: mode tabs 1047/1049/1051 (interactive client-side switching) */}
      <div
        role="tablist"
        aria-label="Audio modes"
        className="flex w-max items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        {MODES.map((m) => {
          const active = mode === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setMode(m.key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--signal)] text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Workspace: Text to Speech composer (the captured panel) */}
      <Card className="border-border bg-card">
        <CardContent className="space-y-6 p-4 sm:p-6">
          {mode === "tts" ? (
            <>
              {/* ev: script textbox 1063 + label 1061 'Script' */}
              <div className="space-y-2">
                <label htmlFor="audio-script" className="text-sm font-medium">
                  Script
                </label>
                <textarea
                  id="audio-script"
                  value={script}
                  onChange={(e) => setScript(e.target.value.slice(0, SCRIPT_MAX))}
                  rows={5}
                  placeholder="Write exactly what the voice will read out loud. Type @ to reference attachments"
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <p className="text-right text-[11px] tabular-nums text-muted-foreground">
                  {script.length}/{SCRIPT_MAX}
                </p>
              </div>

              {/* Voice picker — ev: paragraph 3174 'Choose a preset, clone your
                  own, or pick a model'. NO preset voice names were captured
                  (a11y tree + digest checked) → visible note, nothing invented. */}
              <fieldset className="space-y-3 rounded-lg border border-border p-4">
                <legend className="px-1.5 text-sm font-medium">Pick or clone a voice</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {/* Preset affordance — disclosed empty */}
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <Mic className="h-3.5 w-3.5" aria-hidden /> Choose a preset
                    </p>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      Not captured in the evidence survey — preset voice names are not invented in
                      this build.
                    </p>
                  </div>
                  {/* Clone affordance — ev: upload button 3089 'Upload media Up
                      to 3 Voices/Audios or Image' (Optional) → scoped inert */}
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <Upload className="h-3.5 w-3.5" aria-hidden /> Clone your own
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 w-full"
                      disabled
                      aria-describedby="audio-scope"
                    >
                      Upload media
                    </Button>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                      Up to 3 Voices/Audios or Image · Optional — voice cloning is not wired in this
                      build.
                    </p>
                  </div>
                  {/* Model affordance — ev: model button 1065 'Model Seed Audio
                      1.0' (the only captured model), interactive toggle */}
                  <div className="rounded-lg border border-border p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold">
                      <AudioLines className="h-3.5 w-3.5" aria-hidden /> Pick a model
                    </p>
                    <button
                      type="button"
                      onClick={() => setModel(model ? null : "seed-audio-1-0")}
                      aria-pressed={model !== null}
                      className={cn(
                        "mt-2 flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-xs font-medium transition-colors",
                        model
                          ? "border-[var(--signal)]/50 bg-[var(--signal)]/10 text-foreground"
                          : "border-border text-muted-foreground hover:bg-accent"
                      )}
                    >
                      <span>
                        Model · Seed Audio 1.0
                      </span>
                      {model && (
                        <Badge className="px-1.5 text-[10px] font-semibold uppercase" variant="secondary">
                          selected
                        </Badge>
                      )}
                    </button>
                  </div>
                </div>
              </fieldset>

              {/* ev: voice details textbox 929 ('Optional', 0/500 counter) */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <label htmlFor="audio-voice-details" className="text-sm font-medium">
                    Voice details
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    Optional · {voiceDetails.length}/{VOICE_DETAILS_MAX}
                  </span>
                </div>
                <textarea
                  id="audio-voice-details"
                  value={voiceDetails}
                  onChange={(e) => setVoiceDetails(e.target.value.slice(0, VOICE_DETAILS_MAX))}
                  rows={2}
                  placeholder="Describe how it sounds — tone, pace, accent…"
                  className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex flex-wrap items-center gap-4">
                {/* ev: batch size 1/4 + decrease/increase buttons 1070/1075 */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Batch size</span>
                  <div className="flex items-center gap-1 rounded-lg border border-border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Decrease batch size"
                      disabled={batch <= 1}
                      onClick={() => setBatch((b) => Math.max(1, b - 1))}
                    >
                      <Minus className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                    <span className="min-w-10 text-center text-sm tabular-nums">
                      {batch}/{BATCH_MAX}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      aria-label="Increase batch size"
                      disabled={batch >= BATCH_MAX}
                      onClick={() => setBatch((b) => Math.min(BATCH_MAX, b + 1))}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden />
                    </Button>
                  </div>
                </div>

                {/* ev: Generate button 1089 — pipeline NOT captured → scoped,
                    NO fake job creation */}
                <Button size="lg" disabled aria-describedby="audio-scope">
                  Generate
                </Button>
                {/* Honest CTA into the wave-2 pipeline */}
                <Button asChild size="lg" variant="secondary">
                  <Link href="/">
                    <Clapperboard className="mr-2 h-4 w-4" aria-hidden />
                    Continue in Cinema Studio
                  </Link>
                </Button>
              </div>

              <p
                id="audio-scope"
                className="text-xs leading-relaxed text-amber-600 dark:text-amber-400"
              >
                Demo scope: the audio generation pipeline (speech synthesis, voice cloning,
                translation) was not captured in the evidence survey — Generate is inert and no job
                is created. Cinema Studio remains the real generation pipeline.
              </p>
            </>
          ) : (
            /* Voice Change (1049) / Translate (1051): tab labels captured, panels NOT */
            <div className="space-y-3 py-6 text-center">
              <p className="text-sm font-semibold">
                {mode === "voice-change" ? "Voice Change" : "Translate"} panel not captured
              </p>
              <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
                The 2026-10-17 capture includes this mode&rsquo;s tab label (button{" "}
                {mode === "voice-change" ? "1049" : "1051"}) but not its workspace surface — so
                nothing is implemented or simulated here. Switch back to Text to Speech for the
                captured composer.
              </p>
              <Button variant="secondary" size="sm" onClick={() => setMode("tts")}>
                Back to Text to Speech
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ev: tabs 3141 'History' / 3146 'How it works' */}
      <section aria-labelledby="audio-panel-heading" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="audio-panel-heading" className="text-lg font-semibold tracking-tight">
            <span className="sr-only">Audio panel: </span>
            {panelTab === "how-it-works" ? "How it works" : "History"}
          </h2>
          {/* ev: Filters button 3154 — target not captured → inert */}
          <Button variant="outline" size="sm" disabled aria-describedby="audio-scope">
            Filters
          </Button>
        </div>
        <div
          role="tablist"
          aria-label="Audio panel tabs"
          className="flex w-max items-center gap-1 rounded-full border border-border bg-card p-1"
        >
          {(
            [
              { key: "how-it-works", label: "How it works" },
              { key: "history", label: "History" },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={panelTab === t.key}
              onClick={() => setPanelTab(t.key)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                panelTab === t.key
                  ? "bg-[var(--signal)] text-white"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {panelTab === "how-it-works" ? (
          /* ev: step cards — headings 3164/3171/3179 + paragraphs 3167/3174/3182 */
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-border bg-card">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step 1
                </p>
                <h3 className="text-base font-bold tracking-tight">TURN TEXT INTO SPEECH</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Lifelike speech from any script — ready for your projects
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step 2
                </p>
                <h3 className="text-base font-bold tracking-tight">Pick or clone a voice</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Choose a preset, clone your own, or pick a model
                </p>
              </CardContent>
            </Card>
            <Card className="border-border bg-card">
              <CardContent className="space-y-2 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step 3
                </p>
                <h3 className="text-base font-bold tracking-tight">Write, describe and generate</h3>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Type your script, describe how it sounds, and create
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* History tab — content not captured → disclosed empty state */
          <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 py-16 text-center">
            <History className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="text-sm font-medium">No audio history</p>
            <p className="max-w-md text-xs leading-relaxed text-muted-foreground">
              The audio pipeline is not part of this build (its generation flow was not captured),
              so no audio history can exist here — this state is disclosed rather than faked.
            </p>
          </div>
        )}
      </section>

      {/* ev: 'More about Audio' button 3186 — target not captured → inert */}
      <footer className="flex items-center justify-between gap-4 border-t border-border pt-4">
        <Button variant="ghost" size="sm" className="text-muted-foreground" disabled aria-describedby="audio-scope">
          <Info className="mr-1.5 h-4 w-4" aria-hidden />
          More about Audio
        </Button>
        <p className="text-xs text-muted-foreground">
          Audio mode: {MODES.find((m) => m.key === mode)?.label}
        </p>
      </footer>
    </div>
  );
}
