import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ProductMark } from "@/components/ui/ProductMark";
import type { BandTone } from "./tones";

/**
 * The other three products as compact cards (guide card style: card
 * background, line border, card radius, title colour). Each whole card is
 * one link (name + app tagline), so it is a big tap target and reads well
 * on its own.
 */
export function RelatedProducts({ product, tone }: { product: Product; tone: BandTone }) {
  const site = getSite();
  const others = getProducts().filter((p) => p.slug !== product.slug);

  return (
    <Section id="more-products" tone={tone} labelledBy="more-products-title">
      {/* Naming rule: "the EzyAgric App", capital A. */}
      <SectionHeader id="more-products-title" title={`More in the ${site.name} App`} />
      <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {others.map((other) => (
          <li key={other.slug}>
            <Link
              prefetch={false}
              href={`/${other.slug}/`}
              className="group flex h-full items-center gap-4 rounded-card border border-line bg-card p-4 transition-colors hover:border-secondary"
            >
              <ProductMark product={other} size="sm" />
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-heading text-title group-hover:underline">
                  {other.name}
                </span>
                <span className="block text-sm font-label text-pretty text-accent">
                  {other.appTagline}
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="size-5 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}
