import type { Accent } from "@/lib/content";

// Product accents (brand, accent, deep) as semantic theme tokens. Full class
// strings (not built from pieces) so Tailwind can find them. `icon` is the
// solid circle behind a glyph; `bar` is a decorative accent bar.
export const ACCENTS: Record<
  Accent,
  { bar: string; icon: string }
> = {
  brand: {
    bar: "bg-brand",
    icon: "bg-brand text-on-brand",
  },
  accent: {
    bar: "bg-accent-bright",
    icon: "bg-accent-bright text-on-accent",
  },
  deep: {
    bar: "bg-inverse",
    icon: "bg-inverse text-on-inverse",
  },
};
