import type { Product } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Highlight, plainText } from "@/components/home/parts";
import { AppTile } from "./RelatedProducts";

/**
 * Closing band on the signature blue-green gradient (on-inverse text passes
 * across it): the product's app tile beside the call to action and the
 * product's summary. No store badges: the footer right below has them (the
 * team's call, 27 Oct 2026), and the hero has them too.
 *
 * From sm one row: tile and text centred on one line. From lg the summary is
 * narrowed (max-w-md), so each product's runs to two lines and the tile
 * with its ring (104px) is as tall as the heading and summary beside it
 * (106px). On phones the tile sits beside the heading, like an app listing,
 * and the summary runs the full width below.
 *
 * The decoration only lightens the blue end of the gradient (the rings and
 * glow round the tile, where white text has 11:1) and only darkens the
 * green end (the product's icon as a navy watermark), so white text keeps
 * at least the gradient's own 5.1:1 everywhere.
 */
export function ProductCtaBand({ product }: { product: Product }) {
  return (
    <section
      aria-labelledby="closing-band-title"
      // globals.css switches the focus ring to focus-inverse on .gradient-brand.
      // overflow-clip (not hidden): the band clips its decoration without
      // becoming a box that focus could scroll sideways.
      className="relative isolate overflow-clip gradient-brand text-on-inverse"
    >
      <Icon
        name={product.icon}
        className="absolute -right-10 -bottom-16 -z-10 size-56 -rotate-12 text-inverse/15 sm:size-72"
      />
      <Container className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-10 sm:gap-x-8 sm:py-12 lg:gap-x-10">
        <div className="relative">
          {/* Two thin rings and a soft glow radiate from the tile. The outer
              ring (from sm) ends at the column gap, so no line crosses the text. */}
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 size-[135%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-inverse/25"
          />
          <span
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -z-10 hidden size-[180%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-inverse/10 sm:block"
          />
          <span aria-hidden="true" className="absolute -inset-3 -z-10 rounded-tile bg-on-inverse/20 blur-xl" />
          <AppTile
            product={product}
            sizes="(min-width: 1024px) 96px, (min-width: 640px) 80px, 64px"
            className="size-16 shadow-raised ring-4 ring-on-inverse/30 sm:size-20 lg:size-24"
          />
        </div>

        {/* contents on phones: the heading joins the tile's row and the
            summary takes the full width below them. */}
        <div className="contents sm:block">
          <h2
            id="closing-band-title"
            className="text-3xl font-heading tracking-heading text-balance text-on-inverse sm:text-4xl"
          >
            {/* Product names stay whole ("Ka-Ezy" would otherwise break at its hyphen). */}
            <Highlight text={plainText(product.cta.label)} className="" />
          </h2>
          <p className="col-span-2 text-lg text-pretty text-on-inverse sm:mt-2 lg:max-w-md">
            {plainText(product.card.summary)}
          </p>
        </div>
      </Container>
    </section>
  );
}
