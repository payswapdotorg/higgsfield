/**
 * Deterministic username suggestion (no Math.random, no wall-clock).
 *
 * FNV-1a 32-bit hash of the email → two word-list picks + a 4-digit number
 * derived from disjoint hash bits, e.g. `radiatingcapybara1609`.
 */

const ADJECTIVES = [
  "radiating",
  "lucid",
  "vivid",
  "electric",
  "silent",
  "velvety",
  "prismatic",
  "lunar",
  "stellar",
  "feral",
  "golden",
  "misty",
  "resonant",
  "crystalline",
  "dormant",
  "emerald",
  "sable",
  "auroral",
  "drifting",
  "hollow",
  "iridescent",
  "nimble",
  "obsidian",
  "tranquil",
] as const;

const ANIMALS = [
  "capybara",
  "falcon",
  "otter",
  "panther",
  "heron",
  "lynx",
  "mongoose",
  "penguin",
  "narwhal",
  "badger",
  "cricket",
  "ibis",
  "jackal",
  "koala",
  "lemur",
  "marmot",
  "newt",
  "ocelot",
  "quokka",
  "raven",
  "tapir",
  "walrus",
  "xenops",
  "yak",
] as const;

/** FNV-1a 32-bit hash, returned as an unsigned 32-bit integer. */
export function fnv1a(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Deterministic 32-char lowercase hex string derived from `seed`. */
export function stableHex32(seed: string): string {
  let hex = "";
  for (let i = 0; i < 4; i++) {
    hex += fnv1a(`${seed}#${i}`).toString(16).padStart(8, "0");
  }
  return hex;
}

/** Deterministic username suggestion for an email, e.g. `radiatingcapybara1609`. */
export function suggestUsername(email: string): string {
  const hash = fnv1a(email.trim().toLowerCase());
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const animal = ANIMALS[(hash >>> 8) % ANIMALS.length];
  const digits = String((hash >>> 16) % 10000).padStart(4, "0");
  return `${adjective}${animal}${digits}`;
}
