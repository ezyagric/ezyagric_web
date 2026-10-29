import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBusiness, getBusinessModules, getProducts, getSite, type ImageData, type Product } from "@/lib/content";
import { Carousel } from "@/components/ui/Carousel";
import { IconCircle } from "@/components/ui/IconCircle";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PayLaterVisual } from "@/components/product/PayLaterVisual";

/**
 * The home hero visual as a slider, one slide per service (content/products,
 * in order), then EzyAgric Business. Each service slide reuses the product's
 * own hero art: Ka-Ezy with his screen, Agrishop with the shop screen,
 * EzyCredits' Pay Later card, and Produce Market with the app home screen
 * (which shows its tile). The art stands on the hero's brand wave, which also
 * hides the flat crop of the full-length Ka-Ezy artwork at his knees.
 */
export function HeroSlider() {
  const products = getProducts();
  const { hero } = getSite();
  const business = getBusiness();

  return (
    <Carousel
      label="EzyAgric services"
      // min-w-0: a grid item would otherwise grow to the width of all slides.
      className="w-full min-w-0"
      slides={[
        ...products.map((product, i) => ({
          id: `hero-slide-${product.slug}`,
          name: product.name,
          icon: <NumberedIcon number={i + 1} icon={<IconCircle name={product.icon} color={product.accent} size="sm" />} />,
          content: <Slide product={product} homeScreen={hero.screenshot} first={i === 0} />,
        })),
        {
          id: "hero-slide-ezyagric-business",
          name: business.name,
          icon: <NumberedIcon number={products.length + 1} icon={<IconCircle name="users" color="brand" size="sm" />} />,
          content: <BusinessSlide />,
        },
      ]}
    />
  );
}

/**
 * A service's icon in the switcher with its number (1 to 4 for the services,
 * in the Farmer Services menu's order, then 5 for EzyAgric Business, whose
 * modules make up the Agribusiness Services menu) in a small white badge at its top right, like the step
 * badges in the Ka-Ezy banner. Decoration: each slide is announced as
 * "n of 5: name".
 */
function NumberedIcon({ number, icon }: { number: number; icon: ReactNode }) {
  return (
    <span className="relative inline-flex shrink-0">
      {icon}
      <span
        aria-hidden="true"
        className="absolute -top-1.5 -right-1.5 flex size-4.5 items-center justify-center rounded-full bg-card text-[11px] font-heading text-title tabular-nums shadow-card ring-1 ring-line"
      >
        {number}
      </span>
    </span>
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
      {/* Starts flush with the switcher's left edge above it. pr-14 keeps
          the line clear of the pause button at the top right. Without
          JavaScript the switcher cannot follow a swipe, so the slide names
          itself (noscript: hidden whenever scripts run). */}
      <p className="mt-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0 pr-14 text-base">
        <span className="text-body">
          <noscript>
            <span className="font-heading text-title">{product.name}</span> ·{" "}
          </noscript>
          {product.appTagline}
        </span>
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
            <PayLaterVisual product={product} />
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

/**
 * EzyAgric Business: the platform on a laptop and tablet standing on the
 * wave, under its four modules as small chips, each in the colour and icon
 * of the service it is built on (two by two, the right-hand column a little
 * lower). The chips are decoration: the caption names the page, and the
 * page lists the modules. Sized so chips and laptop fit above the wave on a
 * 320px phone (264px), from sm (336px) and from lg (304px).
 */
function BusinessSlide() {
  const business = getBusiness();
  const modules = getBusinessModules();
  // The laptop and tablet mockup the EzyProduce module shows.
  const mockup = modules.find((module) => !module.screen.frame)?.screen;

  return (
    <div className="flex h-full flex-col">
      <p className="mt-2 flex min-h-11 flex-wrap items-center gap-x-3 gap-y-0 pr-14 text-base">
        <span className="text-body">
          <noscript>
            <span className="font-heading text-title">{business.name}</span> ·{" "}
          </noscript>
          {business.tagline}
        </span>
        <Link
          prefetch={false}
          href="/ezyagric-business/"
          data-track="business_page_click"
          data-track-position="home-hero-slide"
          className="inline-flex min-h-11 items-center gap-1 rounded-control font-heading text-link hover:underline"
        >
          Learn more <span className="sr-only">about {business.name}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </p>

      <div className="mt-auto flex h-80 items-end justify-center sm:h-[26rem] xl:h-[27rem]">
        {/* Lower than the other slides' art (mb-14 / 20 / 28): the mockup's
            transparent foot would otherwise leave the laptop floating above
            the wave. */}
        <div className="mb-10 flex w-[17rem] flex-col items-center gap-3 sm:mb-14 sm:w-[22rem] lg:mb-20">
          <ul aria-hidden="true" className="grid w-full grid-cols-2 gap-2">
            {modules.map((module, i) => (
              <li
                key={module.id}
                className={`flex min-w-0 items-center gap-1.5 rounded-pill bg-card py-1 pr-2.5 pl-1 text-xs font-label text-title shadow-raised ring-1 ring-line sm:text-sm ${
                  i % 2 === 1 ? "translate-y-1.5" : ""
                }`}
              >
                <IconCircle name={module.product.icon} color={module.product.accent} size="xs" />
                <span className="truncate">{module.name}</span>
              </li>
            ))}
          </ul>
          {mockup ? (
            <Image
              src={mockup.src}
              alt={mockup.alt}
              width={mockup.width}
              height={mockup.height}
              sizes="(min-width: 640px) 352px, 272px"
              className="h-auto w-full"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
