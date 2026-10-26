import Image from "next/image";
import type { IconName, Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Icon } from "@/components/ui/Icon";
import { TONES } from "./tones";

const COLUMN_ICONS: IconName[] = ["wallet", "calendar-clock"];

const TOP_UP = [
  { src: "/images/brand/mtn.webp", name: "MTN" },
  { src: "/images/brand/airtel.webp", name: "Airtel" },
];

/**
 * EzyCredits has no artwork, so its hero shows the two ways to pay as two
 * stacked cards (names and taglines from the comparison columns) and the
 * Mobile Money networks you top up with. No balances or amounts: anything
 * shown here would read as a promise.
 *
 * Hidden from screen readers: the comparison section further down says the
 * same thing in full.
 */
export function PayWaysVisual({ product }: { product: Product }) {
  const accent = ACCENTS[product.accent];
  const tone = TONES[product.accent];
  const [first, second] = product.comparison?.columns ?? [];

  return (
    <div aria-hidden="true" className="relative isolate mx-auto w-full max-w-xs px-2 py-6 sm:max-w-sm">
      <div className={`absolute inset-x-0 top-0 -z-10 mx-auto aspect-square w-full rounded-full ${tone.blob}`} />

      {first ? (
        <div className={`relative -rotate-3 rounded-3xl p-5 pb-10 text-white shadow-xl shadow-ink/20 sm:p-6 sm:pb-11 ${tone.band}`}>
          <div className="flex items-center gap-3">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-white/15">
              <Icon name={COLUMN_ICONS[0]} className="size-7" />
            </span>
            <span className="text-lg leading-tight font-extrabold sm:text-xl">{first.name}</span>
          </div>
          <div className="mt-8 flex items-end justify-between gap-3">
            <span className={`inline-block rounded-full bg-white px-3 py-1 text-sm font-bold ${accent.text}`}>
              {first.tagline}
            </span>
            {/* Card-chip detail; purely decorative. */}
            <span className="flex gap-1">
              <span className="size-6 rounded-full bg-white/30" />
              <span className="-ml-3 size-6 rounded-full bg-white/50" />
            </span>
          </div>
        </div>
      ) : null}

      {second ? (
        <div className="relative -mt-5 ml-6 rotate-2 rounded-3xl bg-white p-5 shadow-xl shadow-ink/10 ring-1 ring-line sm:ml-10 sm:p-6">
          <div className="flex items-center gap-3">
            <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${accent.soft} ${accent.text}`}>
              <Icon name={COLUMN_ICONS[1]} className="size-7" />
            </span>
            <span className="text-lg leading-tight font-extrabold text-ink sm:text-xl">
              {second.name}
            </span>
          </div>
          <div className="mt-6">
            <span className={`inline-block rounded-full px-3 py-1 text-sm font-bold ring-1 ${accent.text} ${accent.ring}`}>
              {second.tagline}
            </span>
          </div>
        </div>
      ) : null}

      <div className="relative mx-auto mt-6 flex w-fit items-center gap-3 rounded-full bg-white py-2 pr-2 pl-4 shadow-md ring-1 ring-line">
        <span className="text-sm font-bold text-muted">Top up with</span>
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
