import Link from "next/link";
import { getProducts } from "@/lib/content";
import { PORTAL_URL, playStoreUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
import { ServicesMenu } from "./ServicesMenu";
import { IconCircle } from "@/components/ui/IconCircle";
import { KaEzyStrip } from "@/components/promo/KaEzyBanner";

const SECONDARY_LINKS = [
  { href: "/#organisations", label: "Organisations" },
  { href: "/#contact-us", label: "Contact" },
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
      {/* The logo at 52px (168px wide) in an 84px header on phones, and
          60px (194px wide) in a 96px header from lg (the EzyAgric team asked
          for a bigger logo, 26 Oct 2026). Either way it keeps about a third
          of its height clear above and below (the guide's clear space), and
          the page gutter (16px+) and gap-4 keep it clear at the sides. */}
      <div className="mx-auto flex h-21 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-24">
        <Link href="/" prefetch={false} className="shrink-0 rounded-control" aria-label="EzyAgric home">
          <Logo className="h-13 w-auto lg:h-15" />
        </Link>

        {/* The four services share one "Our offer" dropdown, which leaves
            room for the other links beside it from lg. Names never wrap
            ("Ka-Ezy" would break at its hyphen). */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 text-[15px] font-label whitespace-nowrap">
            <li>
              <ServicesMenu
                label="Our offer"
                items={products.map((p) => ({
                  href: `/${p.slug}/`,
                  name: p.name,
                  tagline: p.appTagline,
                  icon: <IconCircle name={p.icon} color={p.accent} size="sm" />,
                }))}
                footer={<KaEzyStrip position="menu-desktop" />}
              />
            </li>
            <li aria-hidden="true" className="mx-1 h-5 w-px bg-line" />
            {SECONDARY_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  prefetch={false}
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-control px-2.5 text-muted transition-colors hover:bg-brand-soft hover:text-link"
                >
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
            href={playStoreUrl("general", "header")}
            track="get_app_click"
            trackProps={{ product: "general", position: "header" }}
            className="!min-h-11 !px-4 !text-[15px]"
          >
            Get the app
          </ButtonLink>
        </div>

        <MobileMenu>
          {/* top-21 / 5.25rem = the header's height below lg (h-21). */}
          <div className="fixed inset-x-0 top-21 max-h-[calc(100dvh-5.25rem)] overflow-y-auto border-b border-line bg-canvas px-4 pt-2 pb-6 shadow-raised">
            <nav aria-label="Main">
              <p className="px-3 pt-3 pb-1 text-sm text-label-style text-label">
                Our offer
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
                      className="block rounded-control px-3 py-3 text-base font-label text-body hover:bg-brand-soft hover:text-link"
                    >
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
