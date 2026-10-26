import Link from "next/link";
import { getProducts } from "@/lib/content";
import { PORTAL_URL, playStoreUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";

const SECONDARY_LINKS = [
  { href: "/#organisations", label: "Organisations" },
  { href: "/#agents", label: "Agents" },
  { href: "/#contact-us", label: "Contact" },
];

// Internal links use prefetch={false}: visitors are mostly on metered mobile
// data, so pages are only fetched when someone actually taps a link.
export function Header() {
  const products = getProducts();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      {/* 72px tall: the 44px logo (142px wide, above the guide's 140px
          minimum for the full lockup) keeps 14px of clear space above and
          below, and the page gutter (16px+) and gap-4 keep it at the sides. */}
      <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" prefetch={false} className="shrink-0 rounded-lg" aria-label="EzyAgric home">
          <Logo className="h-11 w-auto" />
        </Link>

        {/* Names never wrap ("Ka-Ezy" would break at its hyphen). There is
            room for the product links from lg; the secondary links join them
            from xl (they are also in the footer). */}
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-0.5 text-[15px] font-semibold whitespace-nowrap">
            {products.map((p) => (
              <li key={p.slug}>
                <Link
                  prefetch={false}
                  href={`/${p.slug}/`}
                  className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-ink transition-colors hover:bg-brand-50 hover:text-brand-700"
                >
                  {p.name}
                </Link>
              </li>
            ))}
            <li aria-hidden="true" className="mx-1 hidden h-5 w-px bg-line xl:block" />
            {SECONDARY_LINKS.map((l) => (
              <li key={l.href} className="hidden xl:block">
                <Link
                  prefetch={false}
                  href={l.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-2.5 text-muted transition-colors hover:bg-brand-50 hover:text-brand-700"
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
          {/* top-18 / 4.5rem = the header's height (h-18). */}
          <div className="fixed inset-x-0 top-18 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-line bg-white px-4 pt-2 pb-6 shadow-lg">
            <nav aria-label="Main">
              <p className="px-3 pt-3 pb-1 text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
                Products
              </p>
              <ul className="grid grid-cols-2 gap-1">
                {products.map((p) => (
                  <li key={p.slug}>
                    <Link
                      prefetch={false}
                      href={`/${p.slug}/`}
                      className="block rounded-lg px-3 py-3 text-base font-bold text-ink hover:bg-brand-50 hover:text-brand-700"
                    >
                      {p.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="mt-2 border-t border-line pt-2">
                {SECONDARY_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link
                      prefetch={false}
                      href={l.href}
                      className="block rounded-lg px-3 py-3 text-base font-semibold text-ink hover:bg-brand-50 hover:text-brand-700"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="mt-4 grid gap-2">
              <ButtonLink
                href={playStoreUrl("general", "menu")}
                track="get_app_click"
                trackProps={{ product: "general", position: "menu" }}
              >
                Get the app
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
