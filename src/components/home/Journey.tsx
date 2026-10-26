import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getProduct, getSite, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ProductMark } from "@/components/ui/ProductMark";

/**
 * Plan -> Buy -> Pay -> Sell: how the four products connect. A vertical
 * timeline on phones, a single row with arrows from lg up.
 */
export function Journey() {
  const { journey } = getSite();
  const steps = journey.steps.flatMap((step) => {
    const product = getProduct(step.product);
    return product ? [{ ...step, product }] : [];
  });

  return (
    <Section id="how-it-works" tone="surface" labelledBy="how-it-works-title">
      <SectionHeader id="how-it-works-title" title={journey.title} intro={journey.intro} />
      <ol className="grid lg:grid-cols-4 lg:gap-6">
        {steps.map((step, i) => (
          <JourneyStep
            key={step.verb}
            number={i + 1}
            verb={step.verb}
            text={step.text}
            product={step.product}
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
  last,
}: {
  number: number;
  verb: string;
  text: string;
  product: Product;
  last: boolean;
}) {
  const accent = ACCENTS[product.accent];
  return (
    <li className={`relative flex gap-4 lg:flex-col lg:pb-0 ${last ? "" : "pb-8"}`}>
      {last ? null : (
        <>
          {/* Phones: a line down from this step's mark to the next one. */}
          <span
            aria-hidden="true"
            className="absolute top-16 bottom-1 left-7 flex -translate-x-1/2 flex-col items-center text-brand-500 lg:hidden"
          >
            <span className="w-0.5 flex-1 rounded-full bg-brand-100" />
            <ChevronDown className="-mt-1.5 size-5" />
          </span>
          {/* lg: a line across to the next column, ending in an arrow. */}
          <span
            aria-hidden="true"
            className="absolute top-7 left-18 -right-4 hidden -translate-y-1/2 items-center text-brand-500 lg:flex"
          >
            <span className="h-0.5 flex-1 rounded-full bg-brand-100" />
            <ArrowRight className="-ml-1.5 size-5" />
          </span>
        </>
      )}
      <ProductMark product={product} size="sm" />
      <div className="min-w-0 pt-1 lg:pt-0">
        <p aria-hidden="true" className="text-xs font-bold tracking-wider text-muted uppercase">
          Step {number}
        </p>
        <h3 className="text-2xl font-extrabold tracking-tight text-ink">{verb}</h3>
        <p className="mt-0.5">
          <Link prefetch={false}
            href={`/${product.slug}/`}
            className={`inline-flex min-h-12 items-center rounded font-bold underline underline-offset-4 ${accent.text}`}
          >
            {product.name}
          </Link>
        </p>
        <p className="text-base text-pretty text-muted">{text}</p>
      </div>
    </li>
  );
}
