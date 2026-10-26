import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, visible } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { PendingBadge } from "@/components/ui/Pending";
import { ProductMark } from "@/components/ui/ProductMark";
import { CheckDot, Highlight } from "./parts";

/**
 * The four tools, one card each. Kept at 2x2 on large screens: four narrow
 * columns made the points wrap into tall, hard-to-scan blocks.
 * id="solutions" is the old site's anchor, so existing links still land here.
 *
 * Cards follow the guide's App & UI rule (white, 1px #E4E8F2 border, 8px
 * radius, navy titles). Green is the highlight: the app tagline, and product
 * names and prices wherever they appear in the copy.
 */
export function ProductGrid() {
  const { products: header } = getSite();
  const products = getProducts();

  return (
    <Section id="solutions" labelledBy="solutions-title">
      <SectionHeader
        id="solutions-title"
        eyebrow={header.eyebrow}
        title={header.title}
        intro={header.intro}
      />
      <ul className="grid gap-5 md:grid-cols-2 lg:gap-6">
        {products.map((product) => {
          const href = `/${product.slug}/`;
          return (
            <li key={product.slug}>
              <article className="flex h-full flex-col rounded-lg border border-line bg-white p-5 transition-shadow hover:shadow-lg hover:shadow-brand-900/5 sm:p-7">
                <div className="flex items-center gap-4">
                  <ProductMark product={product} />
                  <div className="min-w-0">
                    <h3 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">
                      {/* Padding offset by negative margin: a 48px tap target
                          without changing the card's layout. */}
                      <Link prefetch={false} href={href} className="-my-3 inline-block rounded py-3 hover:underline">
                        {product.name}
                      </Link>
                    </h3>
                    <p className="mt-1 font-semibold text-pretty text-leaf-700">
                      {product.appTagline}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-base text-pretty text-ink">
                  <Highlight text={product.card.summary} />
                </p>

                {/* visible() drops pending points in production; preview
                    builds show them with a "To confirm" badge. */}
                <ul className="mt-4 space-y-2.5 text-base text-muted">
                  {visible(product.card.points).map((point) => (
                    <li key={point.text} className="flex items-start gap-2.5">
                      <CheckDot />
                      <span>
                        <Highlight text={point.text} />
                        {point.pending ? <PendingBadge note={point.note} /> : null}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* A text link rather than a pill: "Learn more about Produce
                    Market" wraps cleanly on a 360px screen. */}
                <div className="mt-auto pt-5">
                  <Link prefetch={false}
                    href={href}
                    className="inline-flex min-h-12 items-center gap-2 rounded font-bold text-brand-700 underline-offset-4 hover:underline"
                  >
                    Learn more about {product.name}
                    <ArrowRight aria-hidden="true" className="size-5 shrink-0" />
                  </Link>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
