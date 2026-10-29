import { CircleCheck } from "lucide-react";
import { getBusiness, getBusinessModules, getSite, isVisible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { ACCENTS } from "@/components/ui/accents";
import { ButtonLink } from "@/components/ui/Button";
import { ContactRows } from "@/components/ui/ContactRows";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import type { BandTone } from "@/components/product/tones";
import { PhotoPrint } from "./PhotoPrint";
import { PromiseDot } from "./PromiseMarks";

/**
 * Pricing as a quotation slip: the slip (its label and a "Custom quote"
 * stamp, the title, line items like a quote's, with the four modules as
 * chips, and the price line in large green: "Custom"), torn along a dashed
 * line from its stub (the office photo as a clipped print, "Talk to our
 * team", the WhatsApp button and every channel as full-row links). The stub
 * is below the slip on phones and beside it from lg.
 */
export function BusinessPricing({ tone }: { tone: BandTone }) {
  const { pricing } = getBusiness();
  const modules = getBusinessModules();
  const { contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const { slip, stub } = pricing;

  return (
    <Section id="pricing" tone={tone} labelledBy="pricing-title">
      <div className="relative overflow-clip rounded-media bg-card shadow-raised ring-1 ring-line lg:grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="p-5 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-label-style text-label">{slip.label}</p>
            <span
              aria-hidden="true"
              className="inline-flex -rotate-6 items-center gap-1.5 rounded-control border-2 border-accent px-2.5 py-1 text-sm text-label-style text-accent forced-colors:border-[CanvasText]"
            >
              <CircleCheck className="size-4" />
              {slip.stamp}
            </span>
          </div>
          <h2 id="pricing-title" className="mt-3 text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl">
            {pricing.title}
          </h2>
          <dl className="mt-6 divide-y divide-dashed divide-line border-y border-line">
            {slip.rows.map((row) => (
              <div key={row.label} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
                <dt className="text-sm text-label-style text-muted">{row.label}</dt>
                <dd className="text-base font-label text-title">
                  {row.promise ? (
                    <span className="inline-flex items-start gap-2">
                      <PromiseDot kind={row.promise} />
                      {row.value}
                    </span>
                  ) : (
                    row.value
                  )}
                  {row.modules ? (
                    // role="list": Safari drops the list role from unstyled lists.
                    <ul role="list" className="mt-2 flex flex-wrap gap-2">
                      {modules.map((module) => (
                        <li
                          key={module.id}
                          className="inline-flex items-center gap-1.5 rounded-pill border border-line bg-subtle px-2.5 py-0.5 text-sm font-label text-title"
                        >
                          <span aria-hidden="true" className={`size-2 rounded-full ${ACCENTS[module.product.accent].bar}`} />
                          {module.name}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
          <dl className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1 rounded-card bg-subtle px-5 py-4">
            <dt className="text-sm text-label-style text-label">{slip.price.label}</dt>
            {/* Large text, so accent-bright passes (3.7:1). */}
            <dd className="text-4xl/none font-heading tracking-heading text-accent-bright sm:text-5xl/none">
              {slip.price.value}
            </dd>
          </dl>
          <p className="mt-4 text-lg text-pretty text-body">{pricing.text}</p>
        </div>

        <div className="relative border-t-2 border-dashed border-brand-soft-strong p-5 sm:grid sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-start sm:gap-6 sm:p-8 lg:block lg:border-t-0 lg:border-l-2 lg:p-10">
          {/* The tear's notches: circles in the band's colour (bg-subtle while
              this band is tinted) bitten out of the card's edge. */}
          <span aria-hidden="true" className="absolute -top-3 -left-3 size-6 rounded-full bg-subtle" />
          <span
            aria-hidden="true"
            className="absolute -top-3 -right-3 size-6 rounded-full bg-subtle lg:top-auto lg:right-auto lg:-bottom-3 lg:-left-3"
          />
          <PhotoPrint
            image={pricing.image}
            sizes="(min-width: 1024px) 384px, (min-width: 640px) 208px, calc(100vw - 72px)"
            className="mx-auto w-full max-w-sm rotate-[1.5deg] sm:mx-0"
          />
          <div className="mt-8 sm:mt-0 lg:mt-8">
            <h3 className="text-2xl font-heading text-title">{stub.title}</h3>
            {whatsapp ? (
              <ButtonLink
                href={whatsappUrl(whatsapp.number, pricing.whatsappMessage)}
                track="whatsapp_click"
                trackProps={{ position: "business-pricing-button" }}
                className="mt-4 w-full sm:w-auto"
              >
                <Icon name="message-circle" className="size-5 shrink-0" />
                {stub.button}
              </ButtonLink>
            ) : null}
            <ContactRows position="business-pricing" message={pricing.whatsappMessage} className="mt-5" />
          </div>
        </div>
      </div>
    </Section>
  );
}
