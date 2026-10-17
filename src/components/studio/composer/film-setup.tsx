"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useComposer, type FilmSetupState } from "@/store/composer";

const CAMERA_OPTIONS = ["Auto", "Handheld", "Drone", "Static", "Dolly"];
const PALETTE_OPTIONS = ["Auto", "Warm", "Cool", "Noir", "Pastel"];
const LIGHTING_OPTIONS = [
  "Auto",
  "Golden hour",
  "Neon",
  "Overcast",
  "Candlelit",
];

const ROWS: {
  key: keyof FilmSetupState;
  label: string;
  options: string[];
}[] = [
  { key: "camera", label: "Camera", options: CAMERA_OPTIONS },
  { key: "palette", label: "Color palette", options: PALETTE_OPTIONS },
  { key: "lighting", label: "Lighting", options: LIGHTING_OPTIONS },
];

export function FilmSetup() {
  const filmSetup = useComposer((s) => s.filmSetup);
  const setFilmSetup = useComposer((s) => s.setFilmSetup);

  return (
    <section
      aria-label="Film setup"
      className="flex flex-col gap-1 border-t border-zinc-800 px-4 py-4 sm:px-5"
    >
      <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Film setup
      </h3>
      <div className="mt-1 flex flex-col divide-y divide-zinc-800/70">
        {ROWS.map(({ key, label, options }) => (
          <div
            key={key}
            className="flex items-center justify-between gap-4 py-2.5"
          >
            <span className="text-sm text-zinc-300">{label}</span>
            <Select
              value={filmSetup[key]}
              onValueChange={(value) => setFilmSetup(key, value)}
            >
              <SelectTrigger
                aria-label={label}
                className="h-8 w-32 rounded-full border-zinc-700 bg-zinc-900 text-xs text-zinc-200 focus-visible:ring-zinc-600"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-900 text-zinc-200">
                {options.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="text-xs focus:bg-zinc-800 focus:text-zinc-100"
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </section>
  );
}
