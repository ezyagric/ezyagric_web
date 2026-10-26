import { getSite } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";

/** Common farmer questions in a narrow column; answers open without JavaScript. */
export function Faq() {
  const { faq } = getSite();

  return (
    <Section id="faq" tone="surface" labelledBy="faq-title">
      <div className="mx-auto max-w-3xl">
        <SectionHeader id="faq-title" title={faq.title} align="center" />
        <FaqList items={faq.items} />
      </div>
    </Section>
  );
}
