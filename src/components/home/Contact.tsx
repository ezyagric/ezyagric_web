import type { ReactNode } from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { getSite, isVisible, visible, type IconName } from "@/lib/content";
import { mailUrl, telUrl, whatsappUrl } from "@/lib/links";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";

/**
 * Contact details as one row of tiles: WhatsApp leads on a green tile (most
 * farmers' first choice), then call, email and the office, four across from
 * lg, two by two on tablets, stacked on phones. Numbers and addresses are
 * visible text, not just link targets, so people can copy them or dial from
 * another phone; each tile's action link sits at its foot, level across the row.
 */
export function Contact() {
  const { contact } = getSite();
  const { whatsapp, address } = contact;
  const phones = visible(contact.phones);
  const emails = visible(contact.emails);

  return (
    <Section id="contact-us" labelledBy="contact-title">
      <SectionHeader id="contact-title" title={contact.title} intro={contact.intro} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isVisible(whatsapp) ? (
          <Tile
            icon="message-circle"
            label="WhatsApp"
            badge={whatsapp.pending ? <PendingBadge note={whatsapp.note} /> : null}
            value={<span className="whitespace-nowrap">{whatsapp.number}</span>}
            featured
          >
            <TileLink
              href={whatsappUrl(whatsapp.number, whatsapp.message)}
              track="whatsapp_click"
              featured
            >
              Chat on WhatsApp
            </TileLink>
          </Tile>
        ) : null}

        {phones.map((phone) => (
          <Tile
            key={phone.number}
            icon="phone"
            label="Call us"
            badge={phone.pending ? <PendingBadge note={phone.note} /> : null}
            value={<span className="whitespace-nowrap">{phone.number}</span>}
          >
            <TileLink href={telUrl(phone.number)} track="tel_click">
              Call now<span className="sr-only"> on {phone.number}</span>
            </TileLink>
          </Tile>
        ))}

        {emails.map((email) => (
          <Tile
            key={email.address}
            icon="mail"
            // With one address "Email" says it all; label several.
            label={emails.length > 1 ? email.label : "Email"}
            badge={email.pending ? <PendingBadge note={email.note} /> : null}
            value={<span className="wrap-anywhere">{email.address}</span>}
          >
            <TileLink href={mailUrl(email.address)} track="email_click">
              Send an email<span className="sr-only"> to {email.address}</span>
            </TileLink>
          </Tile>
        ))}

        <Tile
          icon="map-pin"
          label="Visit us"
          value={
            <address className="not-italic">
              {address.lines.map((line, i) => (
                // The street on the value line; the rest smaller beneath it.
                <span key={line} className={i === 0 ? "block" : "block text-sm font-sans text-muted"}>
                  {line}
                </span>
              ))}
            </address>
          }
        >
          <TileLink href={address.mapUrl} newTab>
            Open in Google Maps
          </TileLink>
        </Tile>
      </ul>
    </Section>
  );
}

/**
 * One way to reach us: icon and label, the number or address itself, and
 * the action at the foot. The featured (WhatsApp) tile is solid green.
 */
function Tile({
  icon,
  label,
  badge,
  value,
  featured = false,
  children,
}: {
  icon: IconName;
  label: string;
  badge?: ReactNode;
  value: ReactNode;
  featured?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      className={`relative isolate flex flex-col overflow-hidden rounded-card p-5 ${
        featured ? "bg-primary text-on-primary shadow-raised" : "border border-line bg-card text-title shadow-card"
      }`}
    >
      <Icon
        name={icon}
        className={`absolute -right-6 -bottom-8 -z-10 size-32 -rotate-12 ${featured ? "text-on-primary/15" : "text-brand/5"}`}
      />
      <div className="flex items-center gap-3">
        {featured ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-primary">
            <Icon name={icon} className="size-6" />
          </span>
        ) : (
          <IconCircle name={icon} color={icon === "map-pin" ? "accent" : "brand"} />
        )}
        <h3 className={`text-sm text-label-style ${featured ? "text-on-primary" : "text-label"}`}>
          {label}
          {badge}
        </h3>
      </div>
      <div className="mt-4 text-lg font-heading">{value}</div>
      <div className="mt-auto pt-3">{children}</div>
    </li>
  );
}

function TileLink({
  href,
  track,
  featured = false,
  newTab = false,
  children,
}: {
  href: string;
  track?: string;
  featured?: boolean;
  newTab?: boolean;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(track ? { "data-track": track, "data-track-position": "contact" } : {})}
      {...(newTab ? { target: "_blank", rel: "noopener" } : {})}
      // On the green tile: white text and a white focus ring.
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-control font-heading underline-offset-4 hover:underline ${
        featured ? "text-on-primary focus-visible:outline-on-primary" : "text-link"
      }`}
    >
      {children}
      {newTab ? (
        <>
          <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only"> (opens in a new tab)</span>
        </>
      ) : (
        <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
      )}
    </a>
  );
}
