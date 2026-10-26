import Image from "next/image";
import { getSite, isVisible, visible } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

/**
 * A Dark Navy (inverse) band of headline numbers with Vibrant Green
 * (accent-bright) highlights ("navy with green highlight" is one of the
 * guide's approved combinations; accent-bright on inverse is 4.7:1). The numbers are plain text (no animated counters) so
 * they show without JavaScript and never jump.
 *
 * The real farmer photo sits beside the figures from sm and under them on
 * phones, cropped square; it is lazy-loaded, so only people who scroll this
 * far download it.
 */
export function Impact() {
  const { impact } = getSite();
  const items = visible(impact.items);
  // Production drops unconfirmed figures; an empty band would just be a heading.
  if (items.length === 0) return null;
  const image = impact.image;

  return (
    <section
      id="impact"
      aria-labelledby="impact-title"
      className="bg-inverse py-14 text-on-inverse sm:py-20"
    >
      <Container
        className={`grid gap-10 ${image ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:items-center sm:gap-8 lg:gap-14" : ""}`}
      >
        <div className="sm:order-last">
          <h2 id="impact-title" className="text-3xl font-heading tracking-heading text-on-inverse sm:text-4xl">
            {impact.title}
          </h2>
          {isVisible(impact.asOf) ? (
            <p className="mt-2 text-base text-on-inverse">
              <ClaimText claim={impact.asOf} />
            </p>
          ) : null}

          <dl
            className={`mt-8 grid grid-cols-2 gap-x-4 gap-y-8 ${image ? "lg:grid-cols-3 lg:gap-x-8" : "sm:grid-cols-3 sm:gap-x-8"}`}
          >
            {items.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col-reverse justify-end border-l-2 border-on-inverse/20 pl-3 lg:pl-4">
                {/* dt comes first in the DOM so screen readers say the label, then the number. */}
                <dt className="mt-1 text-base text-on-inverse">
                  {item.label}
                  {item.pending ? <PendingBadge note={item.note} /> : null}
                </dt>
                <dd className={`text-3xl font-heading tracking-heading text-accent-bright tabular-nums ${image ? "xl:text-4xl" : "sm:text-4xl"}`}>
                  {item.value.toLocaleString("en-US")}
                  {item.suffix}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {image ? (
          <div className="overflow-hidden rounded-media">
            <Image
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              sizes="(min-width: 1152px) 420px, (min-width: 640px) 38vw, calc(100vw - 32px)"
              className="aspect-square w-full object-cover object-[50%_25%] sm:aspect-[4/5]"
            />
          </div>
        ) : null}
      </Container>

      {impact.evidence ? (
        <Container className="mt-12">
          <div className="border-t border-on-inverse/15 pt-10">
            <h3 className="text-lg font-heading text-on-inverse">{impact.evidence.title}</h3>
            <ul className="mt-6 grid gap-4 sm:grid-cols-3">
              {impact.evidence.items.map((e) => (
                <li key={e.label} className="rounded-card bg-on-inverse/5 p-5 ring-1 ring-on-inverse/10">
                  <p className="text-4xl font-heading text-on-inverse tabular-nums">{e.value}</p>
                  <p className="mt-1 text-base text-on-inverse">{e.label}</p>
                  <p className="mt-3 text-sm font-caption text-on-inverse/90">Source: {e.source}</p>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      ) : null}
    </section>
  );
}
