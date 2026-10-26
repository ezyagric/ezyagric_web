import type { Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { TONES, type BandTone } from "./tones";

// Full class names so Tailwind can find them. More than four steps stay a
// vertical list: narrower columns would wrap into tall, hard-to-scan blocks.
const ROW_COLUMNS: Record<number, string> = {
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
};

/**
 * How to get started, as a numbered timeline: vertical on phones, one row
 * with connecting lines from lg up.
 */
export function Steps({ product, tone }: { product: Product; tone: BandTone }) {
  const colours = TONES[product.accent];
  const { steps } = product;
  const columns = ROW_COLUMNS[steps.items.length];

  return (
    <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
      <SectionHeader id="how-it-works-title" eyebrow="How it works" title={steps.title} />
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
                    className={`absolute top-14 bottom-2 left-6 w-0.5 -translate-x-1/2 rounded-full ${colours.line} ${columns ? "lg:hidden" : ""}`}
                  />
                  {/* Across to the next column (lg row layout only). */}
                  {columns ? (
                    <span
                      aria-hidden="true"
                      className={`absolute top-6 left-16 -right-2 hidden h-0.5 -translate-y-1/2 rounded-full lg:block ${colours.line}`}
                    />
                  ) : null}
                </>
              )}
              {/* The <ol> already numbers the steps for screen readers. */}
              <span
                aria-hidden="true"
                className={`flex size-12 shrink-0 items-center justify-center rounded-full text-xl font-extrabold shadow-sm ${colours.solid}`}
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-2 lg:pt-0">
                <h3 className="text-xl font-extrabold text-ink">{step.title}</h3>
                <p className="mt-1 text-base text-pretty text-muted">{step.text}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
