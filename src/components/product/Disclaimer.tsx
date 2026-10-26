import { Info } from "lucide-react";
import type { Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";

/**
 * An info box for the product's disclaimer (e.g. "AI advice can be wrong"):
 * the guide's card style, led by a white glyph in a solid circle of the
 * product's colour.
 */
export function Disclaimer({ product, className = "" }: { product: Product; className?: string }) {
  if (!product.disclaimer) return null;
  const accent = ACCENTS[product.accent];

  return (
    <div
      role="note"
      className={`flex items-start gap-4 rounded-card border border-line bg-card p-5 sm:p-6 ${className}`}
    >
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent.icon}`}>
        <Info aria-hidden="true" className="size-5" strokeWidth={1.75} />
      </span>
      <p className="text-base text-pretty text-body">
        <strong className="block font-heading">Please note</strong>
        {product.disclaimer}
      </p>
    </div>
  );
}
