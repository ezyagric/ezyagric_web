import Image from "next/image";
import type { Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import type { BandTone } from "./tones";

// Full class names so Tailwind can find them. More than four steps stay a
// vertical list: narrower columns would wrap into tall, hard-to-scan blocks.
const ROW_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

// Number circles in the brand colours, white numbers on each (guide: solid
// blue, green or navy circles). The numbers are large bold text, so
// accent-bright (the exact Vibrant Green) passes.
// Blue and green alternate (the logo blue and Dark Navy look too alike side by side).
const CIRCLES = ["bg-brand text-on-brand", "bg-accent-bright text-on-accent"];

/**
 * How to get started, as a numbered timeline. With the product's photo (a
 * real photo from the field), the two share one band: the photo on the
 * left, the steps listed down the right. Without one, the steps run in a
 * row with connecting lines from lg up (vertical on phones).
 */
export function Steps({ product, tone }: { product: Product; tone: BandTone }) {
  const { steps, photo } = product;
  // Beside a photo the column is narrow, so the steps always stack.
  const columns = photo ? undefined : ROW_COLUMNS[steps.items.length];

  const list = (
    <ol className={`grid ${columns ? `${columns} lg:gap-6` : ""}`}>
      {steps.items.map((step, i) => {
        const last = i === steps.items.length - 1;
        return (
          <li
            key={step.title}
            className={`relative flex gap-4 ${last ? "" : "pb-8"} ${columns ? "lg:flex-col lg:pb-0" : ""}`}
          >
            {last ? null : (
              <>
                {/* Down to the next number. */}
                <span
                  aria-hidden="true"
                  className={`absolute top-14 bottom-2 left-6 w-0.5 -translate-x-1/2 rounded-pill bg-brand-soft-strong ${columns ? "lg:hidden" : ""}`}
                />
                {/* Across to the next column (lg row layout only). */}
                {columns ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-6 left-16 -right-2 hidden h-0.5 -translate-y-1/2 rounded-pill bg-brand-soft-strong lg:block"
                  />
                ) : null}
              </>
            )}
            {/* The <ol> already numbers the steps for screen readers. */}
            <span
              aria-hidden="true"
              className={`flex size-12 shrink-0 items-center justify-center rounded-full text-xl font-heading ${CIRCLES[i % CIRCLES.length]}`}
            >
              {i + 1}
            </span>
            <div className={`min-w-0 pt-2 ${columns ? "lg:pt-0" : ""}`}>
              <h3 className="text-xl font-heading text-title">{step.title}</h3>
              <p className="mt-1 text-base text-pretty text-body">{step.text}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );

  if (!photo) {
    return (
      <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
        <SectionHeader id="how-it-works-title" eyebrow="How it works" title={steps.title} />
        {list}
      </Section>
    );
  }

  const { image } = photo;
  const portrait = image.height > image.width;
  return (
    <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
      <div className="grid items-center gap-8 md:grid-cols-2 md:gap-12">
        {/* Lazy-loaded: always well below the fold. Portrait photos stay narrow. */}
        <div className={portrait ? "mx-auto w-full max-w-sm md:mr-0" : "w-full"}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={
              portrait
                ? "(min-width: 640px) 384px, calc(100vw - 32px)"
                : "(min-width: 1152px) 528px, (min-width: 768px) calc(50vw - 72px), calc(100vw - 32px)"
            }
            className="h-auto w-full rounded-media"
          />
        </div>
        <div>
          <SectionHeader id="how-it-works-title" eyebrow="How it works" title={steps.title} />
          {list}
        </div>
      </div>
    </Section>
  );
}
