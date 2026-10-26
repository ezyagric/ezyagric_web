import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ProductMark } from "@/components/ui/ProductMark";
import type { BandTone } from "./tones";

/**
 * The other three products as compact cards. Each whole card is one link
 * (name + app tagline), so it is a big tap target and reads well on its own.
 */
export function RelatedProducts({ product, tone }: { product: Product; tone: BandTone }) {
  const site = getSite();
  const others = getProducts().filter((p) => p.slug !== product.slug);

  return (
    <Section id="more-products" tone={tone} labelledBy="more-products-title">
      <SectionHeader id="more-products-title" title={`More in the ${site.name} app`} />
      <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {others.map((other) => {
          const accent = ACCENTS[other.accent];
          return (
            <li key={other.slug}>
              <Link prefetch={false}
                href={`/${other.slug}/`}
                className={`group relative flex h-full items-center gap-4 overflow-hidden rounded-2xl border bg-white p-4 pt-5 shadow-sm transition-shadow hover:shadow-md ${accent.border}`}
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
                <ProductMark product={other} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-extrabold text-ink group-hover:underline">
                    {other.name}
                  </span>
                  <span className={`block text-sm font-bold text-pretty ${accent.text}`}>
                    {other.appTagline}
                  </span>
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className={`size-5 shrink-0 transition-transform group-hover:translate-x-0.5 ${accent.text}`}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
