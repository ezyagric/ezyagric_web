import Link from "next/link";
import { getProducts, getSite } from "@/lib/content";
import { AGENT_APP_ID, PORTAL_URL, playStoreUrl } from "@/lib/links";
import { PlayBadge } from "@/components/ui/Button";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";
import { Logo } from "./Logo";

type FooterLink = {
  href: string;
  label: string;
  /** data-track event and params, for the outbound app and portal links. */
  track?: Record<string, string>;
};

// min-h-12 keeps every footer link a 48px tap target.
const LINK = "inline-flex min-h-12 min-w-12 items-center text-white/90 hover:text-white hover:underline";
const SMALL_LINK = "inline-flex min-h-12 min-w-12 items-center justify-center hover:text-white hover:underline";

export function Footer() {
  const site = getSite();
  const products = getProducts();
  const year = new Date().getFullYear();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Products",
      links: products.map((p) => ({ href: `/${p.slug}/`, label: p.name })),
    },
    {
      title: "EzyAgric",
      links: [
        { href: "/#organisations", label: "For organisations" },
        { href: "/#agents", label: "Become an agent" },
        { href: "/#stories", label: "Stories" },
        { href: "/#faq", label: "FAQ" },
        { href: "/#contact-us", label: "Contact us" },
      ],
    },
    {
      title: "Apps and portal",
      links: [
        {
          href: playStoreUrl("general", "footer"),
          label: "EzyAgric App",
          track: { "data-track": "get_app_click", "data-track-product": "general", "data-track-position": "footer" },
        },
        {
          href: playStoreUrl("agents", "footer", AGENT_APP_ID),
          label: "EzyAgric Agent App",
          track: { "data-track": "agent_app_click", "data-track-position": "footer" },
        },
        {
          href: PORTAL_URL,
          label: "Partner login",
          track: { "data-track": "portal_login_click", "data-track-position": "footer" },
        },
      ],
    },
  ];

  return (
    // Brand guide: Dark Navy footer with the reversed (white) logo; green
    // highlights for the column labels ("navy with green highlight").
    <footer className="bg-ink text-white">
      {/* The signature blue-to-green stripe keeps the footer apart from a
          dark or gradient closing band above it. */}
      <div aria-hidden="true" className="h-1.5 bg-linear-to-r from-brand-700 to-leaf-500" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          {/* Full lockup with its tagline, 207px wide; mt-6 below is the
              logo's clear space (half the mark's height, about 21px). */}
          <Logo variant="white" loading="lazy" className="h-16 w-auto" />
          <p className="mt-6 text-lg font-semibold">{site.slogan}</p>
          <div className="mt-6">
            <PlayBadge campaign="general" medium="footer" className="h-12 w-auto" />
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-semibold tracking-[0.14em] text-leaf-500 uppercase">{col.title}</p>
            <ul className="mt-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a href={l.href} target="_blank" rel="noopener" className={LINK} {...l.track}>
                      {l.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <Link prefetch={false} href={l.href} className={LINK}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-white/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 text-sm text-white/80 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-6">
          <p className="py-2">
            © {year} {site.legalName}
          </p>
          <div className="flex flex-col gap-x-8 sm:flex-row sm:flex-wrap">
            <ul className="flex flex-wrap gap-x-5" aria-label="Social media">
              {site.social.map((s) => (
                <li key={s.name}>
                  <a href={s.url} target="_blank" rel="noopener" className={SMALL_LINK}>
                    {s.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
            <ul className="flex flex-wrap gap-x-5" aria-label="Legal">
              <li>
                <Link prefetch={false} href="/privacy-policy/" className={SMALL_LINK}>
                  Privacy policy
                </Link>
              </li>
              {/* Reopens the analytics consent banner; only when GA is configured. */}
              {GA_ENABLED ? (
                <li>
                  <CookieSettingsButton className={SMALL_LINK} />
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}
