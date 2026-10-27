import Image from "next/image";
import type { Product, Step } from "@/lib/content";
import { Highlight } from "@/components/home/parts";
import { Section, SectionHeader } from "@/components/ui/Container";
import type { BandTone } from "./tones";

// Number chips in the brand colours, white numbers on each (guide: solid
// blue, green or navy circles), each in a halo of its own tint: the stronger
// tint on the tinted band, where the soft one would all but vanish. The
// numbers are large bold text, so accent-bright (the exact Vibrant Green)
// passes. Blue and green alternate (the logo blue and Dark Navy look too
// alike side by side). Full class strings so Tailwind can find them.
const CHIPS: Record<BandTone, string[]> = {
  canvas: ["bg-brand text-on-brand ring-brand-soft", "bg-accent-bright text-on-accent ring-accent-soft"],
  subtle: [
    "bg-brand text-on-brand ring-brand-soft-strong",
    "bg-accent-bright text-on-accent ring-accent-soft-strong",
  ],
};

// The line from one chip to the next fades from its colour into the next
// one's (the line adds the direction: down a column, or across the row).
const LINKS = ["from-brand to-accent-bright", "from-accent-bright to-brand"];

// How the steps run from md up. Below md every list is the vertical stepper:
// one card under another, the chips joined by a line down the left.
// `columnEnd` hides that line under the last step of a column.
const FLOWS = {
  // One column (beside a portrait photo, or a single step).
  stack: { columns: 1, list: "", columnEnd: "" },
  // Two columns from md, filled top to bottom (1 and 2 on the left, 3 and
  // 4 on the right), so the line still runs down each column. Without a
  // photo this is about half the height of one column, and each text runs
  // about twice as wide as in a row of four.
  pairs: {
    columns: 2,
    list: "md:grid md:grid-flow-col md:grid-cols-2 md:gap-x-6",
    columnEnd: "md:hidden",
  },
  // The same from md to lg only, above a landscape photo; from lg the steps
  // stand in one column beside the photo.
  pairsUntilLg: {
    columns: 2,
    list: "md:max-lg:grid md:max-lg:grid-flow-col md:max-lg:grid-cols-2 md:max-lg:gap-x-6",
    columnEnd: "md:max-lg:hidden",
  },
  // Three in a row from lg (three steps, no photo), the chips on a line
  // across the top of their cards.
  row: { columns: 3, list: "lg:grid lg:grid-cols-3 lg:gap-x-6 lg:gap-y-8", columnEnd: "lg:hidden" },
} as const;

type Flow = keyof typeof FLOWS;

// Where the header, the steps and the photo sit. Stacked, they come in that
// order, the photo cropped to a fixed ratio. Side by side, the photo fills
// (object-cover) the height the steps give it, so its top and bottom edges
// line up with the cards beside it.
const LAYOUTS = {
  // Portrait (or square). Below md: the photo square, a crop that keeps the
  // subject of each portrait photo in frame (Ka-Ezy's faces sit in the top
  // third, Produce Market's farmer in the lower half; a wider crop cuts one
  // or the other). md to lg: the header across the top, then the photo
  // beside the steps, half and half, which keeps the photo close to its own
  // shape. From lg: the photo on the left, as tall as the eyebrow, title and
  // steps on the right.
  portrait: {
    grid: "md:grid-cols-2 md:grid-rows-[auto_1fr] md:gap-x-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-x-12",
    header: "md:col-span-2 md:row-start-1 lg:col-span-1 lg:col-start-2",
    list: "-mt-2 md:col-start-2 md:row-start-2",
    flow: "stack",
    photo:
      "aspect-square md:col-start-1 md:row-start-2 md:-mt-2 md:aspect-auto md:min-h-96 lg:row-span-2 lg:row-start-1 lg:mt-0",
    // A little above centre, for the faces in the Ka-Ezy photo.
    position: "object-[50%_35%]",
    // Filling its box, the photo is drawn up to about 470px wide from md.
    sizes: "(min-width: 768px) 480px, calc(100vw - 32px)",
  },
  // Landscape. Stacked, the photo is cropped wider at each step up (3:2,
  // 2:1, then 5:2 under the two columns of steps from md). From lg: the
  // eyebrow, title and photo on the left, the steps down the right. The
  // first card is level with the eyebrow, the last card's bottom with the
  // photo's. The photo's column is the wider, so beside the steps it keeps
  // close to its own shape.
  landscape: {
    grid: "lg:grid-cols-[minmax(0,5fr)_minmax(0,4fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12",
    header: "lg:col-start-1 lg:row-start-1",
    list: "-mt-2 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0",
    flow: "pairsUntilLg",
    photo:
      "aspect-[3/2] sm:aspect-[2/1] md:aspect-[5/2] lg:col-start-1 lg:row-start-2 lg:-mt-2 lg:aspect-auto lg:min-h-64",
    // Centred. From lg the box's shape follows the height of the steps beside
    // it, so a photo may lose its sides or its top and bottom; one whose
    // subject sits off centre sets its own `focus` (Agrishop's keeps the logo
    // on its bag in frame, EzyCredits' the agent's helmet).
    position: "object-center",
    // Filling its box, the photo is drawn up to about 620px wide from lg.
    sizes: "(min-width: 1024px) 620px, calc(100vw - 32px)",
  },
} as const;

/**
 * How to get started, as a numbered stepper: each step a white card beside
 * a big number chip, the chips joined by a line that fades from one chip's
 * colour into the next. Product names in the steps are green (on white).
 *
 * With the product's photo (a real photo from the field), the two share one
 * band and their edges line up (see LAYOUTS). Without one, the steps fill
 * two columns from md (see FLOWS); three steps run in a row from lg, the
 * chips on a line across the top of their cards, and the titles and texts
 * start level across the row (subgrid), however they wrap.
 */
export function Steps({ product, tone }: { product: Product; tone: BandTone }) {
  const { steps, photo } = product;
  const count = steps.items.length;
  const header = (
    <SectionHeader id="how-it-works-title" eyebrow="How it works" title={steps.title} wide={!photo} />
  );

  if (!photo) {
    return (
      <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
        {header}
        <StepList
          items={steps.items}
          tone={tone}
          flow={count === 3 ? "row" : count > 1 ? "pairs" : "stack"}
          className="-mt-2"
        />
      </Section>
    );
  }

  const { image } = photo;
  const layout = LAYOUTS[image.height >= image.width ? "portrait" : "landscape"];
  return (
    <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
      <div className={`grid grid-cols-1 ${layout.grid}`}>
        <div className={layout.header}>{header}</div>
        <StepList
          items={steps.items}
          tone={tone}
          flow={count > 1 ? layout.flow : "stack"}
          stretch
          className={layout.list}
        />
        {/* Lazy-loaded: always well below the fold. */}
        <div className={`relative mt-8 overflow-hidden rounded-media ${layout.photo}`}>
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes={layout.sizes}
            // The photo's own focus point, if it has one, over the layout's.
            className={`object-cover ${image.focus ? "" : layout.position}`}
            style={image.focus ? { objectPosition: image.focus } : undefined}
          />
        </div>
      </div>
    </Section>
  );
}

function StepList({
  items,
  tone,
  flow,
  stretch = false,
  className,
}: {
  items: Step[];
  tone: BandTone;
  flow: Flow;
  /** Share out any spare height of the list between the cards, so the last
   *  card's bottom still meets the photo's when the photo is the taller. */
  stretch?: boolean;
  className: string;
}) {
  const { columns, list, columnEnd } = FLOWS[flow];
  const row = flow === "row";
  // Steps per column (in the lg row, one each).
  const perColumn = Math.ceil(items.length / columns);

  return (
    // role="list": Safari drops the list role from unstyled lists.
    <ol
      role="list"
      className={`flex flex-col gap-3 sm:gap-4 ${list} ${className}`}
      // Filled column by column, two columns need their row count. Only read
      // where the list is that grid (see FLOWS); a flex column ignores it.
      style={columns === 2 ? { gridTemplateRows: `repeat(${perColumn}, auto)` } : undefined}
    >
      {items.map((step, i) => {
        const last = i === items.length - 1;
        return (
          <li
            key={step.title}
            // In the lg row each step spans three rows of the list's grid
            // (chip, title, text) and its card the last two, so across the
            // row the titles share a line and the texts start level.
            className={`relative flex gap-3 sm:gap-4 ${stretch ? "flex-auto" : ""} ${
              row ? "lg:row-span-3 lg:grid lg:grid-cols-1 lg:grid-rows-subgrid" : ""
            }`}
          >
            {last ? null : (
              // Down to the next chip, through the gap between the cards.
              <span
                aria-hidden="true"
                className={`absolute top-12 -bottom-3 left-6 w-0.5 -translate-x-1/2 rounded-pill bg-linear-to-b ${LINKS[i % 2]} sm:top-14 sm:-bottom-4 sm:left-7 ${
                  (i + 1) % perColumn === 0 ? columnEnd : ""
                }`}
              />
            )}
            {row && !last ? (
              // Across to the next chip (lg row only).
              <span
                aria-hidden="true"
                className={`absolute top-7 left-14 -right-6 hidden h-0.5 -translate-y-1/2 rounded-pill bg-linear-to-r ${LINKS[i % 2]} lg:block`}
              />
            ) : null}
            {/* Beside its card: top level with the card's, centre on the
                title's first line. In the lg row it heads the card.
                Screen readers get the number from the heading. */}
            <span
              aria-hidden="true"
              className={`relative z-10 flex size-12 shrink-0 items-center justify-center rounded-full text-xl font-heading tabular-nums ring-4 sm:size-14 sm:text-2xl ${CHIPS[tone][i % 2]}`}
            >
              {i + 1}
            </span>
            <div
              className={`min-w-0 flex-1 rounded-card bg-card px-4 py-3 shadow-card ring-1 ring-line sm:px-5 sm:py-4 ${
                row ? "lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-y-0" : ""
              }`}
            >
              <h3 className="text-lg font-heading text-balance text-title">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-1 text-base text-pretty text-body">
                <Highlight text={step.text} />
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
