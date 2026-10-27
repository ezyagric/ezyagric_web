import { getSite, isVisible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { KAEZY_AVATAR, TryKaEzyButton } from "@/components/promo/KaEzyBanner";
import { ButtonLink } from "./Button";
import { Icon } from "./Icon";

/**
 * "Still have a question?" (site.faq.help) beside the questions, on the home
 * page and the product pages: Try Ka-Ezy (the site's one TryKaEzyButton), or
 * the team on WhatsApp. Navy,
 * with Ka-Ezy's face by the title and a large faint chat bubble behind.
 * Nothing when site.yaml has no help copy.
 */
export function FaqHelpCard({
  position,
  page,
  className = "",
}: {
  /** Analytics position of both buttons: "faq" on the home page, "faq-<slug>" on a product page. */
  position: string;
  /** The product page it sits on, if any (for the Try Ka-Ezy button's target). */
  page?: string;
  /** Placement in the parent's layout (margins, display, sticky). */
  className?: string;
}) {
  const { faq, contact } = getSite();
  const help = faq.help;
  if (!help) return null;
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;

  return (
    <div className={`relative isolate overflow-hidden rounded-card bg-inverse p-6 text-on-inverse ${className}`}>
      <Icon
        name="message-circle"
        className="absolute -right-8 -bottom-10 -z-10 size-44 -rotate-12 text-on-inverse/10"
      />
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
          <img src={KAEZY_AVATAR} alt="" width={200} height={178} loading="lazy" className="w-11" />
        </span>
        <h3 className="text-xl font-heading text-on-inverse">{help.title}</h3>
      </div>
      <p className="mt-3 text-base text-pretty text-on-inverse">{help.text}</p>
      {/* Full width on phones; side by side from sm (they still fit the
          narrowest column they get, about 437px from xl). */}
      <div className="mt-5 flex flex-wrap gap-3">
        <TryKaEzyButton position={position} page={page} className="w-full sm:w-auto" />
        {whatsapp ? (
          <ButtonLink
            href={whatsappUrl(whatsapp.number, whatsapp.message)}
            variant="secondary"
            track="whatsapp_click"
            trackProps={{ position }}
            className="w-full whitespace-nowrap sm:w-auto"
          >
            <Icon name="message-circle" className="size-5 shrink-0" />
            {help.whatsapp}
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
