import Link from "next/link";
import { getProducts } from "@/lib/content";
import { PORTAL_URL } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ServicesMenu } from "./ServicesMenu";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { KaEzyMenuCard, KaEzyStrip, kaezyPayHref } from "@/components/promo/KaEzyBanner";
import type { IconName } from "@/lib/content";

// Agribusinesses: the EzyAgric Business page (the home page's
// "#organisations" section stays as its preview, so older links still land).
const SECONDARY_LINKS: { href: string; label: string; icon: IconName }[] = [
  { href: "/ezyagric-business/", label: "Agribusinesses", icon: "users" },
  { href: "/#contact-us", label: "Contact", icon: "phone" },
];

// Internal links use prefetch={false}: visitors are mostly on metered mobile
// data, so pages are only fetched when someone actually taps a link.
export function Header() {
  const products = getProducts();
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
            icon, and the one hovered or open turns white and lifts. The four
            services share the "Our services" dropdown. Names never wrap
            ("Ka-Ezy" would break at its hyphen). */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1 rounded-pill border border-line bg-subtle p-1 text-[15px] font-label whitespace-nowrap">
            <li>
              <ServicesMenu
                label="Our services"
                icon={<Icon name="sprout" className="size-4 shrink-0 text-secondary" />}
                items={products.map((p) => ({
                  href: `/${p.slug}/`,
                  name: p.name,
                  tagline: p.appTagline,
                  icon: <IconCircle name={p.icon} color={p.accent} size="sm" />,
                }))}
                aside={<KaEzyMenuCard position="menu-desktop" />}
              />
            </li>
            {SECONDARY_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  prefetch={false}
                  href={l.href}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-pill px-3.5 text-body transition-colors hover:bg-card hover:text-link hover:shadow-card"
                >
                  <Icon name={l.icon} className="size-4 shrink-0 text-secondary" />
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
            className="!min-h-11 !px-4 !text-[15px]"
          >
            Partner login
          </ButtonLink>
          <ButtonLink
            href={kaezyPayHref()}
            track="kaezy_pay_click"
            trackProps={{ position: "header" }}
            className="!min-h-11 !px-4 !text-[15px]"
          >
            <Icon name="wallet" className="size-4 shrink-0" />
            Pay for Ka-Ezy
          </ButtonLink>
        </div>

        <MobileMenu>
          {/* top-22 / 5.5rem = the header's height below lg (h-22). */}
          <div className="fixed inset-x-0 top-22 max-h-[calc(100dvh-5.5rem)] overflow-y-auto border-b border-line bg-canvas px-4 pt-2 pb-6 shadow-raised">
            <nav aria-label="Main">
              <p className="px-3 pt-3 pb-1 text-sm text-label-style text-label">
                Our services
              </p>
              <ul className="grid grid-cols-2 gap-1">
                {products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      prefetch={false}
                      href={`/${p.slug}/`}
                      className="block rounded-control px-3 py-3 text-base font-heading text-body hover:bg-brand-soft hover:text-link"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <KaEzyStrip position="menu-phone" className="mt-3" />
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
