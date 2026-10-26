import Link from "next/link";
import { ArrowRight, ChevronDown } from "lucide-react";
import { getProduct, getSite, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * Plan -> Buy -> Pay -> Sell: how the four products connect. A vertical
 * timeline on phones, a single row with arrows from lg up. Each step's
 * product icon sits in a solid circle in the product's colour (blue, green,
 * navy, green), the guide's icon style.
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
  return (
    <li className={`relative flex gap-4 lg:flex-col lg:pb-0 ${last ? "" : "pb-8"}`}>
      {last ? null : (
        <>
          {/* Phones: a line down from this step's circle to the next one. */}
          <span
            aria-hidden="true"
            className="absolute top-[4.5rem] bottom-1 left-8 flex -translate-x-1/2 flex-col items-center text-secondary lg:hidden"
          >
            <span className="w-0.5 flex-1 rounded-pill bg-brand-soft-strong" />
            <ChevronDown className="-mt-1.5 size-5" />
          </span>
          {/* lg: a line across to the next column, ending in an arrow. */}
          <span
            aria-hidden="true"
            className="absolute top-8 left-20 -right-4 hidden -translate-y-1/2 items-center text-secondary lg:flex"
          >
            <span className="h-0.5 flex-1 rounded-pill bg-brand-soft-strong" />
            <ArrowRight className="-ml-1.5 size-5" />
          </span>
        </>
      )}
      <IconCircle name={product.icon} color={product.accent} size="lg" />
      <div className="min-w-0 pt-1 lg:pt-0">
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
      </div>
    </li>
  );
}
