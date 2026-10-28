import Image from "next/image";
import type { IconName, Product } from "@/lib/content";
import { IconCircle } from "@/components/ui/IconCircle";

const REPAY_WITH = [
  { src: "/images/brand/mtn.webp", name: "MTN" },
  { src: "/images/brand/airtel.webp", name: "Airtel" },
];

// The order of things with Pay Later, as the steps and key facts say it
// (only for those approved, as the card says).
const ORDER: { icon: IconName; text: string }[] = [
  { icon: "truck", text: "If approved, get your order now" },
  { icon: "hand-coins", text: "Repay after delivery" },
];

/**
 * EzyCredits has no artwork, so its hero shows Pay Later as two stacked
 * cards: a Dark Navy card with a green highlight (an approved combination)
 * naming it with its tagline, then a white card with the order of things
 * (your order first, then you repay), and the Mobile Money networks you
 * repay with. Brand colours only. No limits or amounts: anything shown here
 * would read as a promise.
 *
 * Hidden from screen readers: the steps and key facts further down say the
 * same thing in full.
 */
export function PayLaterVisual({ product }: { product: Product }) {
  return (
    <div aria-hidden="true" className="relative isolate mx-auto w-full max-w-xs px-2 py-6 sm:max-w-sm">
      {/* Soft near-white disc behind the cards. */}
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto aspect-square w-full rounded-full bg-brand-soft" />

      <div className="relative rounded-card bg-inverse p-5 pb-10 text-on-inverse shadow-raised sm:p-6 sm:pb-11">
        <div className="flex items-center gap-3">
          <IconCircle name="calendar-clock" color="accent" />
          <span className="text-lg leading-tight font-heading sm:text-xl">{product.name}</span>
        </div>
        <div className="mt-8 flex items-end justify-between gap-3">
          <span className="inline-block rounded-pill bg-accent px-3 py-1 text-sm font-label text-on-primary">
            {product.appTagline}
          </span>
          {/* Card-chip detail; purely decorative. */}
          <span className="flex">
            <span className="size-6 rounded-full bg-on-inverse/25" />
            <span className="-ml-3 size-6 rounded-full bg-accent-bright/80" />
          </span>
        </div>
      </div>

      <div className="relative -mt-5 ml-6 rounded-card border border-line bg-card p-5 shadow-raised sm:ml-10 sm:p-6">
        <div className="grid gap-3">
          {ORDER.map((item) => (
            <div key={item.text} className="flex items-center gap-3">
              <IconCircle name={item.icon} color="brand" size="sm" />
              <span className="font-label text-title">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="relative mx-auto mt-6 flex w-fit items-center gap-3 rounded-pill border border-line bg-card py-2 pr-2 pl-4 shadow-card">
        <span className="text-sm font-label text-body">Repay with</span>
        {REPAY_WITH.map((network) => (
          <Image
            key={network.name}
            src={network.src}
            alt=""
            width={120}
            height={120}
            sizes="40px"
            className="size-10 rounded-media"
          />
        ))}
      </div>
    </div>
  );
}
