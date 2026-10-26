import type { Accent } from "@/lib/content";

/** Product pages alternate white and tinted bands below the hero. */
export type BandTone = "white" | "surface";

// Extra per-product classes for the product pages, on top of ACCENTS in
// ui/accents.ts. Full class strings (not built from pieces) so Tailwind can
// find them. White text passes 4.5:1 on every `solid` and `band` colour.
export const TONES: Record<
  Accent,
  {
    /** Top of the hero gradient; the breadcrumb bar uses ACCENTS.soft to match. */
    heroFrom: string;
    /** Number badges: solid accent with white text. */
    solid: string;
    /** Strong border for boxes that must stand out (key facts). */
    strongBorder: string;
    /** Ring around the highlighted price card. */
    highlight: string;
    /** Step connector lines. */
    line: string;
    /** Soft decorative circle behind hero art. */
    blob: string;
    /** Closing "get the app" band. */
    band: string;
  }
> = {
  kaezy: {
    heroFrom: "from-kaezy-50",
    solid: "bg-kaezy-600 text-white",
    strongBorder: "border-kaezy-600",
    highlight: "ring-2 ring-kaezy-600",
    line: "bg-kaezy-600/20",
    blob: "bg-kaezy-600/10",
    band: "bg-linear-to-br from-kaezy-600 to-kaezy-900",
  },
  leaf: {
    heroFrom: "from-leaf-50",
    solid: "bg-leaf-700 text-white",
    strongBorder: "border-leaf-700",
    highlight: "ring-2 ring-leaf-700",
    line: "bg-leaf-700/20",
    blob: "bg-leaf-500/15",
    band: "bg-linear-to-br from-leaf-700 to-[#28633a]",
  },
  teal: {
    heroFrom: "from-teal-50",
    solid: "bg-teal-700 text-white",
    strongBorder: "border-teal-700",
    highlight: "ring-2 ring-teal-700",
    line: "bg-teal-700/20",
    blob: "bg-teal-500/15",
    band: "bg-linear-to-br from-teal-700 to-[#0b5a4b]",
  },
  amber: {
    heroFrom: "from-amber-50",
    solid: "bg-amber-700 text-white",
    strongBorder: "border-amber-700",
    highlight: "ring-2 ring-amber-700",
    line: "bg-amber-700/20",
    blob: "bg-amber-500/15",
    band: "bg-linear-to-br from-amber-700 to-[#924307]",
  },
};
