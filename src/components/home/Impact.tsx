import Image from "next/image";
import { getSite, isVisible, visible, type ImageData } from "@/lib/content";
import { IMPACT_API } from "@/lib/env";
import { Container } from "@/components/ui/Container";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { LiveCount } from "./LiveCount";

/**
 * A Dark Navy (inverse) band of headline numbers with Vibrant Green
 * (accent-bright) highlights ("navy with green highlight" is one of the
 * guide's approved combinations; accent-bright on inverse is 4.7:1). The
 * numbers are plain text (no animated counters) so they show without
 * JavaScript and never jump. A number with `live` (the first) is kept
 * current from EzyCRM where the build sets NEXT_PUBLIC_IMPACT_API
 * (LiveCount): its typed value shows first, then the live total.
 *
 * One block beside real farmer photos: the title at the top, the headline
 * numbers, then what farmers and agribusinesses report (its label for
 * screen readers only), each percentage drawn as a ring. From sm the photos
 * stretch to the block's height, so their top and bottom edges line up with
 * the title and the last ring. On phones they sit under the figures (4:3).
 * They are lazy-loaded, so only people who scroll this far download them.
 *
 * With a `gallery`, the photos form a mosaic: the first one tall, the others
 * stacked beside it. From sm to md, where the column is narrowest, the first
 * goes across the top and the others share the row under it.
 */
export function Impact() {
  const { impact } = getSite();
  const items = visible(impact.items);
  // Production drops unconfirmed figures; an empty band would just be a heading.
  if (items.length === 0) return null;
  const { image, gallery, evidence } = impact;

  return (
    <section
      id="impact"
      aria-labelledby="impact-title"
      className="bg-inverse py-14 text-on-inverse sm:py-20"
    >
      <Container
        className={`grid gap-10 ${image ? "sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-8 lg:gap-14" : ""}`}
      >
        <div className="sm:order-last">
          <h2 id="impact-title" className="text-3xl font-heading tracking-heading text-on-inverse sm:text-4xl">
            {impact.title}
          </h2>
          {impact.asOf && isVisible(impact.asOf) ? (
            <p className="mt-2 text-base text-on-inverse">
              <ClaimText claim={impact.asOf} />
            </p>
          ) : null}

          <dl
            className={`mt-6 grid grid-cols-2 gap-x-4 gap-y-8 ${
              items.length < 3 ? "sm:gap-x-8" : image ? "lg:grid-cols-3 lg:gap-x-8" : "sm:grid-cols-3 sm:gap-x-8"
            }`}
          >
            {items.map((item) => (
              <div key={item.label} className="flex min-w-0 flex-col-reverse justify-end border-l-2 border-accent-bright pl-3 lg:pl-4">
                {/* dt comes first in the DOM so screen readers say the label, then the number. */}
                <dt className="mt-1 text-base text-on-inverse">
                  <KeepHyphensTogether text={item.label} />
                  {item.pending ? <PendingBadge note={item.note} /> : null}
                </dt>
                <dd className={`text-3xl font-heading tracking-heading text-accent-bright tabular-nums ${image ? "xl:text-5xl" : "sm:text-4xl"}`}>
                  {item.live && IMPACT_API ? (
                    <LiveCount endpoint={IMPACT_API} base={item.live.base} fallback={item.value} suffix={item.suffix} />
                  ) : (
                    <>
                      {item.value.toLocaleString("en-US")}
                      {item.suffix}
                    </>
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {evidence ? (
            <div className="mt-8 border-t border-on-inverse/15 pt-6">
              {/* Screen readers only: the rings speak for themselves on screen
                  (the team asked to drop the visible label, 27 Oct 2026). */}
              <h3 className="sr-only">{evidence.title}</h3>
              {/* Ring beside its label until lg, then three columns with the label under it. */}
              <ul className="grid gap-4 lg:grid-cols-3 lg:gap-6">
                {evidence.items.map((e) => (
                  <li key={e.label} className="flex items-center gap-4 lg:flex-col lg:items-start lg:gap-3">
                    <Ring value={e.value} />
                    <p className="text-base text-pretty text-on-inverse">{e.label}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        {image ? (
          // aspect-auto from sm: the grid row's height (the text block's) sets it.
          <div
            className={`aspect-[4/3] sm:aspect-auto sm:min-h-80 ${
              gallery.length > 0
                ? "grid grid-cols-[3fr_2fr] grid-rows-2 gap-2 sm:grid-cols-2 sm:grid-rows-[3fr_2fr] sm:gap-3 md:grid-cols-[3fr_2fr] md:grid-rows-2"
                : "grid"
            }`}
          >
            <Photo
              image={image}
              sizes="(min-width: 1152px) 260px, (min-width: 640px) 38vw, 60vw"
              className={
                gallery.length > 0 ? "row-span-2 sm:col-span-2 sm:row-span-1 md:col-span-1 md:row-span-2" : ""
              }
            />
            {gallery.map((photo) => (
              <Photo
                key={photo.src}
                image={photo}
                sizes="(min-width: 1152px) 170px, (min-width: 640px) 19vw, 40vw"
                // One extra photo fills the rest of the mosaic: the column
                // beside the first, or from sm to md the row under it.
                className={gallery.length === 1 ? "row-span-2 sm:col-span-2 sm:row-span-1 md:col-span-1 md:row-span-2" : ""}
              />
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}

/** One photo of the mosaic, filling its cell, cropped round its focus point. */
function Photo({ image, sizes, className }: { image: ImageData; sizes: string; className: string }) {
  return (
    <div className={`relative min-h-0 overflow-hidden rounded-media ${className}`}>
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover"
        style={image.focus ? { objectPosition: image.focus } : undefined}
      />
    </div>
  );
}

// The ring's radius in its 80x80 box, and its length.
const RADIUS = 34;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A study figure in a ring: a percentage ("86%") fills that share of the
 * ring in green. Any other value shows on its own. The ring is decorative;
 * the number inside is the text.
 */
function Ring({ value }: { value: string }) {
  const percent = /^\d+(\.\d+)?%$/.test(value) ? parseFloat(value) : null;
  return (
    <span className="relative flex size-20 shrink-0 items-center justify-center">
      {percent !== null ? (
        <svg aria-hidden="true" viewBox="0 0 80 80" className="absolute inset-0 size-full -rotate-90">
          <circle cx="40" cy="40" r={RADIUS} fill="none" strokeWidth="6" className="stroke-on-inverse/15" />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={`${(Math.min(percent, 100) / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            className="stroke-accent-bright"
          />
        </svg>
      ) : null}
      <span className="text-xl font-heading tracking-heading text-on-inverse tabular-nums">{value}</span>
    </span>
  );
}
