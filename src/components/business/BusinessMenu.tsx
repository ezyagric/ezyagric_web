import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, LogIn } from "lucide-react";
import { getBusiness, getSite, isVisible } from "@/lib/content";
import { PORTAL_URL, whatsappUrl } from "@/lib/links";
import { trackData } from "@/lib/track";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PromiseDot } from "./PromiseMarks";

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
 * Services" menu, the twin of the Ka-Ezy card in "Farmer Services": the
 * record book's cover board as a band along its top, its line on navy and
 * the Contents note ("4 modules · 1 sign-in"), the page's two promise marks
 * under a record-book tear, then the actions as rows. The modules' screens
 * are on the menu's tiles beside it.
 */
export function BusinessMenuCard({ position }: { position: string }) {
  const { tagline, menu, hero, promises } = getBusiness();
  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden rounded-card bg-inverse p-4 text-on-inverse">
      <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 gradient-brand-decor" />
      <span aria-hidden="true" className="absolute -top-12 -right-12 -z-10 size-40 rounded-full bg-brand/45" />
      <p className="text-xs text-label-style text-on-inverse">{menu.eyebrow}</p>
      <p className="mt-1 text-lg leading-snug font-heading text-on-inverse">{tagline}</p>
      {hero.contents.note ? <p className="mt-1 text-sm font-normal text-on-inverse/80">{hero.contents.note}</p> : null}
      {/* The page's two promise marks (its key, word for word). */}
      {/* role="list": Safari drops the list role from unstyled lists. */}
      <ul role="list" className="mt-3 space-y-1.5 border-t-2 border-dashed border-on-inverse/25 pt-3 text-sm text-on-inverse">
        {(["privacy", "investment"] as const).map((kind) => (
          <li key={kind} className="flex items-start gap-2">
            <PromiseDot kind={kind} onDark />
            <span>{promises.key[kind]}</span>
          </li>
        ))}
      </ul>
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
