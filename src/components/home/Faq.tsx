import { getSite, isVisible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { FaqList } from "@/components/ui/FaqList";
import { Icon } from "@/components/ui/Icon";
import { KAEZY_AVATAR, kaezyTryHref } from "@/components/promo/KaEzyBanner";

/**
 * Common farmer questions; answers open without JavaScript. From lg the
 * title and a "Still have a question?" card (ask Ka-Ezy, or the team on
 * WhatsApp) stay in view on the left while the questions scroll on the
 * right. On phones the card comes after the questions.
 */
export function Faq() {
  const { faq, contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;

  return (
    <Section id="faq" tone="subtle" labelledBy="faq-title">
      {/* No row gap: the header's own margin spaces it from the questions.
          The left column is wide enough (about 424px from lg) for the card's
          two buttons to sit side by side: half the width, 5/12 from xl. */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-x-14 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* contents below lg: the header and the card become grid items, so
            the card can move after the questions (order-last). */}
        <div className="contents lg:sticky lg:top-32 lg:block lg:self-start">
          <SectionHeader id="faq-title" title={faq.title} intro={faq.intro} />
          {faq.help ? (
            <div className="relative isolate order-last mt-8 overflow-hidden rounded-card bg-inverse p-6 text-on-inverse lg:order-none lg:mt-0">
              <Icon
                name="message-circle"
                className="absolute -right-8 -bottom-10 -z-10 size-44 -rotate-12 text-on-inverse/10"
              />
              <div className="flex items-center gap-3">
                <span className="flex size-12 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card">
                  {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
                  <img src={KAEZY_AVATAR} alt="" width={200} height={178} loading="lazy" className="w-11" />
                </span>
                <h3 className="text-xl font-heading text-on-inverse">{faq.help.title}</h3>
              </div>
              <p className="mt-3 text-base text-pretty text-on-inverse">{faq.help.text}</p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink
                  href={kaezyTryHref()}
                  track="kaezy_try_faq"
                  className="w-full whitespace-nowrap sm:w-auto"
                >
                  <Icon name="bot" className="size-5 shrink-0" />
                  {faq.help.kaezy}
                </ButtonLink>
                {whatsapp ? (
                  <ButtonLink
                    href={whatsappUrl(whatsapp.number, whatsapp.message)}
                    variant="secondary"
                    track="whatsapp_click"
                    trackProps={{ position: "faq" }}
                    className="w-full whitespace-nowrap sm:w-auto"
                  >
                    <Icon name="message-circle" className="size-5 shrink-0" />
                    {faq.help.whatsapp}
                  </ButtonLink>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>

        <FaqList items={faq.items} />
      </div>
    </Section>
  );
}
