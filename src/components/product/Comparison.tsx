import type { CSSProperties } from "react";
import { isVisible, type Accent, type IconName, type Product } from "@/lib/content";
import { Highlight } from "@/components/home/parts";
import { ACCENTS } from "@/components/ui/accents";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import type { BandTone } from "./tones";

type ComparisonData = NonNullable<Product["comparison"]>;
type Row = ComparisonData["rows"][number];

type OptionLook = { icon: IconName; color: Accent; tint: string; mark: string; ink: string };

// Each option's header panel, in column order: its icon on a solid circle, a
// soft tint of that colour, the icon again as a large faint watermark (as on
// the home page's product cards), and the tagline in that colour too (`ink`;
// green small text in its accessible shade). The colours match the hero's
// PayWaysVisual: a wallet in green to pay now, a calendar in blue to pay
// later. Full class strings so Tailwind can find them.
const OPTIONS: OptionLook[] = [
  { icon: "wallet", color: "accent", tint: "bg-accent-soft", mark: "text-accent-bright/15", ink: "text-accent" },
  { icon: "calendar-clock", color: "brand", tint: "bg-brand-soft", mark: "text-brand/10", ink: "text-label" },
];

/**
 * Rows whose every value may be shown. A row with a hidden (pending) or
 * missing value is dropped in production rather than left with an empty
 * cell, which would read as "no" or "nothing".
 */
export function comparisonRows(comparison: ComparisonData) {
  return comparison.rows.filter((row) =>
    comparison.columns.every((_, ci) => isVisible(row.values[ci])),
  );
}

/**
 * The options side by side, one card each: a tinted header panel (icon, name
 * and tagline), then the same rows in the same order. The content names no
 * recommended option, so the cards are equals.
 *
 * From sm the cards share their row tracks (CSS subgrid): a row starts level
 * across the cards, whichever value runs longer, and the cards end together.
 * From lg the row labels stand once down the left, level with their rows, and
 * each card keeps its own labels for screen readers only. Phones stack the
 * cards. Every grid that needs subgrid switches on only behind @supports, so
 * browsers without it show plain cards side by side: labels in the cards,
 * rows not level, and any spare height below the shorter card's last row.
 */
export function Comparison({ product, tone }: { product: Product; tone: BandTone }) {
  const comparison = product.comparison;
  if (!comparison) return null;

  const { columns, title, intro } = comparison;
  const rows = comparisonRows(comparison);
  if (rows.length === 0) return null;

  // Track counts for the grids: a column per option; the header panel plus
  // one track per row.
  const tracks = {
    "--cols": columns.length,
    "--rows": rows.length,
    "--tracks": rows.length + 1,
  } as CSSProperties;

  return (
    <Section id="compare" tone={tone} labelledBy="compare-title">
      <SectionHeader id="compare-title" title={title} intro={intro} wide />

      <div
        style={tracks}
        className="lg:grid-cols-[11rem_repeat(var(--cols),minmax(0,1fr))] lg:gap-x-6 lg:supports-[grid-template-rows:subgrid]:grid"
      >
        {/* The labels column (lg). Hidden from screen readers: each card's
            own labels say the same. The first track sits beside the headers.
            pt-3.5: the label's smaller line centres on the value's first line. */}
        <div
          aria-hidden="true"
          className="hidden lg:row-span-(--tracks) lg:grid-rows-subgrid lg:supports-[grid-template-rows:subgrid]:grid"
        >
          <span />
          {rows.map((row) => (
            <span
              key={row.label}
              className="border-t border-line pt-3.5 pr-3 pb-3 text-sm text-label-style text-label"
            >
              {row.label}
            </span>
          ))}
        </div>

        <ul className="grid gap-4 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))] sm:gap-x-5 sm:gap-y-0 lg:col-span-(--cols) lg:row-span-(--tracks) lg:grid-cols-subgrid lg:grid-rows-subgrid lg:gap-x-6">
          {columns.map((column, ci) => (
            <OptionCard
              key={column.name}
              name={column.name}
              tagline={column.tagline}
              look={OPTIONS[ci] ?? fallbackLook(product)}
              rows={rows}
              index={ci}
            />
          ))}
        </ul>
      </div>
    </Section>
  );
}

/**
 * Any option past the two designed for: the product's own icon and colour on
 * a neutral tint, with a navy tagline.
 */
function fallbackLook(product: Product): OptionLook {
  return {
    icon: product.icon,
    color: product.accent,
    tint: "bg-subtle",
    mark: "text-inverse/10",
    ink: "text-title",
  };
}

function OptionCard({
  name,
  tagline,
  look,
  rows,
  index,
}: {
  name: string;
  tagline: string;
  look: OptionLook;
  rows: Row[];
  /** The option's column in the content, i.e. which of each row's values is its own. */
  index: number;
}) {
  // The card and its dl only become grids where subgrid works (see Comparison).
  return (
    <li className="overflow-hidden rounded-card border border-line bg-card shadow-card sm:row-span-(--tracks) sm:grid-rows-subgrid sm:supports-[grid-template-rows:subgrid]:grid">
      <div className={`relative isolate flex items-center gap-4 overflow-hidden px-5 py-5 sm:px-6 ${look.tint}`}>
        <Icon
          name={look.icon}
          className={`absolute -right-5 -bottom-7 -z-10 size-28 -rotate-12 ${look.mark}`}
        />
        <IconCircle name={look.icon} color={look.color} />
        <div className="min-w-0">
          <h3 className="text-xl font-heading text-balance text-title">{name}</h3>
          {/* In the option's colour on a white pill: green keeps its contrast
              on white, not on the tint. */}
          <p className={`mt-1.5 inline-flex items-center gap-2 rounded-pill bg-card px-3 py-0.5 text-sm font-label shadow-card ${look.ink}`}>
            <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${ACCENTS[look.color].bar}`} />
            {tagline}
          </p>
        </div>
      </div>

      <dl className="sm:row-span-(--rows) sm:grid-rows-subgrid sm:supports-[grid-template-rows:subgrid]:grid">
        {rows.map((row) => {
          // comparisonRows only keeps rows with a value for every option.
          const value = row.values[index];
          return (
            <div key={row.label} className="border-t border-line px-5 py-3 sm:px-6">
              <dt className="text-sm text-label-style text-label lg:supports-[grid-template-rows:subgrid]:sr-only">
                {row.label}
              </dt>
              <dd className="mt-0.5 text-base text-pretty text-body lg:supports-[grid-template-rows:subgrid]:mt-0">
                <Highlight text={value.text} />
                {value.pending ? <PendingBadge note={value.note} /> : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </li>
  );
}
