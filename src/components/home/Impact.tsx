import { getSite, isVisible, visible } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

// Decorative bars cycle through the product accents (decoration only, so *-500 is fine).
const BARS = ["border-leaf-500", "border-amber-500", "border-teal-500", "border-brand-500"];

/**
 * A compact dark band of headline numbers. The numbers are plain text (no
 * animated counters) so they show without JavaScript and never jump.
 */
export function Impact() {
  const { impact } = getSite();
  const items = visible(impact.items);
  // Production drops unconfirmed figures; an empty band would just be a heading.
  if (items.length === 0) return null;

  return (
    <section
      id="impact"
      aria-labelledby="impact-title"
      className="bg-brand-900 py-12 text-white sm:py-16"
    >
      <Container className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-md">
          <h2 id="impact-title" className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            {impact.title}
          </h2>
          {isVisible(impact.asOf) ? (
            <p className="mt-2 text-base text-brand-100">
              <ClaimText claim={impact.asOf} />
            </p>
          ) : null}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-10 lg:max-w-3xl">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`flex flex-col-reverse border-l-4 pl-3 sm:pl-5 ${BARS[i % BARS.length]}`}
            >
              {/* dt comes first in the DOM so screen readers say the label, then the number. */}
              <dt className="mt-1 text-base font-semibold text-brand-100">
                {item.label}
                {item.pending ? <PendingBadge note={item.note} /> : null}
              </dt>
              <dd className="text-3xl font-extrabold tracking-tight tabular-nums sm:text-4xl">
                {item.value.toLocaleString("en-US")}
                {item.suffix}
              </dd>
            </div>
          ))}
        </dl>
      </Container>

      {impact.evidence ? (
        <Container className="mt-12 border-t border-white/15 pt-10">
          <h3 className="text-lg font-bold text-white">{impact.evidence.title}</h3>
          <ul className="mt-6 grid gap-4 sm:grid-cols-3">
            {impact.evidence.items.map((e) => (
              <li key={e.label} className="rounded-2xl bg-white/10 p-5">
                <p className="text-4xl font-extrabold tabular-nums">{e.value}</p>
                <p className="mt-1 text-base text-white">{e.label}</p>
                <p className="mt-3 text-sm text-brand-100">Source: {e.source}</p>
              </li>
            ))}
          </ul>
        </Container>
      ) : null}
    </section>
  );
}
