import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProducts } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { KaEzyBanner } from "@/components/promo/KaEzyBanner";
import { ProductMark } from "@/components/ui/ProductMark";

// Static export writes this to out/404.html; nginx serves it for any
// unknown URL (error_page 404 in nginx/nginx.conf). Next adds noindex; the
// robots value here stops the layout's production "index, follow" from
// being added next to it.
export const metadata: Metadata = {
  title: "Page not found | EzyAgric",
  description: "We couldn't find that page. Go to the EzyAgric home page or one of our four tools.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  const products = getProducts();

  return (
    <>
      <section aria-labelledby="not-found-title" className="bg-subtle py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm text-label-style text-label">Error 404</p>
            <h1
              id="not-found-title"
              className="mt-2 text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl"
            >
              Sorry, we can&apos;t find that page
            </h1>
            <p className="mt-3 text-lg text-pretty text-muted">
              The link may be old or mistyped. Try one of these instead.
            </p>
            <ButtonLink href="/" className="mt-6">
              Go to the home page
            </ButtonLink>
          </div>

          <nav aria-label="EzyAgric products" className="mx-auto mt-10 max-w-3xl">
            <ul className="grid gap-3 sm:grid-cols-2">
              {products.map((p) => (
                <li key={p.slug}>
                  {/* Card: bg-card, border-line, rounded-card, title-colour name. */}
                  <Link
                    prefetch={false}
                    href={`/${p.slug}/`}
                    className="group flex min-h-20 items-center gap-4 rounded-card border border-line bg-card p-4 transition-colors hover:border-secondary"
                  >
                    <ProductMark product={p} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-lg font-heading text-title group-hover:text-link">
                        {p.name}
                      </span>
                      <span className="block text-muted">{p.appTagline}</span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="size-5 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-10 flex flex-col items-center gap-3 text-center">
            <p className="font-label text-body">Get the EzyAgric App</p>
            <StoreBadges campaign="general" medium="404" className="justify-center" />
          </div>
        </Container>
      </section>
      <KaEzyBanner id="kaezy-banner" position="404" />
    </>
  );
}
