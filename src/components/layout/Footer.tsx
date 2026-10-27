import Link from "next/link";
import { getProducts, getSite, visible } from "@/lib/content";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { GET_THE_APP_ID } from "@/components/promo/KaEzyBanner";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";
import { Logo } from "./Logo";

type FooterLink = { href: string; label: string };

// min-h-12 keeps every footer link a 48px tap target.
const LINK = "inline-flex min-h-12 min-w-12 items-center text-on-inverse/90 hover:text-on-inverse hover:underline";
const SMALL_LINK = "inline-flex min-h-12 min-w-12 items-center justify-center hover:text-on-inverse hover:underline";

/**
 * Dark Navy footer: the brand block (logo, slogan, store badges and our
 * social pages as round marks) beside two link columns, then a slim legal
 * bar. The app and partner portal live in the header and the badges, so
 * there is no separate column for them.
 */
export function Footer() {
  const site = getSite();
  const products = getProducts();
  const social = visible(site.social);
  const year = new Date().getFullYear();

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Our offer",
      links: products.map((p) => ({ href: `/${p.slug}/`, label: p.name })),
    },
    {
      title: "EzyAgric",
      links: [
        { href: "/#organisations", label: "For agribusinesses" },
        { href: "/#stories", label: "Stories" },
        { href: "/#faq", label: "FAQ" },
        { href: "/#contact-us", label: "Contact us" },
      ],
    },
  ];

  return (
    // Brand guide: Dark Navy footer with the reversed (white) logo; green
    // highlights for the column labels ("navy with green highlight").
    <footer className="bg-inverse text-on-inverse">
      {/* The signature blue-green stripe keeps the footer apart from a
          dark or gradient closing band above it. */}
      <div aria-hidden="true" className="h-1.5 gradient-brand-decor" />
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-x-8 gap-y-10 px-4 py-14 sm:px-6 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="col-span-2 md:col-span-1">
          {/* Full lockup with its tagline, 207px wide; mt-6 below is the
              logo's clear space (half the mark's height, about 21px). */}
          <Logo variant="white" loading="lazy" className="h-16 w-auto" />
          <p className="mt-6 text-lg font-label">{site.slogan}</p>
          {/* "Download the App" links across the site jump here, on every page. */}
          <div id={GET_THE_APP_ID}>
            <StoreBadges campaign="general" medium="footer" size="md" onDark className="mt-6" />
          </div>
          {social.length > 0 ? (
            <div className="mt-8">
              <p className="text-sm text-label-style text-accent-bright">Follow us</p>
              <ul aria-label="Social media" className="mt-3 flex flex-wrap gap-2">
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
                      className={`flex size-11 items-center justify-center rounded-full border text-on-inverse transition-colors hover:border-on-inverse hover:bg-on-inverse/10 ${
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
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm text-label-style text-accent-bright">{col.title}</p>
            <ul className="mt-2">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link prefetch={false} href={l.href} className={LINK}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-on-inverse/15">
        <div className="mx-auto flex max-w-6xl flex-col gap-x-6 px-4 py-4 text-sm text-on-inverse/80 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="py-2">
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
    </footer>
  );
}
