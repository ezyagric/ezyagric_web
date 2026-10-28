import { getSite, isVisible, visible } from "@/lib/content";
import { mailUrl, telUrl, whatsappUrl } from "@/lib/links";

/**
 * "Call us on …, WhatsApp us on … or email …": the site's contact channels
 * (content/site.yaml contact) as links, with the same analytics as the
 * contact section's buttons. A channel waiting for confirmation is left out.
 * Used in EzyCredits' key facts (complaints) and EzyAgric Business pricing.
 */
export function ContactLinks({ position, message }: {
  /** Analytics position of the three links ("key-facts", "business-pricing"). */
  position: string;
  /** The WhatsApp message to start with, if not the site's default. */
  message?: string;
}) {
  const { contact } = getSite();
  const phone = visible(contact.phones)[0];
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const email = visible(contact.emails)[0];
  const link = "font-label text-link underline underline-offset-4 hover:decoration-2";
  const parts = [
    phone ? (
      <>
        Call us on{" "}
        <a href={telUrl(phone.number)} data-track="tel_click" data-track-position={position} className={`${link} whitespace-nowrap`}>
          {phone.number}
        </a>
      </>
    ) : null,
    whatsapp ? (
      <>
        WhatsApp us on{" "}
        <a
          href={whatsappUrl(whatsapp.number, message ?? whatsapp.message)}
          target="_blank"
          rel="noopener"
          data-track="whatsapp_click"
          data-track-position={position}
          className={`${link} whitespace-nowrap`}
        >
          {whatsapp.number}
          <span className="sr-only"> (opens WhatsApp)</span>
        </a>
      </>
    ) : null,
    email ? (
      <>
        email{" "}
        <a href={mailUrl(email.address)} data-track="email_click" data-track-position={position} className={link}>
          {email.address}
        </a>
      </>
    ) : null,
  ].filter(Boolean);

  // "A, B or C."
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i === 0 ? null : i === parts.length - 1 ? " or " : ", "}
          {part}
        </span>
      ))}
      .
    </>
  );
}
