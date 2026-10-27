import { visible, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqHelpCard } from "@/components/ui/FaqHelpCard";
import { FaqList } from "@/components/ui/FaqList";
import { Disclaimer } from "./Disclaimer";
import type { BandTone } from "./tones";

/** True when the page has questions or a disclaimer to show in this band. */
export function hasFaq(product: Product): boolean {
  return visible(product.faq).length > 0 || !!product.disclaimer;
}

// Up to four questions get the short layout: four one-line ones (about
// 287px) are shorter than the title and card stacked beside them (307px+).
const SHORT_LIST = 4;

/**
 * The product's questions, laid out like the home page's FAQ (answers open
 * without JavaScript), with the "Still have a question?" card. From lg:
 * - five or more questions: the title, the disclaimer and the card stay in
 *   view on the left while the numbered questions scroll on the right; the
 *   title's top is level with the first question's.
 * - up to four (Produce Market): the title across the top, then the
 *   questions with the card beside them on the right, so both columns end
 *   close together rather than the questions stopping well above the card.
 * On phones it is always the title, the disclaimer, the questions, the card.
 * The disclaimer shares the band: it is short and often answers the same
 * worry as a question (e.g. "Is Ka-Ezy always right?").
 */
export function ProductFaq({ product, tone }: { product: Product; tone: BandTone }) {
  const items = visible(product.faq);

  // A disclaimer without questions: the notice on its own.
  if (items.length === 0) {
    return (
      <Section id="faq" tone={tone}>
        <Disclaimer product={product} className="mx-auto max-w-3xl" />
      </Section>
    );
  }

  const title = `Questions about ${product.name}`;
  // The page's own position, so the reports can tell the cards apart.
  const position = `faq-${product.slug}`;
  // The Try Ka-Ezy buttons (help card and answers) know the page, so on the
  // Ka-Ezy page they never link back to the same page (see kaezyTryHref).
  const helpCard = (className: string) => (
    <FaqHelpCard position={position} page={product.slug} className={className} />
  );

  if (items.length <= SHORT_LIST) {
    return (
      <Section id="faq" tone={tone} labelledBy="faq-title">
        <SectionHeader id="faq-title" title={title} wide />
        {/* -mt-4: closer to the title than the header's own margin. */}
        <Disclaimer product={product} className="-mt-4 mb-6" />
        {/* Half and half from lg, 7/12 and 5/12 from xl: the card's column
            (at least about 443px) keeps its two buttons side by side. */}
        <div className="grid gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <FaqList items={items} page={product.slug} />
          {helpCard("lg:sticky lg:top-32 lg:self-start")}
        </div>
      </Section>
    );
  }

  return (
    <Section id="faq" tone={tone} labelledBy="faq-title">
      {/* The home FAQ's grid with a 40px gap: the 5/12 column from xl is then
          about 443px, room for "Questions about EzyCredits" (438px) on one
          line and for the card's two buttons side by side. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The card is in the page twice, once per layout, so it is read and
            tabbed to where it is seen: in this panel from lg, after the
            questions below. The other copy is display:none for everyone. */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeader id="faq-title" title={title} />
          {/* -mt-4: closer to the title than the header's own margin. */}
          <Disclaimer product={product} className="-mt-4 mb-6 lg:mb-4" />
          {helpCard("hidden lg:block")}
        </div>

        <FaqList items={items} page={product.slug} />
        {helpCard("mt-8 lg:hidden")}
      </div>
    </Section>
  );
}
