import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite } from "@/lib/content";
import { DemoVideoPlayer } from "@/components/product/DemoVideoPlayer";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { Highlight } from "./parts";

/**
 * A poultry farmer's story: his video (self-hosted, nothing downloads until
 * play is tapped), who he is, what each product does for poultry farmers
 * (each a link to its page), and four stills from the video in a row.
 *
 * Phones: the header, the video, the products, then the stills (two by two).
 * From lg the video stands on the left, centred against the header and the
 * products on the right; the stills run in one row under both.
 */
export function Poultry() {
  const { poultry } = getSite();
  if (!poultry) return null;
  const { video, person } = poultry;
  const points = poultry.points.flatMap((point) => {
    const product = getProduct(point.product);
    return product ? [{ ...point, product }] : [];
  });

  return (
    <Section id="poultry" tone="subtle" labelledBy="poultry-title">
      <div className="grid lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-x-12">
        <div className="lg:col-start-2 lg:row-start-1">
          <SectionHeader id="poultry-title" eyebrow={poultry.eyebrow} title={poultry.title} intro={poultry.intro} />
        </div>

        <figure className="mb-8 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:mb-0 lg:self-center">
          <div className="overflow-hidden rounded-media shadow-raised">
            <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} />
          </div>
          <figcaption className="mt-4 flex items-center gap-3">
            <Image
              src={person.photo.src}
              alt={person.photo.alt}
              width={48}
              height={48}
              className="size-12 shrink-0 rounded-full object-cover ring-2 ring-card"
            />
            <span className="min-w-0">
              <span className="block font-heading text-title">{person.name}</span>
              <span className="block text-sm text-muted">
                {person.role} · {video.length} video
              </span>
            </span>
          </figcaption>
        </figure>

        {/* role="list": Safari drops the list role from unstyled lists. */}
        <ul role="list" className="space-y-3 lg:col-start-2 lg:row-start-2">
          {points.map(({ product, text }) => (
            <li key={product.slug}>
              <Link
                prefetch={false}
                href={`/${product.slug}/`}
                data-track="poultry_product_click"
                data-track-product={product.slug}
                className="group flex min-h-16 items-center gap-4 rounded-card bg-card py-3 pr-4 pl-3 shadow-card ring-1 ring-line transition-shadow hover:ring-secondary"
              >
                <IconCircle name={product.icon} color={product.accent} />
                <span className="min-w-0 flex-1 text-base text-pretty text-body">
                  <Highlight text={text} />
                </span>
                <ArrowRight
                  aria-hidden="true"
                  className="size-5 shrink-0 text-secondary transition-transform group-hover:translate-x-0.5"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Stills from the video. Lazy-loaded: below the fold. */}
      <ul role="list" className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-12 lg:grid-cols-4 lg:gap-6">
        {poultry.photos.map((photo) => (
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
