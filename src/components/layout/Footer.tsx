import Link from "next/link";
import { getProducts, getSite } from "@/lib/content";
import { AGENT_APP_ID, PORTAL_URL, playStoreUrl } from "@/lib/links";
import { PlayBadge } from "@/components/ui/Button";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";

type FooterLink = {
  href: string;
  label: string;
  /** data-track event and params, for the outbound app and portal links. */
  track?: Record<string, string>;
};

// min-h-12 keeps every footer link a 48px tap target.
const LINK = "inline-flex min-h-12 items-center text-white/90 hover:text-white hover:underline";
const SMALL_LINK = "inline-flex min-h-12 items-center hover:text-white hover:underline";

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
          label: "EzyAgric Farmer app",
          track: { "data-track": "get_app_click", "data-track-product": "general", "data-track-position": "footer" },
        },
        {
          href: playStoreUrl("agents", "footer", AGENT_APP_ID),
          label: "EzyAgric Agent app",
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
    // The top border keeps the footer apart from a dark closing band above it
    // (e.g. Ka-Ezy's), whose end colour is close to the footer's.
    <footer className="border-t-4 border-brand-500 bg-ink text-white">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-6 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <p className="text-2xl font-extrabold">{site.name}</p>
          <p className="mt-2 text-brand-100">{site.slogan}</p>
          <div className="mt-6">
            <PlayBadge campaign="general" medium="footer" className="h-12 w-auto" />
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-bold tracking-wider text-brand-100 uppercase">{col.title}</p>
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
