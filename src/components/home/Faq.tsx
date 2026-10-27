import { getSite } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqHelpCard } from "@/components/ui/FaqHelpCard";
import { FaqList } from "@/components/ui/FaqList";

/**
 * Common farmer questions; answers open without JavaScript. From lg the
 * title and a "Still have a question?" card (ui/FaqHelpCard: ask Ka-Ezy, or
 * the team on WhatsApp) stay in view on the left while the questions scroll
 * on the right. On phones the card comes after the questions.
 */
export function Faq() {
  const { faq } = getSite();

  return (
    <Section id="faq" tone="subtle" labelledBy="faq-title">
      {/* No row gap: the header's own margin spaces it from the questions.
          Half and half from lg, 5/12 and 7/12 from xl: the left column (at
          least about 437px) keeps the card's two buttons side by side. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-14 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* The card is in the page twice, once per layout, so it is read and
            tabbed to where it is seen: in this panel from lg, after the
            questions below. The other copy is display:none for everyone. */}
        <div className="lg:sticky lg:top-32 lg:self-start">
          <SectionHeader id="faq-title" title={faq.title} intro={faq.intro} />
          <FaqHelpCard position="faq" className="hidden lg:block" />
        </div>

        <FaqList items={faq.items} />
        <FaqHelpCard position="faq" className="mt-8 lg:hidden" />
      </div>
    </Section>
  );
}
