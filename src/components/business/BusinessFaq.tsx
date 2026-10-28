import { getBusiness, visible } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";
import type { BandTone } from "@/components/product/tones";

/**
 * Questions about EzyAgric Business, in the site's numbered FAQ panel
 * (answers open without JavaScript). No "Still have a question?" card: its
 * Try Ka-Ezy button is for farmers, and the pricing band above already
 * gives every way to reach the team.
 */
export function BusinessFaq({ tone }: { tone: BandTone }) {
  const { faq } = getBusiness();
  const items = visible(faq.items);
  if (items.length === 0) return null;

  return (
    <Section id="faq" tone={tone} labelledBy="faq-title">
      <SectionHeader id="faq-title" eyebrow={faq.eyebrow} title={faq.title} wide />
      <div className="max-w-4xl">
        <FaqList items={items} />
      </div>
    </Section>
  );
}
