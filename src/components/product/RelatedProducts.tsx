import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, type Accent, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import type { BandTone } from "./tones";

// The strip behind each card's app tile takes the product's accent as a soft
// tint. Where the strip runs across the card's top (tablets), it is wide
// enough for the product's icon as a faint watermark, like the home page's
// service cards; the narrow side strips have no room for one. Full class
// strings so Tailwind finds them.
const STRIP: Record<Accent, { tint: string; mark: string }> = {
  brand: { tint: "bg-brand-soft", mark: "text-brand/10" },
  accent: { tint: "bg-accent-soft", mark: "text-accent-bright/15" },
  deep: { tint: "bg-brand-soft-strong", mark: "text-inverse/10" },
};

/**
 * The other three products as compact cards in the style of the home page's
 * service cards: the app tile on a tinted strip in the product's accent, the
 * name, the app tagline (green on white, so it keeps its contrast) and an
 * arrow in the product's colour. Each whole card is one link, a big tap
 * target that reads well on its own ("Agrishop Buy crop & livestock inputs
 * and services").
 *
 * Rows on phones, with a narrower strip, tile and arrow below sm so the
 * names and short taglines stay on one line at 320px. Three columns from md:
 * on tablets the strip runs across the top, its tile level with the text's
 * left edge, with the name, tagline and arrow below; from lg the cards are
 * rows again, the tile a step larger from xl. The name and tagline are
 * centred on the arrow (and, in rows, on the tile), so no card keeps a blank
 * line for a tagline that fits on one: when one tagline wraps, the other
 * cards in its row centre theirs in the extra height.
 */
export function RelatedProducts({ product, tone }: { product: Product; tone: BandTone }) {
  const site = getSite();
  const others = getProducts().filter((p) => p.slug !== product.slug);

  return (
    <Section id="more-products" tone={tone} labelledBy="more-products-title">
      {/* Naming rule: "the EzyAgric App", capital A. */}
      <SectionHeader id="more-products-title" title={`More in the ${site.name} App`} />
      <ul className="grid gap-4 md:grid-cols-3 lg:gap-6">
        {others.map((other) => {
          const strip = STRIP[other.accent];
          return (
            <li key={other.slug}>
              <Link
                prefetch={false}
                href={`/${other.slug}/`}
                className="group flex h-full min-h-20 overflow-hidden rounded-card border border-line bg-card shadow-card transition duration-300 hover:shadow-raised motion-safe:hover:-translate-y-0.5 md:flex-col lg:flex-row xl:min-h-24"
              >
                <span
                  className={`relative isolate flex w-16 shrink-0 items-center justify-center overflow-hidden sm:w-20 md:w-auto md:justify-start md:p-4 lg:w-20 lg:justify-center lg:p-0 xl:w-24 ${strip.tint}`}
                >
                  <Icon
                    name={other.icon}
                    className={`absolute -right-4 -bottom-6 -z-10 hidden size-24 -rotate-12 transition-transform duration-500 md:block lg:hidden motion-safe:group-hover:-rotate-6 ${strip.mark}`}
                  />
                  <AppTile
                    product={other}
                    sizes="(min-width: 1280px) 64px, (min-width: 640px) 56px, 48px"
                    className="size-12 shadow-card sm:size-14 xl:size-16"
                  />
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-3 p-4">
                  <span className="min-w-0 flex-1">
                    <span className="block text-lg leading-snug font-heading text-title underline-offset-4 group-hover:underline">
                      {other.name}
                    </span>
                    <span className="mt-1 block text-sm font-label text-pretty text-accent">
                      {other.appTagline}
                    </span>
                  </span>
                  {/* The arrow in a circle of the product's colour slides on hover. */}
                  <span
                    aria-hidden="true"
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full transition-transform motion-safe:group-hover:translate-x-1 sm:size-9 ${ACCENTS[other.accent].icon}`}
                  >
                    <ArrowRight className="size-4 sm:size-4.5" />
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

/**
 * A product's artwork as an app icon, as on the home page's service cards:
 * a white tile (the artwork is drawn on white), with a 4px margin that keeps
 * it clear of the round corners on small tiles. EzyCredits has no artwork:
 * its icon, white on its accent. Size and elevation come from `className`;
 * the closing band (ProductCtaBand) uses it too.
 */
export function AppTile({
  product,
  sizes,
  className,
}: {
  product: Product;
  /** The tile's rendered widths, for the image's `sizes`. */
  sizes: string;
  className: string;
}) {
  const image = product.card.image;

  if (image) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-tile bg-card p-1 ${className}`}>
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes={sizes}
          className="size-full object-contain"
        />
      </span>
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-tile ${ACCENTS[product.accent].icon} ${className}`}
    >
      <Icon name={product.icon} className="size-1/2" />
    </span>
  );
}
