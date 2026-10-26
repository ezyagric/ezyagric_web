import Image from "next/image";
import { isVisible, type Product } from "@/lib/content";
import { playStoreUrl } from "@/lib/links";
import { ACCENTS } from "@/components/ui/accents";
import { ButtonLink, PlayBadge } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText } from "@/components/ui/Pending";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { PayWaysVisual } from "./PayWaysVisual";
import { TONES } from "./tones";

/**
 * Product hero. On a 360px phone the headline, intro and both install
 * buttons come first; the visual follows. Same layout as the home hero, so
 * the four pages feel like one family, with the product's accent colour.
 */
export function ProductHero({ product }: { product: Product }) {
  const accent = ACCENTS[product.accent];
  const tone = TONES[product.accent];
  const { hero, cta, availability } = product;

  return (
    <section
      aria-labelledby="product-title"
      className={`overflow-hidden bg-linear-to-b to-white ${tone.heroFrom}`}
    >
      <Container className="grid items-center gap-10 pt-4 pb-14 sm:pt-8 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          {/* A white pill keeps the accent text above 4.5:1 on the tinted background. */}
          <p
            className={`inline-flex rounded-full bg-white px-3 py-1 text-sm font-bold tracking-wide ring-1 ${accent.text} ${accent.ring}`}
          >
            {hero.eyebrow}
          </p>
          <h1
            id="product-title"
            className="mt-4 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-muted sm:text-xl">{hero.intro}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <ButtonLink
              href={playStoreUrl(cta.campaign, "product-hero")}
              track="get_app_click"
              trackProps={{ product: product.slug, position: "product-hero" }}
              size="lg"
              variant="accent"
              className={`w-full sm:w-auto ${accent.button}`}
            >
              <Icon name={product.icon} className="size-5" />
              {cta.label}
            </ButtonLink>
            <PlayBadge campaign={cta.campaign} medium="product-hero" />
          </div>

          {availability && isVisible(availability) ? (
            <p className="mt-5 flex items-start gap-2 text-base text-muted">
              <Icon name="map-pin" className={`mt-0.5 size-5 shrink-0 ${accent.text}`} />
              <span>
                <ClaimText claim={availability} />
              </span>
            </p>
          ) : null}
        </div>

        <HeroVisual product={product} />
      </Container>
    </section>
  );
}

/**
 * The app screenshot when there is one (with the product artwork beside it
 * from sm up), else the artwork on its own, else, for EzyCredits, an
 * HTML illustration of its two ways to pay.
 */
function HeroVisual({ product }: { product: Product }) {
  const tone = TONES[product.accent];
  const { screenshot, image } = product.hero;

  if (screenshot) {
    return (
      // Padding on the wrapper makes room for the artwork that overlaps the
      // phone's left edge, so nothing overflows sideways.
      <div className="relative isolate mx-auto w-fit sm:pl-24 lg:pl-28">
        <div
          aria-hidden="true"
          className={`absolute top-1/4 right-0 -z-10 aspect-square w-64 rounded-full sm:w-80 ${tone.blob}`}
        />
        <PhoneFrame
          image={screenshot}
          preload
          className="w-52 sm:w-64 lg:w-72"
          sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 208px"
        />
        {image ? (
          <div className="absolute bottom-6 left-0 hidden w-36 overflow-hidden rounded-3xl bg-white p-2 shadow-xl shadow-ink/15 ring-1 ring-black/5 sm:block lg:w-40">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1024px) 144px, 128px"
              className="h-auto w-full rounded-2xl"
            />
          </div>
        ) : null}
      </div>
    );
  }

  if (image) {
    return (
      <div className="relative isolate mx-auto w-full max-w-xs sm:max-w-sm">
        <div
          aria-hidden="true"
          className={`absolute -inset-4 -z-10 rounded-full sm:-inset-8 ${tone.blob}`}
        />
        <div className="overflow-hidden rounded-[2rem] bg-white p-3 shadow-2xl shadow-ink/15 ring-1 ring-black/5">
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            preload
            sizes="(min-width: 640px) 360px, 296px"
            className="h-auto w-full rounded-3xl"
          />
        </div>
      </div>
    );
  }

  return <PayWaysVisual product={product} />;
}
