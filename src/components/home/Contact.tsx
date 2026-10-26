import type { ReactNode } from "react";
import { getSite, isVisible, visible, type Accent, type IconName } from "@/lib/content";
import { mailUrl, telUrl, whatsappUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";

/** Icon in a solid brand circle + h3 at the top of each contact card. */
function CardTitle({
  icon,
  color,
  children,
}: {
  icon: IconName;
  color: Accent | "outline";
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <IconCircle name={icon} color={color} />
      <h3 className="text-lg font-bold text-ink">{children}</h3>
    </div>
  );
}

const CARD = "rounded-lg border border-line bg-white p-5 sm:p-6";

/**
 * Contact details. WhatsApp leads (most farmers' first choice), then call,
 * email and the office. Numbers and addresses are visible text, not just
 * link targets, so people can copy them or dial from another phone.
 */
export function Contact() {
  const { contact } = getSite();
  const { whatsapp, address } = contact;
  const phones = visible(contact.phones);
  const emails = visible(contact.emails);

  return (
    <Section id="contact-us" labelledBy="contact-title">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader id="contact-title" title={contact.title} intro={contact.intro} />

          {isVisible(whatsapp) ? (
            // The lead option (most farmers' first choice), so a green tint
            // instead of the plain white card.
            <div className="rounded-lg border border-leaf-100 bg-leaf-50 p-5 sm:p-6">
              <CardTitle icon="message-circle" color="green">
                WhatsApp
                {whatsapp.pending ? <PendingBadge note={whatsapp.note} /> : null}
              </CardTitle>
              <ButtonLink
                href={whatsappUrl(whatsapp.number, whatsapp.message)}
                variant="whatsapp"
                size="lg"
                track="whatsapp_click"
                trackProps={{ position: "contact" }}
                className="mt-4 w-full sm:w-auto"
              >
                <Icon name="message-circle" className="size-5 shrink-0" />
                <span className="sr-only">Chat on WhatsApp: </span>
                <span className="whitespace-nowrap">{whatsapp.number}</span>
              </ButtonLink>
            </div>
          ) : null}
        </div>

        <ul className="grid content-start gap-4 sm:grid-cols-2 lg:grid-cols-1">
          {phones.length > 0 ? (
            <li className={CARD}>
              <CardTitle icon="phone" color="blue">Call us</CardTitle>
              <ul className="mt-4 space-y-3">
                {phones.map((phone) => (
                  <li key={phone.number} className="flex flex-wrap items-center gap-2">
                    <ButtonLink
                      href={telUrl(phone.number)}
                      variant="secondary"
                      track="tel_click"
                      trackProps={{ position: "contact" }}
                      className="w-full sm:w-auto"
                    >
                      <Icon name="phone" className="size-5 shrink-0" />
                      <span className="sr-only">Call </span>
                      <span className="whitespace-nowrap">{phone.number}</span>
                    </ButtonLink>
                    {phone.pending ? <PendingBadge note={phone.note} /> : null}
                  </li>
                ))}
              </ul>
            </li>
          ) : null}

          {emails.length > 0 ? (
            <li className={CARD}>
              <CardTitle icon="mail" color="outline">Email</CardTitle>
              <ul className="mt-4 space-y-3">
                {emails.map((email) => (
                  <li key={email.address}>
                    {/* With one address the card title says it all; label several. */}
                    {emails.length > 1 ? (
                      <p className="mb-1 text-sm font-semibold text-muted">{email.label}</p>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-2">
                      <ButtonLink
                        href={mailUrl(email.address)}
                        variant="secondary"
                        track="email_click"
                        trackProps={{ position: "contact" }}
                        className="w-full sm:w-auto"
                      >
                        <Icon name="mail" className="size-5 shrink-0" />
                        <span className="sr-only">{email.label}: </span>
                        <span className="wrap-anywhere">{email.address}</span>
                      </ButtonLink>
                      {email.pending ? <PendingBadge note={email.note} /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}

          <li className={`${CARD} sm:col-span-2 lg:col-span-1`}>
            <CardTitle icon="map-pin" color="green">Office</CardTitle>
            <address className="mt-4 text-base text-ink not-italic">
              {address.lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <ButtonLink
              href={address.mapUrl}
              variant="secondary"
              className="mt-4 w-full sm:w-auto"
            >
              <Icon name="map" className="size-5 shrink-0" />
              Open in Google Maps
            </ButtonLink>
          </li>
        </ul>
      </div>
    </Section>
  );
}
