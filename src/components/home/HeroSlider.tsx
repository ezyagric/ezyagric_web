import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getProducts, getSite, type ImageData, type Product } from "@/lib/content";
import { Carousel } from "@/components/ui/Carousel";
import { IconCircle } from "@/components/ui/IconCircle";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PayWaysVisual } from "@/components/product/PayWaysVisual";

/**
 * The home hero visual as a slider, one slide per service (content/products,
 * in order). Each slide reuses the product's own hero art: Ka-Ezy with his
 * screen, Agrishop with the shop screen, EzyCredits' two ways to pay, and
 * Produce Market with the app home screen (which shows its tile). The art
 * stands on the hero's brand wave, which also hides the flat crop of the
 * full-length Ka-Ezy artwork at his knees.
 */
export function HeroSlider() {
  const products = getProducts();
  const { hero } = getSite();

  return (
    <Carousel
      label="EzyAgric services"
      // min-w-0: a grid item would otherwise grow to the width of all slides.
      className="w-full min-w-0"
      slides={products.map((product, i) => ({
        id: `hero-slide-${product.slug}`,
        name: product.name,
        icon: <IconCircle name={product.icon} color={product.accent} size="sm" />,
        content: <Slide product={product} homeScreen={hero.screenshot} first={i === 0} />,
      }))}
    />
  );
}

function Slide({ product, homeScreen, first }: { product: Product; homeScreen: ImageData; first: boolean }) {
  const { image, screenshot } = product.hero;
  const screen = screenshot ?? (image ? homeScreen : undefined);
  const fullLength = !!image && image.height > image.width * 1.5;

  return (
    // h-full: every slide is as tall as the tallest (the track stretches
    // them), so a caption that wraps never lifts the art off the wave.
    <div className="flex h-full flex-col">
      {/* pr-14 keeps the line clear of the pause button at the top right. */}
      <p className="mt-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0 pr-14 pl-1 text-base">
        <span className="text-body">{product.appTagline}</span>
        <Link
          prefetch={false}
          href={`/${product.slug}/`}
          className="inline-flex min-h-11 items-center gap-1 rounded-control font-heading text-link hover:underline"
        >
          Learn more <span className="sr-only">about {product.name}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </p>

      {/* Same height for every slide, pinned to the bottom (mt-auto) with the
          art aligned to the wave. */}
      {/* Sized so the slider and the hero text end level (see Hero): 27rem
          from xl, one step smaller at lg, where the slider's column is about
          400px wide at 1024. */}
      <div className="mt-auto flex h-80 items-end justify-center sm:h-[26rem] xl:h-[27rem]">
        {!image && !screenshot ? (
          // The two cards are ~440px tall at full size: scaled so they fit
          // the slide above the wave at every width (lg: 360 + 48 in 416px).
          // pointer-events-none: decorative, never in the way of the caption link.
          <div className="pointer-events-none mb-8 w-full origin-bottom scale-[0.62] sm:mb-12 sm:scale-[0.78] lg:mb-12 lg:scale-[0.82] xl:mb-16">
            <PayWaysVisual product={product} />
          </div>
        ) : (
          <>
            {image ? (
              fullLength ? (
                <div className="relative aspect-[640/958] h-full shrink-0">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    preload={first}
                    sizes="(min-width: 1280px) 290px, (min-width: 640px) 280px, 192px"
                    className="size-full object-cover object-[50%_53.7%]"
                  />
                </div>
              ) : (
                <div className="mb-14 w-36 shrink-0 sm:mb-20 sm:w-56 lg:mb-28 xl:w-60">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={image.width}
                    height={image.height}
                    preload={first}
                    sizes="(min-width: 1280px) 240px, (min-width: 640px) 224px, 144px"
                    className="h-auto w-full"
                  />
                </div>
              )
            ) : null}
            {screen ? (
              <div className="relative -ml-10 shrink-0 sm:-ml-12">
                <PhoneFrame
                  image={screen}
                  className="w-28 sm:w-40 xl:w-44"
                  sizes="(min-width: 1280px) 176px, (min-width: 640px) 160px, 112px"
                />
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
