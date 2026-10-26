import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, visible } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText } from "@/components/ui/Pending";
import { ProductMark } from "@/components/ui/ProductMark";

/**
 * The four tools, one card each. Kept at 2x2 on large screens: four narrow
 * columns made the points wrap into tall, hard-to-scan blocks.
 * id="solutions" is the old site's anchor, so existing links still land here.
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
          const accent = ACCENTS[product.accent];
          const href = `/${product.slug}/`;
          return (
            <li key={product.slug}>
              <article
                className={`relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-5 pt-7 shadow-sm sm:p-7 sm:pt-9 ${accent.border}`}
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />
                <div className="flex items-center gap-4">
                  <ProductMark product={product} />
                  <div className="min-w-0">
                    <h3 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">
                      {/* Padding offset by negative margin: a 48px tap target
                          without changing the card's layout. */}
                      <Link prefetch={false} href={href} className="-my-3 inline-block rounded py-3 hover:underline">
                        {product.name}
                      </Link>
                    </h3>
                    <p className={`mt-1 font-bold text-pretty ${accent.text}`}>
                      {product.appTagline}
                    </p>
                  </div>
                </div>

                <p className="mt-5 text-base text-pretty text-ink">{product.card.summary}</p>

                <ul className="mt-4 space-y-2.5 text-base text-muted">
                  {visible(product.card.points).map((point) => (
                    <li key={point.text} className="flex items-start gap-2.5">
                      <Icon name="check-circle" className={`mt-0.5 size-5 shrink-0 ${accent.text}`} />
                      <span>
                        <ClaimText claim={point} />
                      </span>
                    </li>
                  ))}
                </ul>

                {/* A text link rather than a pill: "Learn more about Produce
                    Market" wraps cleanly on a 360px screen. */}
                <div className="mt-auto pt-5">
                  <Link prefetch={false}
                    href={href}
                    className={`inline-flex min-h-12 items-center gap-2 rounded font-bold underline-offset-4 hover:underline ${accent.text}`}
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
