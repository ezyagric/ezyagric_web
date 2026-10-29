import Image from "next/image";
import Link from "next/link";
import { getBusinessModules, getProducts } from "@/lib/content";
import { PORTAL_URL } from "@/lib/links";
import { trackData } from "@/lib/track";
import { ButtonLink } from "@/components/ui/Button";
import { HashLink } from "@/components/ui/HashLink";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ServicesMenu, type ServiceItem, type TileTone } from "./ServicesMenu";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { KaEzyMenuCard, KaEzyStrip, kaezyPayHref } from "@/components/promo/KaEzyBanner";
import { BUSINESS_PATH, BusinessMenuCard, BusinessStrip } from "@/components/business/BusinessMenu";
import { LOOKS, lookName } from "@/components/business/chapterLooks";
import type { Accent, IconName } from "@/lib/content";

// From lg to xl the nav's icons and the Pay button's wallet hide and the
// labels drop to 14px, so the logo, both menus, Contact and both buttons fit
// in one row at 1024px (with a classic scrollbar too).
const NAV_ICON = "hidden size-4 shrink-0 text-secondary xl:block";

const SECONDARY_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/#contact-us", label: "Contact", icon: "phone" },
];

// Farmer Services tiles: the record book's page surfaces by accent (blue,
// green; navy "deep" gets white paper, so the current tile's blue outline
// still shows on /ezycredits/), a shade deeper on hover, and the product's
// glyph as a watermark off the top-right corner (a chapter's `mark`).
const FARMER_TILE: Record<Accent, { tone: TileTone; mark: string }> = {
  brand: {
    tone: { tile: "bg-brand-soft ring-1 ring-brand-soft-strong hover:bg-brand-soft-strong", name: "text-title", muted: "text-muted", arrow: "text-link" },
    mark: "text-brand opacity-10",
  },
  accent: {
    tone: { tile: "bg-accent-soft ring-1 ring-accent-soft-strong hover:bg-accent-soft-strong", name: "text-title", muted: "text-muted", arrow: "text-link" },
    mark: "text-accent-bright opacity-15",
  },
  deep: {
    tone: { tile: "bg-card ring-1 ring-line shadow-card hover:bg-brand-soft", name: "text-title", muted: "text-muted", arrow: "text-link" },
    mark: "text-title opacity-[0.07]",
  },
};

const PHONE_LINK =
  "flex gap-1.5 rounded-control px-3 py-3 text-base font-heading text-body hover:bg-brand-soft hover:text-link";

// Internal links use prefetch={false}: visitors are mostly on metered mobile
// data, so pages are only fetched when someone actually taps a link.
export function Header() {
  // Farmer Services: the four farmer-app services. Agribusiness Services:
  // EzyAgric Business's four modules (each with who it is for), which jump to
  // their chapters on its page. Numbered 1 to 4 in both menus.
  const farmerServices: ServiceItem[] = getProducts().map((p) => {
    const tile = FARMER_TILE[p.accent];
    return {
      href: `/${p.slug}/`,
      name: p.name,
      tagline: p.appTagline,
      icon: <IconCircle name={p.icon} color={p.accent} size="sm" />,
      tone: tile.tone,
      mark: (
        <Icon
          name={p.icon}
          className={`absolute -top-4 -right-4 size-24 -rotate-12 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/item:-rotate-3 ${tile.mark}`}
        />
      ),
    };
  });
  // Agribusiness Services tiles: each module's record-book page (the business
  // page's chapter looks) with its real screen as a strip, cropped by the
  // thumb's focus, and its icon riding the strip's corner (as on the
  // Contents card). Names in text-title, as in the other menu.
  const modules = getBusinessModules();
  const businessServices: ServiceItem[] = modules.map((m) => {
    const look = LOOKS[lookName(m)];
    return {
      href: `${BUSINESS_PATH}#${m.id}`,
      name: m.name,
      tagline: m.audience,
      icon: <IconCircle name={m.product.icon} color={m.product.accent} size="sm" className={`ring-2 ${look.loupeRing}`} />,
      track: { event: "business_module_click", params: { module: m.id, position: "menu-desktop" } },
      tone: {
        tile: look.page,
        name: lookName(m) === "ink" ? "text-on-inverse" : "text-title",
        muted: look.muted,
        arrow: look.linkText,
        frame: look.windowRing,
      },
      mark: look.bar ? <span className={`absolute inset-x-0 top-0 h-1 ${look.bar}`} /> : undefined,
      strip: (
        <Image
          src={m.thumb.src}
          alt=""
          width={m.thumb.width}
          height={m.thumb.height}
          loading="lazy"
          style={m.thumb.focus ? { objectPosition: m.thumb.focus } : undefined}
          className="absolute inset-0 size-full object-cover object-left-top motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/item:scale-105"
        />
      ),
    };
  });
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-canvas/95 backdrop-blur supports-[backdrop-filter]:bg-canvas/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-control focus:bg-canvas focus:px-4 focus:py-2 focus:shadow-card"
      >
        Skip to content
      </a>
      {/* The logo at 56px (181px wide) in an 88px header on phones, and
          68px (220px wide) in a 112px header from lg (the EzyAgric team asked
          for a bigger logo again, 27 Oct 2026). Either way it keeps about a
          third of its height clear above and below (the guide's clear space),
          and the page gutter (16px+) and gap-4 keep it clear at the sides. */}
      <div className="mx-auto flex h-22 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-28">
        <Link href="/" prefetch={false} className="shrink-0 rounded-control" aria-label="EzyAgric home">
          <Logo className="h-14 w-auto lg:h-17" />
        </Link>

        {/* One segmented pill, like the hero's switcher: each link has its
            icon, and the one hovered or open turns white and lifts. Two
            dropdowns, Farmer Services (with the Ka-Ezy card) and Agribusiness
            Services (with the EzyAgric Business card), whose panels hang from
            this pill (`relative`). Names never wrap ("Ka-Ezy" would break at
            its hyphen). */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="relative flex items-center gap-1 rounded-pill border border-line bg-subtle p-1 text-sm font-label whitespace-nowrap xl:text-[15px]">
            <li>
              <ServicesMenu
                label="Farmer Services"
                icon={<Icon name="sprout" className={NAV_ICON} />}
                items={farmerServices}
                aside={<KaEzyMenuCard position="menu-desktop" />}
              />
            </li>
            <li>
              <ServicesMenu
                label="Agribusiness Services"
                icon={<Icon name="users" className={NAV_ICON} />}
                items={businessServices}
                aside={<BusinessMenuCard position="menu-desktop" />}
                pagePath={BUSINESS_PATH}
              />
            </li>
            {SECONDARY_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  prefetch={false}
                  href={l.href}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3.5 text-body transition-colors hover:bg-card hover:text-link hover:shadow-card"
                >
                  <Icon name={l.icon} className={NAV_ICON} />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 whitespace-nowrap lg:flex">
          {/* Brand guide: secondary = Primary Blue outline, primary = green. */}
          <ButtonLink
            href={PORTAL_URL}
            variant="secondary"
            track="portal_login_click"
            className="!min-h-11 !px-4 !text-sm xl:!text-[15px]"
          >
            Partner login
          </ButtonLink>
          <ButtonLink
            href={kaezyPayHref()}
            track="kaezy_pay_click"
            trackProps={{ position: "header" }}
            className="!min-h-11 !px-4 !text-sm xl:!text-[15px]"
          >
            <Icon name="wallet" className="hidden size-4 shrink-0 xl:block" />
            Pay for Ka-Ezy
          </ButtonLink>
        </div>

        <MobileMenu>
          {/* top-22 / 5.5rem = the header's height below lg (h-22). */}
          <div className="fixed inset-x-0 top-22 max-h-[calc(100dvh-5.5rem)] overflow-y-auto border-b border-line bg-canvas px-4 pt-2 pb-6 shadow-raised">
            <nav aria-label="Main">
              <p id="menu-farmer-services" className="px-3 pt-3 pb-1 text-sm text-label-style text-label">
                Farmer Services
              </p>
              {/* role="list": Safari drops the list role from unstyled lists. */}
              <ol role="list" aria-labelledby="menu-farmer-services" className="grid grid-cols-2 gap-1">
                {farmerServices.map((s, i) => (
                  <li key={s.href}>
                    <Link prefetch={false} href={s.href} className={PHONE_LINK}>
                      <span className="tabular-nums text-muted">{i + 1}.</span>
                      <span>{s.name}</span>
                    </Link>
                  </li>
                ))}
              </ol>
              <KaEzyStrip position="menu-phone" className="mt-3" />

              <p id="menu-business-services" className="mt-3 px-3 pt-3 pb-1 text-sm text-label-style text-label">
                Agribusiness Services
              </p>
              <ol role="list" aria-labelledby="menu-business-services" className="grid grid-cols-2 gap-1">
                {modules.map((m, i) => (
                  <li key={m.id}>
                    <HashLink
                      href={`${BUSINESS_PATH}#${m.id}`}
                      className={PHONE_LINK}
                      {...trackData("business_module_click", { module: m.id, position: "menu-phone" })}
                    >
                      <span className="tabular-nums text-muted">{i + 1}.</span>
                      <span>{m.name}</span>
                    </HashLink>
                  </li>
                ))}
              </ol>
              <BusinessStrip position="menu-phone" className="mt-3" />

              <ul className="mt-2 border-t border-line pt-2">
                {SECONDARY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      prefetch={false}
                      href={l.href}
                      className="flex items-center gap-2.5 rounded-control px-3 py-3 text-base font-label text-body hover:bg-brand-soft hover:text-link"
                    >
                      <Icon name={l.icon} className="size-5 shrink-0 text-secondary" />
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {/* On a phone, the store badges (App Store once the iPhone app is
                live) beat a generic "Get the app" button. */}
            <StoreBadges campaign="general" medium="menu" size="md" className="mt-4" />
            <div className="mt-4 grid gap-2">
              <ButtonLink href={kaezyPayHref()} track="kaezy_pay_click" trackProps={{ position: "menu-phone" }}>
                <Icon name="wallet" className="size-5 shrink-0" />
                Pay for Ka-Ezy
              </ButtonLink>
              <ButtonLink href={PORTAL_URL} variant="secondary" track="portal_login_click">
                Partner login
              </ButtonLink>
            </div>
          </div>
        </MobileMenu>
      </div>
    </header>
  );
}
