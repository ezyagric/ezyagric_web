import { ArrowRight } from "lucide-react";
import { getSite, isVisible, visible, type Accent, type IconName } from "@/lib/content";
import { mailUrl, telUrl, whatsappUrl } from "@/lib/links";
import { IconCircle } from "./IconCircle";

/**
 * The site's contact channels (content/site.yaml contact) as a list of
 * whole-row links: call, WhatsApp, email, each with its icon, a label and
 * the number or address, and the same analytics as ContactLinks. A channel
 * waiting for confirmation is left out. Used on the EzyAgric Business
 * quotation slip.
 */
export function ContactRows({
  position,
  message,
  className = "",
}: {
  /** Analytics position of the three links. */
  position: string;
  /** The WhatsApp message to start with, if not the site's default. */
  message?: string;
  className?: string;
}) {
  const { contact } = getSite();
  const phone = visible(contact.phones)[0];
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const emails = visible(contact.emails);

  const rows: { label: string; value: string; href: string; icon: IconName; color: Accent; track: string; external?: boolean }[] = [];
  if (phone) rows.push({ label: "Call us", value: phone.number, href: telUrl(phone.number), icon: "phone", color: "brand", track: "tel_click" });
  if (whatsapp)
    rows.push({
      label: "WhatsApp us",
      value: whatsapp.number,
      href: whatsappUrl(whatsapp.number, message ?? whatsapp.message),
      icon: "message-circle",
      color: "accent",
      track: "whatsapp_click",
      external: true,
    });
  for (const email of emails) {
    rows.push({ label: "Email us", value: email.address, href: mailUrl(email.address), icon: "mail", color: "deep", track: "email_click" });
  }
  if (rows.length === 0) return null;

  return (
    // role="list": Safari drops the list role from unstyled lists.
    <ul role="list" className={`divide-y divide-line overflow-hidden rounded-card border border-line bg-card ${className}`}>
      {rows.map((row) => (
        <li key={row.value}>
          <a
            href={row.href}
            {...(row.external ? { target: "_blank", rel: "noopener" } : {})}
            data-track={row.track}
            data-track-position={position}
            className="group flex min-h-14 items-center gap-3 px-3 py-2.5 transition-colors hover:bg-subtle focus-visible:-outline-offset-4 sm:px-4"
          >
            <IconCircle name={row.icon} color={row.color} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm text-muted">{row.label}</span>
              <span className="block truncate text-sm font-label text-title sm:text-base">
                {row.value}
                {row.external ? <span className="sr-only"> (opens WhatsApp)</span> : null}
              </span>
            </span>
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 text-secondary motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
