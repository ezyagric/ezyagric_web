import { Info } from "lucide-react";
import type { Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";

/** An info box for the product's disclaimer (e.g. "AI advice can be wrong"). */
export function Disclaimer({ product, className = "" }: { product: Product; className?: string }) {
  if (!product.disclaimer) return null;
  const accent = ACCENTS[product.accent];

  return (
    <div
      role="note"
      className={`flex items-start gap-4 rounded-2xl border bg-white p-5 shadow-sm sm:p-6 ${accent.border} ${className}`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full ${accent.soft} ${accent.text}`}
      >
        <Info aria-hidden="true" className="size-5" />
      </span>
      <p className="text-base text-pretty text-ink">
        <strong className="block font-extrabold">Please note</strong>
        {product.disclaimer}
      </p>
    </div>
  );
}
