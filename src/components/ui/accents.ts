import type { Accent } from "@/lib/content";

// Full class strings (not built from pieces) so Tailwind can find them.
// `text` and `button` colours pass 4.5:1 contrast; `soft` is a tint for backgrounds.
export const ACCENTS: Record<
  Accent,
  { text: string; soft: string; border: string; button: string; ring: string; bar: string }
> = {
  kaezy: {
    text: "text-kaezy-600",
    soft: "bg-kaezy-50",
    border: "border-kaezy-600/25",
    button: "bg-kaezy-600 hover:bg-kaezy-900 text-white",
    ring: "ring-kaezy-600/20",
    bar: "bg-kaezy-600",
  },
  leaf: {
    text: "text-leaf-700",
    soft: "bg-leaf-50",
    border: "border-leaf-700/25",
    button: "bg-leaf-700 hover:bg-[#28633a] text-white",
    ring: "ring-leaf-700/20",
    bar: "bg-leaf-500",
  },
  teal: {
    text: "text-teal-700",
    soft: "bg-teal-50",
    border: "border-teal-700/25",
    button: "bg-teal-700 hover:bg-[#0b5a4b] text-white",
    ring: "ring-teal-700/20",
    bar: "bg-teal-500",
  },
  amber: {
    text: "text-amber-700",
    soft: "bg-amber-50",
    border: "border-amber-700/25",
    button: "bg-amber-700 hover:bg-[#924307] text-white",
    ring: "ring-amber-700/20",
    bar: "bg-amber-500",
  },
};
