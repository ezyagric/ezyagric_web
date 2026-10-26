import type { Accent } from "@/lib/content";

// Product accents in the three brand colours. Full class strings (not built
// from pieces) so Tailwind can find them. `text` passes 4.5:1;
// `icon` is the solid circle behind white icons (guide: blue, green or navy).
export const ACCENTS: Record<
  Accent,
  { text: string; soft: string; border: string; ring: string; bar: string; icon: string }
> = {
  blue: {
    text: "text-brand-700",
    soft: "bg-brand-50",
    border: "border-brand-700/25",
    ring: "ring-brand-700/20",
    bar: "bg-brand-700",
    icon: "bg-brand-700 text-white",
  },
  green: {
    text: "text-leaf-700",
    soft: "bg-leaf-50",
    border: "border-leaf-700/25",
    ring: "ring-leaf-700/20",
    bar: "bg-leaf-500",
    icon: "bg-leaf-500 text-white",
  },
  navy: {
    text: "text-ink",
    soft: "bg-surface",
    border: "border-ink/20",
    ring: "ring-ink/15",
    bar: "bg-ink",
    icon: "bg-ink text-white",
  },
};
