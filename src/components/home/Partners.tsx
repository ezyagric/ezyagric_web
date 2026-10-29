import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { getSite, isVisible, visible, type Site } from "@/lib/content";
import { Section } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

type Group = Site["partners"]["groups"][number];
type Partner = Group["items"][number];

// Each page's ink: commercial green, strategic blue (alternating after that).
// Small text uses text-accent (5.1:1 on white), never accent-bright. Full
// class strings so Tailwind finds them.
const INKS = [
  { circle: "accent", stamp: "border-accent text-accent", rule: "border-accent-soft-strong", pen: "after:bg-accent-bright" },
  { circle: "brand", stamp: "border-brand text-brand", rule: "border-brand-soft-strong", pen: "after:bg-brand" },
] as const;
type Ink = (typeof INKS)[number];

/** A logo at least this many times as wide as it is tall takes two cells (Syngenta, Simlaw Seeds, Mandela Millers, Pezesha, IFC, Onafriq, TechnoServe, Illinois). */
const WIDE = 3;
/** Optical sizing: width = base x ratio^0.6, capped by the row and the cell, so a square seal and a long wordmark carry about the same weight. */
const EXPONENT = 0.6;
/** Phones and small tablets show this many rows of a page before "Show all" (the literal 3 in FOLD_PHONE and FOLD_SM). */
const FOLD_ROWS = 3;

// Folded: three rows, the last fading into the paper. Opened (the page's
// checkbox checked): everything. The group-has classes beat the max-* ones on
// specificity, so class order does not matter. Without :has(), globals.css
// unfolds [data-fold] and hides [data-show-all].
const FOLD_PHONE =
  "max-sm:max-h-[calc(var(--row)*3)] max-sm:overflow-hidden max-sm:[mask-image:linear-gradient(to_bottom,black_calc(100%_-_3rem),transparent)]";
const FOLD_SM =
  "sm:max-md:max-h-[calc(var(--row)*3)] sm:max-md:overflow-hidden sm:max-md:[mask-image:linear-gradient(to_bottom,black_calc(100%_-_3rem),transparent)]";
const UNFOLD =
  "group-has-[:checked]/page:max-h-none group-has-[:checked]/page:overflow-visible group-has-[:checked]/page:[mask-image:none]";

const ratio = (p: Partner) => (p.logo ? p.logo.width / p.logo.height : 1);
const span = (p: Partner) => (ratio(p) >= WIDE ? 2 : 1);

/**
 * Our partners as a register: an open ledger on a brand-gradient cover, one
 * white page per group (commercial in green ink, strategic in blue), facing
 * pages from lg with a soft crease down the spine. Each page heads with its
 * icon and name, a round ink stamp with its count, and a double rule like an
 * account's total; its logos sit straight on ruled paper (as supplied, in
 * colour), sized optically, wide wordmarks over two cells, packed densely so
 * no line has a gap. Every logo shows at once from md; phones and small
 * tablets show three rows a page, then "Show all" (a checkbox, so no
 * JavaScript; the folded logos stay in the accessibility tree). Nothing moves
 * on its own: the stamps press in as they scroll into view (globals.css;
 * skipped for reduced motion).
 */
export function Partners() {
  const { partners } = getSite();
  const groups = partners.groups
    .map((g) => ({ ...g, items: visible(g.items) }))
    .filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  // Two groups open as facing pages from lg; any other number stacks.
  const spread = groups.length === 2;

  return (
    <Section id="partners" tone="subtle" labelledBy="partners-title">
      <div className="mb-8 sm:mb-10 lg:grid lg:grid-cols-2 lg:items-end lg:gap-12">
        <h2 id="partners-title" className="text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl">
          <KeepHyphensTogether text={partners.title} />
        </h2>
        <div className="mt-3 max-w-2xl lg:mt-0">
          {partners.intro ? (
            <p className="text-lg text-pretty text-muted">
              <KeepHyphensTogether text={partners.intro} />
            </p>
          ) : null}
          {partners.notice && isVisible(partners.notice) ? (
            <p className="mt-3 text-base text-muted">
              <ClaimText claim={partners.notice} />
            </p>
          ) : null}
        </div>
      </div>

      <div className="relative isolate sm:p-3 lg:p-4">
        {/* The register's hardcover, green behind the first (green) page.
            Forced colours drop gradients, so it simply goes away there. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 hidden rounded-media bg-linear-to-l from-gradient-start to-gradient-decor-end shadow-raised sm:block"
        />
        {spread ? (
          // The spine: a soft crease over the gutter (inset-y-4 = the board's lg:p-4).
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-4 left-1/2 z-10 hidden w-16 -translate-x-1/2 bg-[linear-gradient(to_right,transparent,color-mix(in_srgb,var(--color-shade)_6%,transparent)_44%,color-mix(in_srgb,var(--color-shade)_14%,transparent)_50%,color-mix(in_srgb,var(--color-shade)_6%,transparent)_56%,transparent)] lg:block"
          />
        ) : null}
        <div className={`grid gap-4 sm:gap-3 ${spread ? "lg:grid-cols-2 lg:gap-0" : ""}`}>
          {groups.map((group, i) => (
            <RegisterPage
              key={group.title}
              group={group}
              ink={INKS[i % INKS.length]}
              side={spread ? (i === 0 ? "left" : "right") : undefined}
            />
          ))}
        </div>
      </div>
    </Section>
  );
}

/** One group's page: head (icon, name, count stamp, double rule) over ruled paper. */
function RegisterPage({ group, ink, side }: { group: Group; ink: Ink; side?: "left" | "right" }) {
  const id = `partners-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const cells = group.items.reduce((n, p) => n + span(p), 0);
  // Fold only where there are certainly more than three rows (2 columns on
  // phones, 4 on small tablets); dense packing never needs more rows.
  const foldPhone = Math.ceil(cells / 2) > FOLD_ROWS;
  const foldSm = Math.ceil(cells / 4) > FOLD_ROWS;
  // Square at the gutter, logos kept 2rem clear of the crease.
  const gutter = side === "left" ? "lg:rounded-r-none lg:pr-8" : side === "right" ? "lg:rounded-l-none lg:pl-8" : "";

  return (
    <div
      className={`group/page relative flex flex-col rounded-media bg-card p-3 shadow-card ring-1 ring-line forced-colors:border sm:p-5 ${gutter}`}
    >
      <div className={`flex items-center justify-between gap-3 border-b-4 border-double pb-3 ${ink.rule}`}>
        <div className="flex min-w-0 items-center gap-3">
          <IconCircle name={group.icon ?? "users"} color={ink.circle} size="sm" />
          <h3 id={id} className="min-w-0 text-sm text-label-style text-pretty text-title">
            {group.title}
          </h3>
        </div>
        {/* The count stamp. Decorative: the list announces "list, 19 items". */}
        <span
          aria-hidden="true"
          data-stamp
          className={`relative flex size-16 shrink-0 -rotate-6 flex-col items-center justify-center rounded-full border-2 forced-colors:border-[CanvasText] ${ink.stamp}`}
        >
          <span className="absolute inset-1 rounded-full border border-dashed border-current opacity-50" />
          <span className="text-2xl/none font-heading tracking-heading tabular-nums">{group.items.length}</span>
          <span className="mt-0.5 text-[10px]/none font-label tracking-wide uppercase">entries</span>
        </span>
      </div>
      {/* role="list": Safari drops the list role from unstyled lists. Dense
          packing fills every gap; nothing in the list is focusable, so the
          visual order may differ slightly from the YAML order without harm. */}
      <ul
        role="list"
        aria-labelledby={id}
        data-fold={foldPhone || undefined}
        className={`ledger-rules grid flex-1 grid-flow-row-dense auto-rows-(--row) grid-cols-2 content-start [--logo-base:3.25rem] [--logo-cap:2.75rem] [--row:4.5rem] sm:grid-cols-4 sm:[--logo-base:3.75rem] sm:[--logo-cap:3.25rem] sm:[--row:4.75rem] md:grid-cols-5 ${side ? "lg:grid-cols-4" : "lg:grid-cols-8"} ${foldPhone ? `${FOLD_PHONE} ${UNFOLD}` : ""} ${foldSm ? FOLD_SM : ""}`}
      >
        {group.items.map((p) => (
          <Entry key={p.name} partner={p} ink={ink} />
        ))}
      </ul>
      {foldPhone ? <ShowAll count={group.items.length} title={group.title} hideFrom={foldSm ? "md:hidden" : "sm:hidden"} /> : null}
    </div>
  );
}

/**
 * One entry: the logo straight on the paper (as supplied), or the name if
 * there is no file yet. Width = base x ratio^0.6, never taller than the cap
 * nor wider than the cell (CSS min()), so h-auto keeps the exact aspect and
 * nothing letterboxes. Hover draws a pen line in the page's ink on its rule.
 */
function Entry({ partner, ink }: { partner: Partner; ink: Ink }) {
  const { name, logo, pending, note } = partner;
  const r = ratio(partner);
  return (
    <li
      className={`relative flex min-w-0 items-center justify-center p-2 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-pill hover:after:scale-x-100 motion-safe:after:transition-transform motion-safe:after:duration-300 ${span(partner) === 2 ? "col-span-2" : ""} ${ink.pen}`}
    >
      {logo ? (
        <Image
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          loading="lazy"
          style={{
            width: `min(calc(var(--logo-base) * ${(r ** EXPONENT).toFixed(3)}), calc(var(--logo-cap) * ${r.toFixed(3)}), 100%)`,
          }}
          className="h-auto object-contain"
        />
      ) : (
        <span className="line-clamp-2 text-center text-sm/tight font-heading tracking-heading text-pretty text-brand">{name}</span>
      )}
      {pending ? (
        <span className="absolute right-1 bottom-1">
          <PendingBadge note={note} />
        </span>
      ) : null}
    </li>
  );
}

/**
 * Opens a folded page (phones, small tablets). A native checkbox in a pill:
 * the visible label never changes ("Show all 19"; WCAG 2.5.3), checked shows
 * everything and the chevron turns up.
 */
function ShowAll({ count, title, hideFrom }: { count: number; title: string; hideFrom: string }) {
  return (
    <label
      data-show-all
      className={`mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 self-center rounded-pill border border-line bg-card px-4 text-sm font-label text-title shadow-card hover:border-secondary has-[:checked]:bg-brand-soft has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus ${hideFrom}`}
    >
      <input type="checkbox" className="peer sr-only" />
      <span>
        Show all {count}
        <span className="sr-only"> {title.toLowerCase()}</span>
      </span>
      <ChevronDown aria-hidden="true" className="size-4 text-secondary peer-checked:rotate-180 motion-safe:transition-transform" />
    </label>
  );
}
