import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite, type Accent } from "@/lib/content";
import { DemoVideoPlayer } from "@/components/product/DemoVideoPlayer";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";

// Each tile on a soft tint of its product's accent, with the product's icon
// as a large faint watermark in the corner (as on the product pages' feature
// tiles). The text is navy on every tint. Full class strings so Tailwind can
// find them.
const TINTS: Record<Accent, { box: string; mark: string }> = {
  brand: { box: "bg-brand-soft ring-brand-soft-strong", mark: "text-brand opacity-10" },
  accent: { box: "bg-accent-soft ring-accent-soft-strong", mark: "text-accent-bright opacity-15" },
  deep: { box: "bg-brand-soft-strong ring-brand-soft-strong", mark: "text-inverse opacity-10" },
};

/**
 * Livestock: a poultry farmer's video (self-hosted, nothing downloads until
 * play is tapped) beside four product tiles, each saying what the product
 * does for livestock farmers and linking to its page, then four stills from
 * the video in a row.
 *
 * Phones and tablets: the header, the video, the tiles two by two, the
 * stills two by two. From lg the video and the tiles share a row and its
 * height: the tiles fill it in two rows, and if they need more room than
 * the 16:9 video gives, the video box grows to match (its poster is cropped
 * to fit, and the playing video is letterboxed).
 */
export function Livestock() {
  const { livestock } = getSite();
  if (!livestock) return null;
  const { video } = livestock;
  const points = livestock.points.flatMap((point) => {
    const product = getProduct(point.product);
    return product ? [{ ...point, product }] : [];
  });

  return (
    <Section id="livestock" tone="subtle" labelledBy="livestock-title">
      <SectionHeader id="livestock-title" eyebrow={livestock.eyebrow} title={livestock.title} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        {/* From lg the spacer keeps the box at least 16:9 and the player
            fills it, however tall the row grows. */}
        <div className="relative overflow-hidden rounded-media shadow-raised">
          <div aria-hidden="true" className="hidden aspect-video lg:block" />
          <div className="lg:absolute lg:inset-0">
            <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} className="lg:aspect-auto lg:h-full" />
          </div>
        </div>

        {/* role="list": Safari drops the list role from unstyled lists. */}
        <ul role="list" className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-rows-2">
          {points.map(({ product, text }) => {
            const tint = TINTS[product.accent];
            return (
              <li key={product.slug} className="min-w-0">
                <Link
                  prefetch={false}
                  href={`/${product.slug}/`}
                  data-track="livestock_product_click"
                  data-track-product={product.slug}
                  className={`group relative isolate flex h-full flex-col overflow-hidden rounded-card p-4 ring-1 transition-shadow hover:shadow-raised sm:p-5 lg:p-4 ${tint.box}`}
                >
                  <Icon
                    name={product.icon}
                    className={`absolute -right-5 -bottom-6 -z-10 size-28 -rotate-12 ${tint.mark}`}
                  />
                  {/* The icon and the arrow on top, so the name has the
                      tile's whole width (the tiles are narrow from lg). */}
                  <span className="flex items-center justify-between gap-3">
                    <IconCircle name={product.icon} color={product.accent} size="sm" className="ring-4 ring-card" />
                    {/* Nudges along on hover: the whole tile is the link. */}
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full bg-card text-secondary shadow-card transition-transform group-hover:translate-x-0.5"
                    >
                      <ArrowRight className="size-4" />
                    </span>
                  </span>
                  <span className="mt-3 font-heading text-title lg:mt-2">{product.name}</span>
                  {/* A step smaller on phones and from lg, where the tiles are
                      narrowest (from lg the padding too), so the tiles stay
                      close to the video's own height. */}
                  <span className="mt-1 text-sm text-pretty text-body sm:text-base lg:text-sm">{text}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Stills from the video. Lazy-loaded: below the fold. */}
      <ul role="list" className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        {livestock.photos.map((photo) => (
          <li key={photo.src} className="relative aspect-[4/3] overflow-hidden rounded-media shadow-card">
            <Image
              src={photo.src}
              alt={photo.alt}
              fill
              sizes="(min-width: 1024px) 270px, (min-width: 640px) 45vw, calc(50vw - 22px)"
              className="object-cover"
              style={photo.focus ? { objectPosition: photo.focus } : undefined}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
