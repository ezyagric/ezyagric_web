import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, LogIn } from "lucide-react";
import { getBusiness, getBusinessModules, getSite, isVisible } from "@/lib/content";
import { PORTAL_URL, whatsappUrl } from "@/lib/links";
import { trackData } from "@/lib/track";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";

export const BUSINESS_PATH = "/ezyagric-business/";

type Action = {
  key: "explore" | "talk" | "login";
  href: string;
  label: string;
  icon: ReactNode;
  data: Record<string, string | undefined>;
};

/**
 * The EzyAgric Business actions in the menus: its page, a WhatsApp chat with
 * the team (when the number is live) and Partner login.
 */
function menuActions(position: string): Action[] {
  const { menu, pricing } = getBusiness();
  const { contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const glyph = "size-4 shrink-0";
  return [
    {
      key: "explore",
      href: BUSINESS_PATH,
      label: menu.explore,
      icon: <Icon name="monitor" className={glyph} />,
      data: trackData("business_page_click", { position }),
    },
    ...(whatsapp
      ? [
          {
            key: "talk" as const,
            href: whatsappUrl(whatsapp.number, pricing.whatsappMessage),
            label: menu.talk,
            icon: <Icon name="message-circle" className={glyph} />,
            data: trackData("whatsapp_click", { position }),
          },
        ]
      : []),
    {
      key: "login",
      href: PORTAL_URL,
      label: "Partner login",
      icon: <LogIn aria-hidden="true" className={glyph} />,
      data: trackData("portal_login_click", { position }),
    },
  ];
}

/** An action as a link: the page in this tab, WhatsApp and the portal in a new one. */
function ActionLink({ action, className, children }: { action: Action; className: string; children: ReactNode }) {
  if (action.href.startsWith("http")) {
    return (
      <a href={action.href} target="_blank" rel="noopener" className={className} {...action.data}>
        {children}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  }
  return (
    <Link prefetch={false} href={action.href} className={className} {...action.data}>
      {children}
    </Link>
  );
}

/**
 * The EzyAgric Business card beside the modules in the desktop "Agribusiness
 * Services" menu, the twin of the Ka-Ezy card in "Farmer Services": the four
 * modules' screens as a small contact sheet (in Contents order, where Ka-Ezy
 * has his face) and its line on navy, then the actions as rows. The screens'
 * figures stay inside the images (alt=""); the images load only when the
 * menu opens (lazy images in a closed <details> are not fetched).
 */
export function BusinessMenuCard({ position }: { position: string }) {
  const { tagline, menu } = getBusiness();
  const modules = getBusinessModules();
  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden rounded-card bg-inverse p-4 text-on-inverse">
      <span aria-hidden="true" className="absolute -top-12 -right-12 -z-10 size-40 rounded-full bg-brand/45" />
      <span aria-hidden="true" className="grid grid-cols-2 gap-1 rounded-control bg-card p-1 shadow-card">
        {modules.map((module) => (
          <Image
            key={module.id}
            src={module.thumb.src}
            alt=""
            width={module.thumb.width}
            height={module.thumb.height}
            loading="lazy"
            className="aspect-[16/9] w-full rounded-sm object-cover object-left-top ring-1 ring-line"
          />
        ))}
      </span>
      <p className="mt-3 text-xs text-label-style text-on-inverse">{menu.eyebrow}</p>
      <p className="mt-1 text-lg leading-snug font-heading text-on-inverse">{tagline}</p>
      <ul className="mt-auto space-y-1.5 pt-4">
        {menuActions(position).map((action) => (
          <li key={action.key}>
            <ActionLink
              action={action}
              className="group/action flex min-h-11 items-center gap-2.5 rounded-control bg-on-inverse/10 px-3 text-sm font-label text-on-inverse transition-colors hover:bg-on-inverse/20"
            >
              {action.icon}
              {action.label}
              <ArrowRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover/action:translate-x-0.5"
              />
            </ActionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The phone menu's EzyAgric Business strip under the modules, the twin of the
 * Ka-Ezy strip: its line, then the page and the chat as pills (Partner login
 * is already a button at the foot of the phone menu).
 */
export function BusinessStrip({ position, className = "" }: { position: string; className?: string }) {
  const { tagline } = getBusiness();
  const actions = menuActions(position).filter((action) => action.key !== "login");

  return (
    <div className={`rounded-card border border-line bg-brand-soft p-3 ${className}`}>
      <p className="flex items-center gap-2 text-base font-heading text-title">
        <IconCircle name="users" color="brand" size="sm" />
        {tagline}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => (
          <li key={action.key}>
            <ActionLink
              action={action}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line bg-card px-3.5 text-sm font-label text-title transition-colors hover:border-secondary hover:text-link [&_svg]:text-secondary"
            >
              {action.icon}
              {action.label}
            </ActionLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
