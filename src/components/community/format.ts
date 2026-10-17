import { formatDistanceToNowStrict } from "date-fns";

/** Short unit abbreviations for compact relative times ("3d ago"). */
const SHORT_UNITS: Record<string, string> = {
  second: "s",
  minute: "m",
  hour: "h",
  day: "d",
  week: "w",
  month: "mo",
  year: "y",
};

/**
 * Compact engagement formatter: 999 → "999", 12840 → "12.8k", 100000 → "100k",
 * 2500000 → "2.5M".
 */
export function formatCompact(n: number): string {
  if (n < 1_000) return String(n);
  const trim = (v: number) => (v >= 100 ? Math.round(v) : Number(v.toFixed(1)));
  if (n < 1_000_000) return `${trim(n / 1_000)}k`;
  return `${trim(n / 1_000_000)}M`;
}

/**
 * Short relative time ("3d ago", "5h ago") built on date-fns
 * formatDistanceToNowStrict — no wall-clock-driven output variation beyond the
 * data's own age.
 */
export function shortAgo(iso: string): string {
  const distance = formatDistanceToNowStrict(new Date(iso)); // e.g. "3 days"
  const [value, unit] = distance.split(" ");
  if (!unit) return `${distance} ago`;
  const singular = unit.replace(/s$/, "").toLowerCase();
  const short = SHORT_UNITS[singular] ?? singular;
  return `${value}${short} ago`;
}
