import Image from "next/image";
import { isVisible, type Accent, type Product } from "@/lib/content";
import { playStoreUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { Highlight } from "@/components/home/parts";
import { TryKaEzyButton } from "@/components/promo/KaEzyBanner";
import { PayLaterVisual } from "./PayLaterVisual";
import { Wave } from "@/components/ui/Wave";

/**
 * Product hero on plain white (brand guide: white carries the page, and the
 * product artwork is drawn on pure white). On a 360px phone the headline,
 * intro, key facts and the install buttons come first; the visual follows.
 * Same layout as the home hero, so the four pages feel like one family:
 * product names in green, and from lg the intro centred between the
 * headline and the buttons.
 */
export function ProductHero({ product }: { product: Product }) {
  const { hero, cta } = product;

  return (
    <section aria-labelledby="product-title" className="overflow-hidden bg-canvas">
      {/* From lg the text column stretches to the visual's height: the eyebrow
          lines up with the top of the image and the button row with its
          bottom. 1.15fr and the 32px gap (as on the home hero) leave room
          for the button and both store badges on one row at 1024px, even
          beside a 17px scrollbar. Between lg and 72rem (where the container
          stops growing) the visual is at its shortest, so the headline and
          intro are a step smaller there to keep the text within its height
          (10px to spare at worst: Agrishop at 1024px beside that scrollbar). */}
      <Container className="grid items-center gap-8 pt-4 pb-12 sm:pt-5 sm:pb-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
        <div className="lg:flex lg:flex-col">
          <Eyebrow product={product} />
          {/* Product names in Vibrant Green (large text, so accent-bright passes). */}
          <h1
            id="product-title"
            className="mt-3 text-4xl font-heading tracking-heading text-balance text-heading sm:text-5xl min-[72rem]:text-6xl"
          >
            <Highlight text={hero.headline} className="text-accent-bright" />
          </h1>
          {/* From lg, centred between the headline and the buttons, as on the
              home hero: the spare height goes evenly above and below it, and
              py-2 is only the least it gets. */}
          <p className="mt-3 max-w-xl text-lg text-pretty text-body sm:mt-4 sm:text-xl lg:my-auto lg:py-2 lg:text-lg min-[72rem]:text-xl">
            <Highlight text={hero.intro} />
          </p>

          <div className="mt-6 lg:mt-0">
            <FactChips product={product} />
            {/* The button and the store badges on one row, all 48px tall
                (full-width button on phones). From lg the row never wraps:
                where it is tight (production, near 1024px) the "coming soon"
                line beside the Google Play badge wraps instead, balanced so
                no word is left on a line of its own. */}
            <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
              {/* Guide: primary buttons are a green fill, whatever the product.
                  Ka-Ezy: the site's one Try Ka-Ezy button (the demo on this
                  page when it is shown, else the app); the other products
                  open the app. */}
              {product.slug === "ka-ezy" ? (
                <TryKaEzyButton position="product-hero" page="ka-ezy" className="w-full sm:w-auto lg:shrink-0" />
              ) : (
                <ButtonLink
                  href={playStoreUrl(cta.campaign, "product-hero")}
                  track="get_app_click"
                  trackProps={{ product: product.slug, position: "product-hero" }}
                  className="w-full sm:w-auto lg:shrink-0"
                >
                  <Icon name={product.icon} className="size-5" />
                  {cta.label}
                </ButtonLink>
              )}
              <StoreBadges
                campaign={cta.campaign}
                medium="product-hero"
                size="md"
                className="min-w-0 lg:flex-nowrap [&>p]:text-balance"
              />
            </div>
          </div>
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

// The place chip takes the product's soft tint (as on its card on the home
// page) with the map pin in its colour. Full class strings so Tailwind finds
// them.
const CHIP: Record<Accent, { tint: string; glyph: string }> = {
  brand: { tint: "bg-brand-soft", glyph: "text-brand" },
  accent: { tint: "bg-accent-soft", glyph: "text-accent" },
  deep: { tint: "bg-brand-soft-strong", glyph: "text-inverse" },
};

/** "Available in Uganda. Free to list." → ["Available in Uganda", "Free to list"]. */
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

/**
 * The availability line as chips, one per sentence: where the product is
 * available, in the product's tint with a map pin, then any note that goes
 * with it as a quiet white chip in muted text. A note can be a caveat
 * ("Prices don't include transport") as well as a benefit ("Free to list"),
 * so it never takes the place chip's emphasis. Nothing when the product has
 * no availability line, or while it waits for confirmation in production.
 */
function FactChips({ product }: { product: Product }) {
  const { availability, accent } = product;
  if (!availability || !isVisible(availability)) return null;
  const chip = CHIP[accent];

  return (
    <ul className="mb-3 flex flex-wrap items-center gap-2">
      {sentences(availability.text).map((fact, i) =>
        i === 0 ? (
          <li
            key={fact}
            className={`flex min-h-7 items-center gap-1.5 rounded-pill px-3 py-0.5 text-sm font-label text-title ${chip.tint}`}
          >
            <Icon name="map-pin" className={`size-4 shrink-0 ${chip.glyph}`} />
            {fact}
          </li>
        ) : (
          <li
            key={fact}
            className="flex min-h-7 items-center rounded-pill border border-line bg-card px-3 py-0.5 text-sm text-muted"
          >
            {fact}
          </li>
        ),
      )}
      {availability.pending ? (
        <li className="flex items-center">
          <PendingBadge note={availability.note} />
        </li>
      ) : null}
    </ul>
  );
}

/**
 * The app screenshot beside the product artwork (Ka-Ezy), else the artwork
 * on its own, else, for EzyCredits, an HTML illustration of Pay Later. The artwork is drawn on a pure white background, so it never
 * overlaps the phone or sits on a tint: it would show as a white box.
 *
 * Each visual's top and bottom edges are the ones the text column lines up
 * with from lg. Should the text ever run taller, the visual keeps to the
 * bottom (level with the buttons), as the phone and artwork pair does.
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
        className="mx-auto w-52 sm:w-64 lg:w-72 lg:self-end"
        sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 208px"
      />
    );
  }

  if (image) {
    return (
      <div className="mx-auto w-full max-w-xs sm:max-w-sm lg:self-end">
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

  // The illustration ends 24px (its own py-6) below the "Repay with" pill;
  // -mb-6 takes that back, so the pill is the bottom edge the buttons meet
  // and the hero ends the same distance below it as the others.
  return (
    <div className="-mb-6 w-full lg:self-end">
      <PayLaterVisual product={product} />
    </div>
  );
}
