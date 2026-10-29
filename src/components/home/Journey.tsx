import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getProduct, getSite, type ImageData, type Product, type StepAction } from "@/lib/content";
import { StepActionLink, actionLink } from "@/components/product/Steps";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * Plan -> Buy -> Pay -> Sell: how the four products connect, each step with
 * a real photo of that moment from the field. Each step's product icon sits
 * in a solid circle in the product's colour (blue, green, navy, green), the
 * guide's icon style.
 *
 * Phones: a vertical timeline, the photo under each step's text. From sm the
 * photo stands beside the text. From lg the steps run in one row of photo
 * cards: the icon overlaps the foot of its photo, and an arrow on the seam
 * between two photos leads to the next step. Each step ends with its next
 * move (`action`: ask Ka-Ezy, or the product's own button in the app).
 */
export function Journey() {
  const { journey } = getSite();
  const steps = journey.steps.flatMap((step) => {
    const product = getProduct(step.product);
    return product ? [{ ...step, product }] : [];
  });

  return (
    <Section id="how-it-works" tone="subtle" labelledBy="how-it-works-title">
      <SectionHeader id="how-it-works-title" title={journey.title} intro={journey.intro} />
      <ol className="grid lg:grid-cols-4 lg:gap-6">
        {steps.map((step, i) => (
          <JourneyStep
            key={step.verb}
            number={i + 1}
            verb={step.verb}
            text={step.text}
            product={step.product}
            image={step.image}
            action={step.action}
            last={i === steps.length - 1}
          />
        ))}
      </ol>
    </Section>
  );
}

function JourneyStep({
  number,
  verb,
  text,
  product,
  image,
  action,
  last,
}: {
  number: number;
  verb: string;
  text: string;
  product: Product;
  image: ImageData;
  action?: StepAction;
  last: boolean;
}) {
  const link = action ? actionLink(action, product, { position: "home-journey", page: null }) : null;
  return (
    // content-start: in the lg row the steps stretch to the tallest one; the
    // spare height goes below the text, so photos, icons and titles line up.
    <li
      className={`relative grid content-start grid-cols-[auto_minmax(0,1fr)] gap-x-4 sm:grid-cols-[auto_minmax(0,1fr)_minmax(0,15rem)] sm:gap-x-6 lg:grid-cols-1 lg:gap-x-0 lg:pb-0 ${
        last ? "" : "pb-8"
      }`}
    >
      {last ? null : (
        // Below lg: a line down from this step's circle to the next one.
        <span
          aria-hidden="true"
          className="absolute top-[4.5rem] bottom-1 left-8 flex -translate-x-1/2 flex-col items-center text-secondary lg:hidden"
        >
          <span className="w-0.5 flex-1 rounded-pill bg-brand-soft-strong" />
          <ChevronDown className="-mt-1.5 size-5" />
        </span>
      )}

      {/* Phones: under the text. sm: beside it. lg: the top of the card. */}
      <div className="relative col-start-2 row-start-2 mt-4 sm:col-start-3 sm:row-start-1 sm:mt-0 lg:col-start-1 lg:row-start-1">
        <div className="relative aspect-video overflow-hidden rounded-media shadow-card sm:aspect-[4/3]">
          {/* Lazy-loaded: below the fold. */}
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 240px, calc(100vw - 112px)"
            className="object-cover"
            style={image.focus ? { objectPosition: image.focus } : undefined}
          />
        </div>
        {last ? null : (
          // lg: on the seam between this photo and the next (the row's gap is 1.5rem).
          <span
            aria-hidden="true"
            className="absolute top-1/2 -right-8 z-10 hidden size-10 -translate-y-1/2 items-center justify-center rounded-full bg-card text-secondary shadow-raised ring-4 ring-subtle lg:flex"
          >
            <ArrowRight className="size-5" />
          </span>
        )}
      </div>

      {/* lg: half over the foot of the photo, cut out of it by a ring of the band's colour. */}
      <IconCircle
        name={product.icon}
        color={product.accent}
        size="lg"
        className="relative z-10 col-start-1 row-start-1 ring-4 ring-subtle lg:row-start-2 lg:-mt-8 lg:ml-5"
      />
      <div className="col-start-2 row-start-1 min-w-0 pt-1 lg:col-start-1 lg:row-start-3 lg:pt-3">
        <p aria-hidden="true" className="text-sm text-label-style text-muted">
          Step {number}
        </p>
        <h3 className="text-2xl font-heading tracking-heading text-title">{verb}</h3>
        {/* The product name is the step's green highlight (the accessible
            shade at this size), so the sentence below stays plain. */}
        <p className="mt-0.5">
          <Link prefetch={false}
            href={`/${product.slug}/`}
            className="inline-flex min-h-12 items-center rounded-control font-heading text-accent underline underline-offset-4 hover:text-accent-hover"
          >
            {product.name}
          </Link>
        </p>
        <p className="text-base text-pretty text-body">{text}</p>
        {link ? (
          <StepActionLink
            link={link}
            className="group/action mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-control font-label text-link underline decoration-secondary/40 underline-offset-4 hover:decoration-secondary"
          >
            {link.label}
            <ArrowRight
              aria-hidden="true"
              className="size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover/action:translate-x-0.5"
            />
          </StepActionLink>
        ) : null}
      </div>
    </li>
  );
}
