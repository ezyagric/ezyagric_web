import Image from "next/image";
import { isVisible, type Product } from "@/lib/content";
import { playStoreUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { ClaimText } from "@/components/ui/Pending";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { hasTryIt } from "./kaezy/TryKaEzy";
import { PayWaysVisual } from "./PayWaysVisual";
import { Wave } from "@/components/ui/Wave";

/**
 * Product hero on plain white (brand guide: white carries the page, and the
 * product artwork is drawn on pure white). On a 360px phone the headline,
 * intro and the install buttons come first; the visual follows. Same layout
 * as the home hero, so the four pages feel like one family.
 */
export function ProductHero({ product }: { product: Product }) {
  const { hero, cta, availability } = product;
  const tryHere = hasTryIt(product);

  return (
    <section aria-labelledby="product-title" className="overflow-hidden bg-canvas">
      <Container className="grid items-center gap-10 pt-4 pb-14 sm:pt-8 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12">
        <div>
          <Eyebrow product={product} />
          <h1
            id="product-title"
            className="mt-4 text-4xl font-heading tracking-heading text-balance text-heading sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-body sm:text-xl">{hero.intro}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* Guide: primary buttons are a green fill, whatever the product. */}
            {/* Ka-Ezy: "Try Ka-Ezy free" opens the demo on this page when it is
                shown; otherwise (and for the other products) the app. */}
            <ButtonLink
              href={tryHere ? "#try-ka-ezy" : playStoreUrl(cta.campaign, "product-hero")}
              track={tryHere ? "kaezy_try_hero" : "get_app_click"}
              trackProps={{ product: product.slug, position: "product-hero" }}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Icon name={product.icon} className="size-5" />
              {cta.label}
            </ButtonLink>
            <StoreBadges campaign={cta.campaign} medium="product-hero" />
          </div>

          {availability && isVisible(availability) ? (
            <p className="mt-5 flex items-start gap-2 text-base text-muted">
              <Icon name="map-pin" className="mt-0.5 size-5 shrink-0 text-accent-bright" />
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
 * "Ka-Ezy · Your 24/7 farm expert": the product's icon in a solid circle,
 * then the product name highlighted in green (guide: green highlights
 * product names) and the descriptor in navy. Sentence case rather than the
 * caps label style, so product names keep their spelling.
 */
function Eyebrow({ product }: { product: Product }) {
  const { eyebrow } = product.hero;
  const split = eyebrow.indexOf(" · ");
  const name = split > 0 ? eyebrow.slice(0, split) : eyebrow;
  const rest = split > 0 ? eyebrow.slice(split + 3) : "";

  return (
    <p className="flex items-center gap-3 text-base font-label">
      <IconCircle name={product.icon} color={product.accent} size="sm" />
      <span>
        <span className="font-heading text-accent">{name}</span>
        {rest ? (
          <>
            {" "}
            <span aria-hidden="true" className="text-accent-bright">
              ·
            </span>{" "}
            <span className="text-body">{rest}</span>
          </>
        ) : null}
      </span>
    </p>
  );
}

/**
 * The app screenshot beside the product artwork (Ka-Ezy), else the artwork
 * on its own, else, for EzyCredits, an HTML illustration of its two ways to
 * pay. The artwork is drawn on a pure white background, so it never
 * overlaps the phone or sits on a tint: it would show as a white box.
 */
function HeroVisual({ product }: { product: Product }) {
  const { screenshot, image } = product.hero;

  if (screenshot && image) {
    // The full-length Ka-Ezy character (640x1312) has wide white margins
    // above and below him; the crop (object-cover) trims them so his feet
    // line up with the phone. Square artwork (Agrishop) is shown whole.
    const fullLength = image.height > image.width * 1.5;
    // Two columns that scale together, so the pair fits a 360px phone
    // without overflowing and lines up at the bottom on every width.
    return (
      // The pair stands on the brand wave, which also hides the flat crop of
      // the full-length Ka-Ezy artwork at his knees.
      <div className="relative mx-auto grid w-full max-w-md grid-cols-[1fr_1.2fr] items-end gap-3 sm:max-w-lg sm:gap-5 lg:max-w-none">
        <PhoneFrame
          image={screenshot}
          preload
          className="w-full"
          sizes="(min-width: 1024px) 210px, (min-width: 640px) 230px, 42vw"
        />
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes="(min-width: 1024px) 260px, (min-width: 640px) 280px, 52vw"
          className={
            fullLength
              ? "aspect-[640/1000] h-auto w-full object-cover object-[50%_60%]"
              : "h-auto w-full"
          }
        />
        {fullLength ? <Wave id={`${product.slug}-hero-wave`} className="h-12 sm:h-16" /> : null}
      </div>
    );
  }

  if (screenshot) {
    return (
      <PhoneFrame
        image={screenshot}
        preload
        className="mx-auto w-52 sm:w-64 lg:w-72"
        sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 208px"
      />
    );
  }

  if (image) {
    return (
      <div className="mx-auto w-full max-w-xs sm:max-w-sm">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          preload
          sizes="(min-width: 640px) 384px, 320px"
          className="h-auto w-full"
        />
      </div>
    );
  }

  return <PayWaysVisual product={product} />;
}
