"use client";

import { Check, ChevronDown } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ASPECT_RATIOS,
  DURATIONS,
  MODELS,
  RESOLUTIONS,
  STEP_OPTIONS,
  getModel,
} from "@/lib/pricing";
import { useComposer } from "@/store/composer";
import { cn } from "@/lib/utils";

const CHIP_CLASS =
  "inline-flex h-8 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-900 px-3 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-600 disabled:opacity-50";

const MENU_CONTENT_CLASS =
  "border-zinc-800 bg-zinc-900 text-zinc-100";

interface ChipOption {
  value: string;
  label: string;
}

interface ChipMenuProps {
  /** Chip face label (current value). */
  label: string;
  ariaLabel: string;
  options: ChipOption[];
  value: string;
  onSelect: (value: string) => void;
}

function ChipMenu({ label, ariaLabel, options, value, onSelect }: ChipMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={CHIP_CLASS} aria-label={ariaLabel}>
          {label}
          <ChevronDown className="size-3.5 text-zinc-500" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={MENU_CONTENT_CLASS}>
        {options.map((option) => {
          const active = option.value === value;
          return (
            <DropdownMenuItem
              key={option.value}
              onSelect={() => onSelect(option.value)}
              className="gap-2 text-sm text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100"
              aria-checked={active}
            >
              <span className="flex w-4 shrink-0 justify-center">
                {active ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
              </span>
              {option.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ModelMenu() {
  const modelId = useComposer((s) => s.modelId);
  const mode = useComposer((s) => s.mode);
  const setModel = useComposer((s) => s.setModel);
  const activeName = getModel(modelId)?.name ?? modelId;

  const videoModels = MODELS.filter((m) => m.kind === "video");
  const imageModels = MODELS.filter((m) => m.kind === "image");

  const renderModel = (model: (typeof MODELS)[number]) => {
    const active = model.id === modelId;
    return (
      <DropdownMenuItem
        key={model.id}
        onSelect={() => setModel(model.id)}
        className="gap-3 py-2 focus:bg-zinc-800 focus:text-zinc-100"
        aria-checked={active}
      >
        <span className="flex w-4 shrink-0 justify-center">
          {active ? (
            <Check className="size-4" aria-hidden="true" />
          ) : null}
        </span>
        <span className="flex min-w-0 flex-col">
          <span className="text-sm text-zinc-100">{model.name}</span>
          <span className="text-xs text-zinc-500">{model.blurb}</span>
        </span>
        <span className="ml-auto shrink-0 text-xs tabular-nums text-zinc-400">
          {model.baseCredits} credits
        </span>
      </DropdownMenuItem>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(CHIP_CLASS, "max-w-48")}
          aria-label={`Model: ${activeName}`}
        >
          <span className="truncate">{activeName}</span>
          <ChevronDown className="size-3.5 shrink-0 text-zinc-500" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className={cn(MENU_CONTENT_CLASS, "w-72")}>
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-zinc-500">
          Video models
        </DropdownMenuLabel>
        {videoModels.map(renderModel)}
        <DropdownMenuSeparator className="bg-zinc-800" />
        <DropdownMenuLabel className="text-xs uppercase tracking-widest text-zinc-500">
          Image models
        </DropdownMenuLabel>
        {imageModels.map(renderModel)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SettingsChips() {
  const mode = useComposer((s) => s.mode);
  const resolution = useComposer((s) => s.resolution);
  const aspectRatio = useComposer((s) => s.aspectRatio);
  const durationSeconds = useComposer((s) => s.durationSeconds);
  const motion = useComposer((s) => s.motion);
  const steps = useComposer((s) => s.steps);

  const setResolution = useComposer((s) => s.setResolution);
  const setAspectRatio = useComposer((s) => s.setAspectRatio);
  const setDuration = useComposer((s) => s.setDuration);
  const setMotion = useComposer((s) => s.setMotion);
  const setSteps = useComposer((s) => s.setSteps);

  return (
    <div
      role="group"
      aria-label="Generation settings"
      className="flex flex-wrap items-center gap-2 border-t border-zinc-800 px-4 py-4 sm:px-5"
    >
      <ModelMenu />

      <ChipMenu
        label={resolution}
        ariaLabel={`Resolution: ${resolution}`}
        value={resolution}
        options={RESOLUTIONS.map((r) => ({ value: r.id, label: r.id }))}
        onSelect={setResolution}
      />

      <ChipMenu
        label={aspectRatio}
        ariaLabel={`Aspect ratio: ${aspectRatio}`}
        value={aspectRatio}
        options={ASPECT_RATIOS.map((a) => ({ value: a, label: a }))}
        onSelect={(value) =>
          setAspectRatio(value as (typeof ASPECT_RATIOS)[number])
        }
      />

      {mode === "video" ? (
        <ChipMenu
          label={`${durationSeconds}s`}
          ariaLabel={`Duration: ${durationSeconds} seconds`}
          value={String(durationSeconds)}
          options={DURATIONS.map((d) => ({
            value: String(d.seconds),
            label: `${d.seconds}s`,
          }))}
          onSelect={(value) => setDuration(Number(value))}
        />
      ) : null}

      {mode === "video" ? (
        <ChipMenu
          label={motion ? "On" : "Off"}
          ariaLabel={`Motion: ${motion ? "on" : "off"}`}
          value={motion ? "on" : "off"}
          options={[
            { value: "on", label: "On" },
            { value: "off", label: "Off" },
          ]}
          onSelect={(value) => setMotion(value === "on")}
        />
      ) : null}

      <ChipMenu
        label={`${steps}/4`}
        ariaLabel={`Steps: ${steps} of 4`}
        value={String(steps)}
        options={STEP_OPTIONS.map((s) => ({
          value: String(s.steps),
          label: `${s.steps}/4`,
        }))}
        onSelect={(value) => setSteps(Number(value))}
      />
    </div>
  );
}
