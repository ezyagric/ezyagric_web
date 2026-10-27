import type { Product } from "@/lib/content";

export type TryIt = NonNullable<Product["tryIt"]>;

/** "Your farm": what the visitor tells Ka-Ezy about their farm. */
export type Profile = {
  /** A value chain label from tryIt.valueChains, e.g. "Maize"; "" when not chosen. */
  valueChain: string;
  location: string;
  /** As typed; see acresOf. */
  acres: string;
  name: string;
};

export const EMPTY_PROFILE: Profile = { valueChain: "", location: "", acres: "", name: "" };

/**
 * "2.50" -> 2.5, "2,5" -> 2.5, "1,000" -> 1000; anything that is not a
 * number from 0.01 to 10,000 -> null.
 */
export function acresOf(profile: Profile): number | null {
  const raw = profile.acres.trim();
  const text = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw) ? raw.replace(/,/g, "") : raw.replace(",", ".");
  const value = Number(text);
  return Number.isFinite(value) && Math.round(value * 100) > 0 && value <= 10_000 ? value : null;
}

/** 2.5 -> "2.5", 2 -> "2", 1.234 -> "1.23" */
export function formatAcres(value: number): string {
  return String(Math.round(value * 100) / 100);
}

/** 1 -> "1 acre", 2.5 -> "2.5 acres" */
export function acresText(value: number): string {
  const n = formatAcres(value);
  return `${n} ${n === "1" ? "acre" : "acres"}`;
}

export function kindOf(valueChain: string, groups: TryIt["valueChains"]): TryIt["valueChains"][number]["kind"] | null {
  return groups.find((group) => group.items.includes(valueChain))?.kind ?? null;
}

// The birds among the app's value chains (the app checks them as "birds").
const BIRDS = ["Poultry", "Duck", "Turkey", "Quail", "Ostrich"];

/**
 * The app's photo check category for the chosen value chain: crops, birds
 * or animals ("" when none is chosen, or for fish, bees and mushrooms).
 */
export function diagnosisCategory(profile: Profile, groups: TryIt["valueChains"]): "crops" | "birds" | "animals" | "" {
  const kind = kindOf(profile.valueChain, groups);
  if (kind === "crop") return "crops";
  if (kind === "livestock") return BIRDS.includes(profile.valueChain) ? "birds" : "animals";
  return "";
}

/**
 * Fills {name}, {crop}, {location} and {acres} ("2 acres", "1 acre"; plus any `extra` values)
 * from the farm details. A [[ ]] part is dropped when one of the details in
 * it is missing, so "[[{name}, ]]the best crop" reads "The best crop" for a
 * visitor who gave no name. Paragraph starts are capitalised afterwards.
 */
export function fill(template: string, profile: Profile, extra: Record<string, string> = {}): string {
  const acres = acresOf(profile);
  const values: Record<string, string> = {
    name: profile.name.trim(),
    crop: profile.valueChain,
    location: profile.location.trim(),
    acres: acres ? acresText(acres) : "",
    ...extra,
  };
  return template
    .replace(/\[\[([\s\S]*?)\]\]/g, (_, part: string) =>
      [...part.matchAll(/\{(\w+)\}/g)].every(([, key]) => values[key]) ? part : "",
    )
    .replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match)
    .replace(/(^|\n[ \t]*)([a-z])/g, (_, start: string, letter: string) => start + letter.toUpperCase());
}

/** The starter questions for the chosen value chain, with their answers filled in. */
export function promptsFor(chat: TryIt["chat"], groups: TryIt["valueChains"], profile: Profile) {
  const kind = kindOf(profile.valueChain, groups);
  const set =
    kind === "crop"
      ? chat.cropPrompts
      : kind === "livestock"
        ? chat.livestockPrompts
        : kind === "other"
          ? chat.otherPrompts
          : chat.prompts;
  return set.map((prompt) => ({ q: fill(prompt.q, profile), a: fill(prompt.a, profile) }));
}
