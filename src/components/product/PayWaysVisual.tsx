import Image from "next/image";
import type { Product } from "@/lib/content";
import { IconCircle } from "@/components/ui/IconCircle";

const TOP_UP = [
  { src: "/images/brand/mtn.webp", name: "MTN" },
  { src: "/images/brand/airtel.webp", name: "Airtel" },
];

/**
 * EzyCredits has no artwork, so its hero shows the two ways to pay as two
 * stacked cards (names and taglines from the comparison columns) and the
 * Mobile Money networks you top up with. Brand colours only: a Dark Navy
 * card with a green highlight (an approved combination), then a white card
 * with a blue icon. No balances or amounts: anything shown here would read
 * as a promise.
 *
 * Hidden from screen readers: the comparison section further down says the
 * same thing in full.
 */
export function PayWaysVisual({ product }: { product: Product }) {
  const [first, second] = product.comparison?.columns ?? [];

  return (
    <div aria-hidden="true" className="relative isolate mx-auto w-full max-w-xs px-2 py-6 sm:max-w-sm">
      {/* Soft near-white disc behind the cards. */}
      <div className="absolute inset-x-0 top-0 -z-10 mx-auto aspect-square w-full rounded-full bg-brand-50" />

      {first ? (
        <div className="relative rounded-lg bg-ink p-5 pb-10 text-white shadow-xl shadow-ink/20 sm:p-6 sm:pb-11">
          <div className="flex items-center gap-3">
            <IconCircle name="wallet" color="green" />
            <span className="text-lg leading-tight font-bold sm:text-xl">{first.name}</span>
          </div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <span className="inline-block rounded-full bg-leaf-700 px-3 py-1 text-sm font-semibold text-white">
              {first.tagline}
            </span>
            {/* Card-chip detail; purely decorative. */}
            <span className="flex">
              <span className="size-6 rounded-full bg-white/25" />
              <span className="-ml-3 size-6 rounded-full bg-leaf-500/80" />
            </span>
          </div>
        </div>
      ) : null}

      {second ? (
        <div className="relative -mt-5 ml-6 rounded-lg border border-line bg-white p-5 shadow-xl shadow-ink/10 sm:ml-10 sm:p-6">
          <div className="flex items-center gap-3">
            <IconCircle name="calendar-clock" color="blue" />
            <span className="text-lg leading-tight font-bold text-ink sm:text-xl">{second.name}</span>
          </div>
          <div className="mt-6">
            <span className="inline-block rounded-full border-2 border-brand-700 px-3 py-0.5 text-sm font-semibold text-brand-700">
              {second.tagline}
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto mt-6 flex w-fit items-center gap-3 rounded-full border border-line bg-white py-2 pr-2 pl-4 shadow-md">
        <span className="text-sm font-semibold text-ink">Top up with</span>
        {TOP_UP.map((network) => (
          <Image
            key={network.name}
            src={network.src}
            alt=""
            width={120}
            height={120}
            sizes="40px"
            className="size-10 rounded-lg"
          />
        ))}
      </div>
    </div>
  );
}
