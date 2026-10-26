import { visible, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";
import { Disclaimer } from "./Disclaimer";
import type { BandTone } from "./tones";

/** True when the page has questions or a disclaimer to show in this band. */
export function hasFaq(product: Product): boolean {
  return visible(product.faq).length > 0 || !!product.disclaimer;
}

/**
 * The disclaimer box, then the product's questions in a narrow column.
 * They share a band: the disclaimer is short and often answers the same
 * worry as a question below it (e.g. "Is Ka-Ezy always right?").
 */
export function ProductFaq({ product, tone }: { product: Product; tone: BandTone }) {
  const items = visible(product.faq);

  return (
    <Section id="faq" tone={tone} labelledBy={items.length > 0 ? "faq-title" : undefined}>
      <div className="mx-auto max-w-3xl">
        <Disclaimer product={product} className={items.length > 0 ? "mb-12" : ""} />
        {items.length > 0 ? (
          <>
            <SectionHeader
              id="faq-title"
              title={`Questions about ${product.name}`}
              align="center"
            />
            <FaqList items={items} />
          </>
        ) : null}
      </div>
    </Section>
  );
}
