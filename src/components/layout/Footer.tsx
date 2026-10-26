import Link from "next/link";
import { getProducts, getSite } from "@/lib/content";
import { AGENT_APP_ID, PORTAL_URL, playStoreUrl } from "@/lib/links";
import { PlayBadge } from "@/components/ui/Button";

export function Footer() {
  const site = getSite();
  const products = getProducts();
  const year = new Date().getFullYear();

  const columns = [
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
        { href: playStoreUrl("general", "footer"), label: "EzyAgric Farmer app" },
        { href: playStoreUrl("agents", "footer", AGENT_APP_ID), label: "EzyAgric Agent app" },
        { href: PORTAL_URL, label: "Partner login" },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <p className="text-2xl font-extrabold">{site.name}</p>
          <p className="mt-2 text-brand-100">{site.slogan}</p>
          <div className="mt-6">
            <PlayBadge campaign="general" medium="footer" className="h-12 w-auto" />
          </div>
        </div>
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <p className="text-sm font-bold tracking-wider text-brand-100 uppercase">{col.title}</p>
            <ul className="mt-3 space-y-1">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("http") ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener"
                      className="inline-block py-1.5 text-white/90 hover:text-white hover:underline"
                    >
                      {l.label}
                    </a>
                  ) : (
                    <Link
                      href={l.href}
                      className="inline-block py-1.5 text-white/90 hover:text-white hover:underline"
                    >
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
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-white/80 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.legalName}
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Social media">
            {site.social.map((s) => (
              <li key={s.name}>
                <a href={s.url} target="_blank" rel="noopener" className="hover:text-white hover:underline">
                  {s.name}
                </a>
              </li>
            ))}
            <li>
              <Link href="/privacy-policy/" className="hover:text-white hover:underline">
                Privacy policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
