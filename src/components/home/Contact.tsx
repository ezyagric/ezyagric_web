import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { getSite, isVisible, visible, type Accent, type IconName } from "@/lib/content";
import { mailUrl, telUrl, whatsappUrl } from "@/lib/links";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";

/**
 * Contact details: WhatsApp, call and email merged into one card of rows
 * (WhatsApp leads on a green tint: most farmers' first choice), beside the
 * office on a faint map grid. Side by side from lg, stacked below. Numbers
 * and addresses are visible text, not just link targets, so people can
 * copy them or dial from another phone.
 */
export function Contact() {
  const { contact } = getSite();
  const { whatsapp, address } = contact;
  const phones = visible(contact.phones);
  const emails = visible(contact.emails);

  return (
    <Section id="contact-us" labelledBy="contact-title">
      <SectionHeader id="contact-title" title={contact.title} intro={contact.intro} />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-6">
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card shadow-card">
          {isVisible(whatsapp) ? (
            <Channel
              icon="message-circle"
              color="accent"
              label="WhatsApp"
              badge={whatsapp.pending ? <PendingBadge note={whatsapp.note} /> : null}
              value={<span className="whitespace-nowrap">{whatsapp.number}</span>}
              lead
            >
              <ChannelButton href={whatsappUrl(whatsapp.number, whatsapp.message)} track="whatsapp_click" variant="whatsapp">
                Chat now<span className="sr-only"> on WhatsApp</span>
              </ChannelButton>
            </Channel>
          ) : null}

          {phones.map((phone) => (
            <Channel
              key={phone.number}
              icon="phone"
              color="brand"
              label="Call us"
              badge={phone.pending ? <PendingBadge note={phone.note} /> : null}
              value={<span className="whitespace-nowrap">{phone.number}</span>}
            >
              <ChannelButton href={telUrl(phone.number)} track="tel_click">
                Call now<span className="sr-only"> on {phone.number}</span>
              </ChannelButton>
            </Channel>
          ))}

          {emails.map((email) => (
            <Channel
              key={email.address}
              icon="mail"
              color="deep"
              // With one address "Email" says it all; label several.
              label={emails.length > 1 ? email.label : "Email"}
              badge={email.pending ? <PendingBadge note={email.note} /> : null}
              value={<span className="wrap-anywhere">{email.address}</span>}
            >
              <ChannelButton href={mailUrl(email.address)} track="email_click">
                Email us<span className="sr-only"> at {email.address}</span>
              </ChannelButton>
            </Channel>
          ))}
        </ul>

        {/* The office on a faint map grid, with a pin. */}
        <div className="relative isolate flex flex-col overflow-hidden rounded-card border border-line bg-card p-5 shadow-card sm:p-6">
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:linear-gradient(to_left,black,transparent_75%)]"
          />
          <div className="flex items-center gap-3">
            <IconCircle name="map-pin" color="accent" />
            <h3 className="text-sm text-label-style text-label">Visit us</h3>
          </div>
          <address className="mt-4 text-lg font-heading text-title not-italic">
            {address.lines.map((line, i) => (
              // The street on the first line; the rest smaller beneath it.
              <span key={line} className={i === 0 ? "block" : "block text-base font-sans text-body"}>
                {line}
              </span>
            ))}
          </address>
          <div className="mt-auto pt-4">
            <a
              href={address.mapUrl}
              target="_blank"
              rel="noopener"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-control font-heading text-link underline-offset-4 hover:underline"
            >
              Open in Google Maps
              <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}

/**
 * One way to reach us, as a row: icon, label, the number or address itself,
 * and its button on the right (full width under it on phones).
 */
function Channel({
  icon,
  color,
  label,
  badge,
  value,
  lead = false,
  children,
}: {
  icon: IconName;
  color: Accent;
  label: string;
  badge?: ReactNode;
  value: ReactNode;
  /** The first choice, on a green tint. */
  lead?: boolean;
  children: ReactNode;
}) {
  return (
    <li className={`flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4 sm:px-6 ${lead ? "bg-accent-soft" : ""}`}>
      <IconCircle name={icon} color={color} />
      <div className="min-w-0 flex-1">
        <h3 className="text-sm text-label-style text-label">
          {label}
          {badge}
        </h3>
        <p className="text-lg font-heading text-title">{value}</p>
      </div>
      {children}
    </li>
  );
}

function ChannelButton({
  href,
  track,
  variant = "secondary",
  children,
}: {
  href: string;
  track: string;
  variant?: ButtonVariant;
  children: ReactNode;
}) {
  return (
    <ButtonLink
      href={href}
      variant={variant}
      track={track}
      trackProps={{ position: "contact" }}
      className="w-full whitespace-nowrap sm:w-auto"
    >
      {children}
    </ButtonLink>
  );
}
