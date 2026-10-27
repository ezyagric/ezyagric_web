import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, visible, type Accent, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PendingBadge } from "@/components/ui/Pending";
import { CheckDot, Highlight } from "./parts";

// Each card's top panel takes the product's accent as a soft tint, with its
// icon as a large faint watermark. Full class strings so Tailwind finds them.
const PANEL: Record<Accent, { tint: string; mark: string }> = {
  brand: { tint: "bg-brand-soft", mark: "text-brand/10" },
  accent: { tint: "bg-accent-soft", mark: "text-accent-bright/15" },
  deep: { tint: "bg-brand-soft-strong", mark: "text-inverse/10" },
};

/**
 * The four tools, one card each. Kept at 2x2 on large screens: four narrow
 * columns made the points wrap into tall, hard-to-scan blocks.
 * id="solutions" is the old site's anchor, so existing links still land here.
 *
 * Each card opens on a tinted panel in the product's accent: its artwork as
 * an app-icon tile, the name, and the app tagline on a white pill (green
 * stays on white, so it keeps its contrast). Below: the summary, the points,
 * and "Learn more" with an arrow in the product's colour. Green is the
 * highlight: the tagline, and product names and prices in the copy.
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
        wide
      />
      <ul className="grid gap-5 md:grid-cols-2 lg:gap-6">
        {products.map((product) => (
          <li key={product.slug}>
            <ServiceCard product={product} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function ServiceCard({ product }: { product: Product }) {
  const href = `/${product.slug}/`;
  const panel = PANEL[product.accent];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-card shadow-card transition duration-300 hover:shadow-raised motion-safe:hover:-translate-y-1">
      <div className={`relative isolate flex items-center gap-4 overflow-hidden p-5 sm:gap-5 sm:p-7 ${panel.tint}`}>
        <Icon
          name={product.icon}
          className={`absolute -right-6 -bottom-8 -z-10 size-40 -rotate-12 transition-transform duration-500 motion-safe:group-hover:-rotate-6 ${panel.mark}`}
        />
        <AppTile product={product} />
        <div className="min-w-0">
          <h3 className="text-2xl font-heading tracking-heading text-title">
            {/* Padding offset by negative margin: a 48px tap target
                without changing the card's layout. */}
            <Link prefetch={false} href={href} className="-my-3 inline-block rounded-control py-3 hover:underline">
              {product.name}
            </Link>
          </h3>
          {/* 15px corners: a pill on one line, a soft tag if a long tagline wraps. */}
          <p className="mt-2 inline-flex items-center gap-2 rounded-[15px] bg-card px-3 py-1 text-sm font-label text-pretty text-accent shadow-card">
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${ACCENTS[product.accent].bar}`} />
            {product.appTagline}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5 sm:px-7 sm:pt-6 sm:pb-5">
        <p className="text-base text-pretty text-body">
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

        {/* A text link with the arrow in a circle of the product's colour,
            which slides on hover. Wraps cleanly on a 360px screen. The
            divider is on a wrapper: the link's rounded corners would bend it. */}
        <div className="mt-auto pt-5">
          <div className="border-t border-line pt-3">
            <Link
              prefetch={false}
              href={href}
              className="flex min-h-12 items-center justify-between gap-3 rounded-control font-heading text-link"
            >
              <span className="underline-offset-4 group-hover:underline">Learn more about {product.name}</span>
              <span
                aria-hidden="true"
                className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-transform motion-safe:group-hover:translate-x-1 ${ACCENTS[product.accent].icon}`}
              >
                <ArrowRight className="size-5" />
              </span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * The product's artwork as an app icon: a white rounded tile (the artwork is
 * drawn on white). EzyCredits has no artwork: its icon, white on its accent.
 */
function AppTile({ product }: { product: Product }) {
  const image = product.card.image;
  // One step smaller below lg, where the two columns are narrow.
  const tile = "size-20 shrink-0 overflow-hidden rounded-[1.5rem] shadow-raised lg:size-24 lg:rounded-[1.75rem]";

  if (image) {
    return (
      <div className={`${tile} bg-card`}>
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 96px, 80px"
          className="size-full object-contain"
        />
      </div>
    );
  }
  return (
    <div className={`${tile} flex items-center justify-center ${ACCENTS[product.accent].icon}`}>
      <Icon name={product.icon} className="size-10 lg:size-11" />
    </div>
  );
}
