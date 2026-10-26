import { visible, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import type { BandTone } from "./tones";

/**
 * What the product does: one card per feature (guide card style: card
 * background, line border, card radius, title colour), led by a white icon
 * in a solid circle of the product's brand colour.
 */
export function FeatureGrid({ product, tone }: { product: Product; tone: BandTone }) {
  const { features } = product;

  return (
    <Section id="features" tone={tone} labelledBy="features-title">
      <SectionHeader id="features-title" title={features.title} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visible(features.items).map((item) => (
          <li key={item.title} className="rounded-card border border-line bg-card p-5 sm:p-6">
            <IconCircle name={item.icon ?? product.icon} color={product.accent} />
            <h3 className="mt-4 text-lg font-heading text-title">
              {item.title}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </h3>
            <p className="mt-1 text-base text-pretty text-body">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
