import { Info } from "lucide-react";
import type { Accent, Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";

// The product's accent as a soft tint, as on the home page's service cards.
// Full class strings so Tailwind finds them.
const TINTS: Record<Accent, string> = {
  brand: "bg-brand-soft",
  accent: "bg-accent-soft",
  deep: "bg-brand-soft-strong",
};

/**
 * The product's disclaimer (e.g. "AI advice can be wrong") as a compact
 * notice: a soft tint of the product's colour with a bar of it down the left
 * edge, and a white "i" in a solid circle of it beside "Please note". The
 * text stays body colour: small green text falls below 4.5:1 on the tints.
 */
export function Disclaimer({ product, className = "" }: { product: Product; className?: string }) {
  if (!product.disclaimer) return null;
  const accent = ACCENTS[product.accent];

  return (
    <div
      role="note"
      className={`relative flex items-start gap-3 overflow-hidden rounded-card py-4 pr-4 pl-5 sm:pr-5 ${TINTS[product.accent]} ${className}`}
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${accent.bar}`} />
      <span
        aria-hidden="true"
        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${accent.icon}`}
      >
        <Info className="size-[18px]" strokeWidth={1.75} />
      </span>
      {/* pt-2: "Please note" sits level with the middle of the circle. */}
      <p className="min-w-0 pt-2 text-base text-pretty text-body">
        <strong className="block text-sm text-label-style text-label">
          Please note<span className="sr-only">:</span>
        </strong>
        {product.disclaimer}
      </p>
    </div>
  );
}
