import { visible, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PendingBadge } from "@/components/ui/Pending";
import type { BandTone } from "./tones";

/** What the product does: one icon-led card per feature. */
export function FeatureGrid({ product, tone }: { product: Product; tone: BandTone }) {
  const accent = ACCENTS[product.accent];
  const { features } = product;

  return (
    <Section id="features" tone={tone} labelledBy="features-title">
      <SectionHeader id="features-title" title={features.title} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visible(features.items).map((item) => (
          <li key={item.title} className="rounded-2xl border border-line bg-white p-5 shadow-sm sm:p-6">
            <span
              className={`flex size-12 items-center justify-center rounded-xl ${accent.soft} ${accent.text}`}
            >
              <Icon name={item.icon ?? product.icon} className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-ink">
              {item.title}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </h3>
            <p className="mt-1 text-base text-pretty text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
