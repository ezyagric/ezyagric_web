import type { BusinessModuleWithProduct } from "@/lib/content";

/**
 * Set to false if Marketing prefers one colour for the module names: by
 * default "Ezy" is set in Vibrant Green ("EzySupplier"), like "Ezy" in the
 * home headline. The names stay plain text either way.
 */
export const TWO_TONE_NAMES = true;

/** "EzySupplier" -> ["Ezy", "Supplier"]; null when two-tone names are off or the name does not start with Ezy. */
export function splitEzy(name: string): [string, string] | null {
  if (!TWO_TONE_NAMES) return null;
  const match = /^(Ezy)(\S+)$/.exec(name);
  return match ? [match[1], match[2]] : null;
}

/**
 * Each chapter's page: white paper (EzySupplier), a green tint (EzyProduce),
 * a navy lender's statement (EzyCredits) or a blue tint (EzyServices).
 */
export type LookName = "paper" | "green" | "ink" | "blue";

export function lookName(module: BusinessModuleWithProduct): LookName {
  const { accent } = module.product;
  if (accent === "deep") return "ink";
  if (accent === "brand") return "blue";
  // Agrishop and Produce Market share the green accent: the device mockup
  // (EzyProduce) takes the green page, the window screen (EzySupplier) paper.
  return module.screen.frame ? "paper" : "green";
}

export type ChapterLook = {
  page: string;
  tab: string;
  /** A coloured bar along the top of the page, if any. */
  bar?: string;
  /** The Contents card's index tab. */
  swatch: string;
  contentsNum: string;
  /** The ring round the tab when the chapter is the page's target. */
  halo: string;
  eyebrow: string;
  name: string;
  ezy: string;
  text: string;
  muted: string;
  num: string;
  rule: string;
  margin: string;
  mark: string;
  windowRing: string;
  loupeRing: string;
  tear: string;
  linkText: string;
  arrow: string;
  tile: string;
};

// Full class strings so Tailwind can find them. Small green text only where
// it passes (accent on white 5.1, on accent-soft 4.5; accent-bright on navy
// 4.7); the blue page numbers in brand blue, never small green on brand-soft.
export const LOOKS: Record<LookName, ChapterLook> = {
  paper: {
    page: "bg-card ring-1 ring-line shadow-card",
    tab: "bg-accent text-on-accent",
    bar: "bg-accent",
    swatch: "bg-accent-bright",
    contentsNum: "text-accent-bright",
    halo: "outline-accent-soft-strong",
    eyebrow: "text-label",
    name: "text-heading",
    ezy: "text-accent-bright",
    text: "text-body",
    muted: "text-muted",
    num: "text-accent",
    rule: "divide-line border-line",
    margin: "before:bg-line",
    mark: "text-accent-bright opacity-[0.07]",
    windowRing: "ring-line",
    loupeRing: "ring-card",
    tear: "border-brand-soft-strong",
    linkText: "text-link",
    arrow: "bg-accent-bright text-on-accent",
    tile: "shadow-card",
  },
  green: {
    page: "bg-accent-soft ring-1 ring-accent-soft-strong",
    tab: "bg-accent text-on-accent",
    swatch: "bg-accent",
    contentsNum: "text-accent",
    halo: "outline-accent-soft-strong",
    eyebrow: "text-label",
    name: "text-heading",
    ezy: "text-accent-bright",
    text: "text-body",
    muted: "text-muted",
    num: "text-accent",
    rule: "divide-accent-soft-strong border-accent-soft-strong",
    margin: "before:bg-accent-soft-strong",
    mark: "text-accent-bright opacity-10",
    windowRing: "ring-accent-soft-strong",
    loupeRing: "ring-accent-soft",
    tear: "border-accent-soft-strong",
    linkText: "text-link",
    arrow: "bg-accent-bright text-on-accent",
    tile: "shadow-card",
  },
  ink: {
    page: "bg-inverse text-on-inverse ring-1 ring-inverse shadow-raised",
    tab: "bg-inverse text-on-inverse",
    swatch: "bg-inverse",
    contentsNum: "text-title",
    halo: "outline-inverse/20",
    eyebrow: "text-on-inverse/80",
    name: "text-on-inverse",
    ezy: "text-accent-bright",
    text: "text-on-inverse",
    muted: "text-on-inverse/80",
    num: "text-accent-bright",
    rule: "divide-on-inverse/15 border-on-inverse/15",
    margin: "before:bg-on-inverse/15",
    mark: "text-on-inverse opacity-[0.06]",
    windowRing: "ring-on-inverse/20",
    loupeRing: "ring-inverse",
    tear: "border-on-inverse/25",
    linkText: "text-on-inverse",
    arrow: "bg-accent-bright text-on-accent",
    // The navy wallet tile would vanish on the navy page without a ring.
    tile: "ring-1 ring-on-inverse/30",
  },
  blue: {
    page: "bg-brand-soft ring-1 ring-brand-soft-strong",
    tab: "bg-brand text-on-brand",
    swatch: "bg-brand",
    contentsNum: "text-brand",
    halo: "outline-brand-soft-strong",
    eyebrow: "text-label",
    name: "text-heading",
    ezy: "text-accent-bright",
    text: "text-body",
    muted: "text-muted",
    num: "text-brand",
    rule: "divide-brand-soft-strong border-brand-soft-strong",
    margin: "before:bg-brand-soft-strong",
    mark: "text-brand opacity-[0.07]",
    windowRing: "ring-brand-soft-strong",
    loupeRing: "ring-brand-soft",
    tear: "border-brand-soft-strong",
    linkText: "text-link",
    arrow: "bg-brand text-on-brand",
    tile: "shadow-card",
  },
};
