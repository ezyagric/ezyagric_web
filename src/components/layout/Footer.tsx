import Link from "next/link";
import { getBusiness, getBusinessModules, getProducts, getSite, isVisible, visible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { HashLink } from "@/components/ui/HashLink";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { GET_THE_APP_ID } from "@/components/promo/KaEzyBanner";
import { BUSINESS_PATH } from "@/components/business/BusinessMenu";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";
import { Logo } from "./Logo";

/** `external`: a chat or another site, in a new tab, with its analytics event. */
type FooterLink = { href: string; label: string; external?: { track: string } };

// Column links are 44px tap targets, and 36px from md with a mouse or
// trackpad (pointer-fine), so the columns stay short; touch tablets keep 44px.
// The bar's legal links stay 44px.
const LINK =
  "inline-flex min-h-11 items-center text-on-inverse/90 hover:text-on-inverse hover:underline md:pointer-fine:min-h-9";
const SMALL_LINK = "inline-flex min-h-11 items-center hover:text-on-inverse hover:underline";

/**
 * A compact Dark Navy footer: the brand block (logo, slogan and store
 * badges) beside three short link columns (Farmer Services and Agribusiness
 * Services, as in the header, then EzyAgric), then one bar with our social
 * pages as round marks, the copyright and the legal links. The app and
 * partner portal live in the header and the badges, so there is no
 * separate column for them.
 */
export function Footer() {
  const site = getSite();
  const products = getProducts();
  const social = visible(site.social);
  const year = new Date().getFullYear();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Farmer Services",
      links: products.map((p) => ({ href: `/${p.slug}/`, label: p.name })),
    },
    {
      // The page, then its four modules' chapters.
      title: "Agribusiness Services",
      links: [
        { href: BUSINESS_PATH, label: getBusiness().name },
        ...getBusinessModules().map((m) => ({ href: `${BUSINESS_PATH}#${m.id}`, label: m.name })),
      ],
    },
    {
      title: "EzyAgric",
      links: [
        { href: "/#stories", label: "Stories" },
        { href: "/#faq", label: "FAQ" },
        { href: "/#contact-us", label: "Contact us" },
        ...(isVisible(site.contact.whatsapp)
          ? [
              {
                href: whatsappUrl(site.contact.whatsapp.number, site.contact.whatsapp.message),
                label: "Chat on WhatsApp",
                external: { track: "whatsapp_click" },
              },
            ]
          : []),
      ],
    },
  ];

  return (
    // Brand guide: Dark Navy footer with the reversed (white) logo; green
    // highlights for the column labels ("navy with green highlight").
    <footer className="bg-inverse text-on-inverse">
      {/* The signature blue-green stripe keeps the footer apart from a
          dark or gradient band above it. */}
      <div aria-hidden="true" className="h-1.5 gradient-brand-decor" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-8 px-4 py-8 sm:px-6 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:py-12">
        <div className="col-span-2 md:col-span-1">
          {/* Full lockup with its tagline at h-12 (155px wide, above the
              140px minimum); mt-4 below is the logo's clear space (half the
              mark's height, about 16px). */}
          <Logo variant="white" loading="lazy" className="h-12 w-auto" />
          <p className="mt-4 text-base font-label">{site.slogan}</p>
          {/* The id keeps /#get-the-app working for links from outside the site
              (campaigns, messages); on the site, store badges sit where they're needed. */}
          <div id={GET_THE_APP_ID}>
            <StoreBadges campaign="general" medium="footer" size="sm" onDark className="mt-5" />
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            {/* Two lines kept for every heading on phones (below sm) and from
                md to xl, where "Agribusiness Services" wraps beside a heading
                that may not, so the lists line up. */}
            <p className="text-sm text-label-style text-accent-bright max-sm:min-h-[2lh] md:min-h-[2lh] xl:min-h-0">
              {col.title}
            </p>
            <ul className="mt-1 md:mt-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener"
                      data-track={l.external.track}
                      data-track-position="footer"
                      className={LINK}
                    >
                      {l.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <HashLink href={l.href} className={LINK}>
                      {l.label}
                    </HashLink>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      {/* One bar: our social pages (first on phones), then the copyright and
          the legal links; from md the social pages sit at the right, and the
          two groups wrap as wholes when "Cookie settings" leaves no room. The
          "Follow us" label (the list's name gives it to screen readers) shows
          only where it fits: from sm, but not from md to lg. Below 360px the
          marks are 40px, so all six fit on one row. */}
      <div className="border-t border-on-inverse/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-x-8 gap-y-3 px-4 py-4 text-sm text-on-inverse/80 sm:px-6 md:flex-row md:flex-wrap md:items-center md:justify-between">
          {social.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:order-last">
              <p aria-hidden="true" className="hidden text-label-style text-accent-bright sm:block md:hidden lg:block">
                Follow us
              </p>
              <ul aria-label="Social media" className="flex flex-wrap gap-2">
                {social.map((s) => (
                  <li key={s.name}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener"
                      title={s.pending ? `${s.name}: ${s.note ?? "to confirm"}` : s.name}
                      aria-label={`${s.name} (opens in a new tab)`}
                      data-track="social_click"
                      data-track-network={s.name}
                      data-track-position="footer"
                      // A link still to confirm gets the review colour's dashed ring (preview only).
                      className={`flex size-10 items-center justify-center rounded-full border min-[360px]:size-11 text-on-inverse transition-colors hover:border-on-inverse hover:bg-on-inverse/10 ${
                        s.pending ? "border-dashed border-review" : "border-on-inverse/25"
                      }`}
                    >
                      <SocialIcon name={s.name} />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-x-5">
            <p className="py-3">
              © {year} {site.legalName}
            </p>
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
