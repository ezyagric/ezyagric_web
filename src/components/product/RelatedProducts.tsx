import Link from "next/link";
import { ArrowRight, ChevronRight, MapPin } from "lucide-react";
import { getProduct, getSite, type Accent, type Product } from "@/lib/content";
import { Highlight } from "@/components/home/parts";
import { ACCENTS } from "@/components/ui/accents";
import { Section } from "@/components/ui/Container";
import { AppTile } from "@/components/ui/AppTile";
import { Icon } from "@/components/ui/Icon";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import type { BandTone } from "./tones";

type Stop = { verb: string; text: string; product: Product };

// This page's stop: a halo in a tint of its accent round the marker, like the
// dot on a map (decoration only, no text on it). Full class strings so
// Tailwind finds them.
const HALO: Record<Accent, string> = {
  brand: "outline-brand-soft-strong",
  accent: "outline-accent-soft-strong",
  deep: "outline-inverse/20",
};

// The other stops: a thin ring in their own colour round the marker on hover
// and on keyboard focus.
const RING: Record<Accent, string> = {
  brand: "group-hover:outline-brand group-focus-visible:outline-brand",
  accent: "group-hover:outline-accent-bright group-focus-visible:outline-accent-bright",
  deep: "group-hover:outline-inverse group-focus-visible:outline-inverse",
};

/*
 * Rail geometry. Keep it in step with STOP and CELL.mark below.
 * Phones: each stop is a row; its size-14 marker box sits after the row's
 * pt-3 and pl-2, so the rail runs 36px in (left-9) and meets the marker's
 * centre 40px down (top-10).
 * From sm: each stop is a column; after pt-3, the 2rem chip row, mt-4 and
 * half the size-16 box, the marker's centre is 12+32+16+32 = 92px down
 * (top-23).
 * Each stop draws the half of the rail on each side of its marker, so the
 * rail stays whole whatever the stops' heights.
 */
const RAIL =
  "pointer-events-none absolute w-1 -translate-x-1/2 sm:top-23 sm:h-1 sm:w-auto sm:translate-x-0 sm:-translate-y-1/2";
const RAIL_IN = `${RAIL} top-0 left-9 h-10 sm:right-1/2 sm:left-0`;
const RAIL_OUT = `${RAIL} top-10 bottom-0 left-9 sm:right-0 sm:bottom-auto sm:left-1/2`;
// On the boundary where the rail leaves this page's stop for the next one.
const CHEVRON =
  "pointer-events-none absolute top-0 left-9 flex size-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-card text-accent-bright ring-2 ring-accent-bright sm:top-23 sm:left-0";

// A stop: a row on phones (marker left, text right), a centred column from
// sm with a fixed 2rem chip row, so every marker sits on the same line.
const STOP =
  "grid h-full grid-cols-[3.5rem_minmax(0,1fr)] content-start gap-x-3 rounded-card px-2 py-3 sm:grid-cols-1 sm:grid-rows-[2rem_auto_auto_auto_auto] sm:justify-items-center sm:pb-4 sm:text-center";
const CELL = {
  chip: "col-start-2 row-start-1 mb-1 justify-self-start sm:col-start-1 sm:mb-0 sm:self-end sm:justify-self-center",
  mark: "col-start-1 row-start-1 row-end-5 flex size-14 items-center justify-center self-start sm:row-start-2 sm:row-end-3 sm:mt-4 sm:size-16",
  verb: "col-start-2 row-start-2 text-lg font-heading text-title sm:col-start-1 sm:row-start-3 sm:mt-3 sm:text-xl",
  name: "col-start-2 row-start-3 font-heading text-balance text-accent sm:col-start-1 sm:row-start-4",
  line: "col-start-2 row-start-4 mt-0.5 text-sm text-pretty text-muted sm:col-start-1 sm:row-start-5",
};

const CHIP = "inline-flex items-center gap-1 whitespace-nowrap rounded-pill px-2.5 py-0.5 text-sm font-label";
// A map label: navy, with a small pointer down into the halo from sm (behind
// the label's text: isolate and -z-10).
const HERE_CHIP = `${CHIP} relative isolate bg-inverse text-on-inverse sm:after:absolute sm:after:-bottom-1 sm:after:left-1/2 sm:after:-z-10 sm:after:size-2.5 sm:after:-translate-x-1/2 sm:after:rotate-45 sm:after:bg-inverse`;
const NEXT_CHIP = `${CHIP} border border-accent bg-card text-accent`;

const MARKER = "relative z-10 flex items-center justify-center rounded-full ring-4 ring-card";

/**
 * The page's last band: the EzyAgric path (Plan, Buy, Pay, Sell, from
 * site.yaml journey.steps) as a small route map, under "Where {product}
 * fits in". This product's stop is marked "You are here" (a halo round its
 * marker, a navy map label; not a link). The other three stops are links.
 * The rail from here to the next stop is green, and a dashed ticket stub
 * shows the next step: its app tile, verb, journey sentence and a link.
 * After Sell (Produce Market) the next step is Plan again: the ticket says
 * so, with no green rail or chip, since the rail doesn't loop.
 *
 * Phones: a vertical route, the rail down the markers, the ticket below.
 * From sm the stops are four columns on a horizontal rail. From lg the
 * ticket stands beside the route. A faint dot grid behind the stops is the
 * "map".
 */
export function RelatedProducts({ product, tone }: { product: Product; tone: BandTone }) {
  const site = getSite();
  const stops: Stop[] = site.journey.steps.flatMap((step) => {
    const p = getProduct(step.product);
    return p ? [{ verb: step.verb, text: step.text, product: p }] : [];
  });
  const here = stops.findIndex((s) => s.product.slug === product.slug);
  const nextIndex = here === -1 ? -1 : (here + 1) % stops.length;
  const next = nextIndex === -1 ? null : stops[nextIndex];
  // The green stretch of rail and the "Next" label on the route: not when
  // the next stop is back at the start.
  const ahead = here !== -1 && nextIndex > here;
  const last = stops.length - 1;

  return (
    <Section id="more-products" tone={tone} labelledBy="more-products-title">
      <div className="mb-8 lg:flex lg:items-end lg:justify-between lg:gap-12">
        <div className="max-w-2xl">
          {here === -1 ? null : (
            // Naming rule: "the EzyAgric App", capital A.
            <p className="mb-2 text-sm text-label-style text-label">More in the {site.name} App</p>
          )}
          <h2
            id="more-products-title"
            className="text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl"
          >
            {here === -1 ? (
              `More in the ${site.name} App`
            ) : (
              <>
                {/* Large text, so the bright green passes. */}
                Where <Highlight text={product.name} className="font-heading text-accent-bright" /> fits in
              </>
            )}
          </h2>
        </div>
        <p className="mt-3 max-w-xl text-lg text-pretty text-muted lg:mt-0 lg:max-w-xs lg:pb-1">
          {site.journey.intro}
        </p>
      </div>

      {/* overflow-clip (not hidden): clips the decoration without becoming a
          box that focus could scroll. */}
      <div
        className={`isolate overflow-clip rounded-card border border-line bg-card shadow-card ${
          next ? "lg:grid lg:grid-cols-[minmax(0,1fr)_17rem] xl:grid-cols-[minmax(0,1fr)_20rem]" : ""
        }`}
      >
        {/* role="list": Safari drops the list role from unstyled lists. */}
        <ol
          role="list"
          className="grid bg-[radial-gradient(var(--color-brand-soft-strong)_1px,transparent_1.5px)] bg-[size:1.25rem_1.25rem] p-4 sm:grid-cols-4 sm:p-6"
        >
          {stops.map((stop, i) => {
            const isHere = i === here;
            const isNext = ahead && i === nextIndex;
            const body = <StopBody stop={stop} here={isHere} next={isNext} />;
            return (
              <li key={stop.verb} className="relative">
                {i > 0 ? (
                  <span aria-hidden="true" className={`${RAIL_IN} ${isNext ? "bg-accent-bright" : "bg-brand-soft-strong"}`} />
                ) : null}
                {i < last ? (
                  <span
                    aria-hidden="true"
                    className={`${RAIL_OUT} ${ahead && isHere ? "bg-accent-bright" : "bg-brand-soft-strong"}`}
                  />
                ) : null}
                {isNext ? (
                  <span aria-hidden="true" className={CHEVRON}>
                    <ChevronRight className="size-4 rotate-90 sm:rotate-0" />
                  </span>
                ) : null}
                {isHere ? (
                  <div aria-current="step" className={STOP}>
                    {body}
                  </div>
                ) : (
                  // The rail paints over the hover tint (the link isn't
                  // positioned); focused, the link rises above the rail so
                  // its ring stays whole.
                  <Link
                    prefetch={false}
                    href={`/${stop.product.slug}/`}
                    className={`group ${STOP} transition-colors hover:bg-subtle focus-visible:relative focus-visible:z-20`}
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>

        {next ? <NextTicket stop={next} again={!ahead} /> : null}
      </div>
    </Section>
  );
}

function StopBody({ stop, here, next }: { stop: Stop; here: boolean; next: boolean }) {
  const { product } = stop;
  const accent = product.accent;
  return (
    <>
      {here ? (
        <span className={`${CELL.chip} ${HERE_CHIP}`}>
          {/* Hidden sm–md, where the columns are about 120px wide. */}
          <MapPin aria-hidden="true" className="size-3.5 shrink-0 text-accent-bright sm:max-md:hidden" />
          You are here<span className="sr-only">: </span>
        </span>
      ) : next ? (
        <span className={`${CELL.chip} ${NEXT_CHIP}`}>
          Next<span className="sr-only">: </span>
        </span>
      ) : null}

      {/* The guide's icon style: a white glyph in a solid circle of the
          product's colour, cut out of the rail by a white ring. */}
      <span aria-hidden="true" className={CELL.mark}>
        <span
          className={
            here
              ? `${MARKER} size-14 outline-4 outline-offset-2 sm:size-16 sm:outline-8 sm:outline-offset-4 ${ACCENTS[accent].icon} ${HALO[accent]}`
              : `${MARKER} size-11 transition-transform group-hover:outline-2 group-hover:outline-offset-2 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 sm:size-12 motion-safe:group-hover:scale-110 motion-safe:group-focus-visible:scale-110 ${ACCENTS[accent].icon} ${RING[accent]}`
          }
        >
          <Icon name={product.icon} className={here ? "size-7 sm:size-8" : "size-5 sm:size-6"} />
        </span>
      </span>

      {/* The sr-only commas keep the parts apart when read out ("Pay, EzyCredits, Buy now, pay later"). */}
      <span className={CELL.verb}>
        {stop.verb}
        <span className="sr-only">, </span>
      </span>
      {/* Product names in the accessible green (5.1:1 on white, 4.8:1 on the hover tint). */}
      <span
        className={`${CELL.name} ${here ? "" : "underline-offset-4 group-hover:underline group-focus-visible:underline"}`}
      >
        <KeepHyphensTogether text={product.name} />
        <span className="sr-only">, </span>
      </span>
      <span className={CELL.line}>{product.appTagline}</span>
    </>
  );
}

/**
 * The next stop as a ticket stub: a dashed tear line, the next product's app
 * tile beside "Next: {verb}" ("Back to: Plan" after Sell), the step's
 * sentence from the journey (product names green via Highlight) and a link.
 * Under the route below lg (text and link side by side from md), beside it
 * from lg. It lifts a little on hover, like the site's other cards.
 */
function NextTicket({ stop, again }: { stop: Stop; again: boolean }) {
  const { product } = stop;
  return (
    <div className="border-t-2 border-dashed border-brand-soft-strong bg-subtle p-4 sm:p-6 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:gap-x-8 lg:flex lg:flex-col lg:items-start lg:justify-center lg:border-t-0 lg:border-l-2">
      <div>
        <h3 className="flex items-center gap-3">
          <AppTile product={product} sizes="48px" className="size-12 shadow-card" />
          <span className="flex flex-col items-start gap-1">
            <span className={NEXT_CHIP}>
              {again ? "Back to" : "Next"}
              <span className="sr-only">:</span>
            </span>
            <span className="text-2xl leading-none font-heading tracking-heading text-title">{stop.verb}</span>
          </span>
        </h3>
        <p className="mt-3 text-base text-pretty text-body">
          <Highlight text={stop.text} />
        </p>
      </div>
      <Link
        prefetch={false}
        href={`/${product.slug}/`}
        className="group mt-4 inline-flex min-h-11 items-center gap-3 rounded-control font-heading text-link md:mt-0 lg:mt-4"
      >
        <span className="min-w-0 underline underline-offset-4 group-hover:decoration-2">
          Learn more about <KeepHyphensTogether text={product.name} />
        </span>
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-transform motion-safe:group-hover:translate-x-1 ${ACCENTS[product.accent].icon}`}
        >
          <ArrowRight className="size-4.5" />
        </span>
      </Link>
    </div>
  );
}
