import { visible, type Accent, type Product } from "@/lib/content";
import { Highlight } from "@/components/home/parts";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import type { BandTone } from "./tones";

// The product's accent as soft tints. Full class strings so Tailwind can
// find them. `panel` is the lead tile (fill and edge) and `mark` its
// watermark, as on the home page's service cards; `ghost` is the watermark
// on the white tiles and `halo` the ring round their icons. Watermarks fade
// as a whole (opacity, not a see-through colour), so where the glyph's
// strokes cross they stay at 5% and green product names keep 4.5:1 there.
const TINTS: Record<Accent, { panel: string; mark: string; ghost: string; halo: string }> = {
  brand: {
    panel: "bg-brand-soft ring-brand-soft-strong",
    mark: "text-brand opacity-10",
    ghost: "text-brand opacity-5",
    halo: "ring-brand-soft",
  },
  accent: {
    panel: "bg-accent-soft ring-accent-soft-strong",
    mark: "text-accent-bright opacity-15",
    ghost: "text-accent-bright opacity-5",
    halo: "ring-accent-soft",
  },
  deep: {
    panel: "bg-brand-soft-strong ring-brand-soft-strong",
    mark: "text-inverse opacity-10",
    ghost: "text-inverse opacity-5",
    halo: "ring-brand-soft-strong",
  },
};

type Look = {
  box: string;
  art: string;
  circle: Accent;
  halo: string;
  title: string;
  text: string;
  /** Product names in the copy (Highlight); green when unset. */
  names?: string;
};

/**
 * The three tile looks: the lead on the product's tint, white cards, and
 * the navy tile that closes the grid (as on the home page's bento). Product
 * names in the copy are green only on white (green small text falls below
 * 4.5:1 on the tints and on navy): navy on the tint, white on navy. The
 * navy tile's icon is green: a blue or navy circle would vanish on it.
 */
function looks(accent: Accent): Record<"lead" | "card" | "dark", Look> {
  const tint = TINTS[accent];
  return {
    lead: {
      box: tint.panel,
      art: `-right-6 -bottom-8 size-40 ${tint.mark}`,
      circle: accent,
      halo: "ring-card",
      title: "text-title",
      text: "text-body",
      names: "font-heading text-title",
    },
    card: {
      box: "bg-card shadow-card ring-line",
      art: `-right-4 -bottom-6 size-28 ${tint.ghost}`,
      circle: accent,
      halo: tint.halo,
      title: "text-title",
      text: "text-body",
    },
    dark: {
      box: "bg-inverse text-on-inverse ring-inverse",
      art: "-right-6 -bottom-8 size-40 text-on-inverse opacity-10",
      circle: "accent",
      halo: "ring-on-inverse/10",
      title: "text-on-inverse",
      // A ==marked== phrase's light highlighter would hide white text: its
      // stroke turns the accessible green (white on it is 5.1:1).
      text: "text-on-inverse [&_mark]:bg-[linear-gradient(transparent_55%,var(--color-accent)_55%)] [&_mark]:text-on-inverse",
      names: "font-heading text-on-inverse",
    },
  };
}

// Every tile spans two rows of the list's grid and lays its icon and title
// in the first, its text in the second (subgrid). So across a row of tiles
// the icons and titles share one line and the texts start level, however
// the titles wrap.
const TILE =
  "relative isolate row-span-2 grid grid-cols-1 grid-rows-subgrid gap-y-3 overflow-hidden rounded-card p-5 ring-1 sm:p-6";

// From lg, a count divisible by three lays its rows of three on seven
// columns, wide-narrow-narrow then narrow-narrow-wide: a brick bento with
// no more rows than three equal columns. With six, the tinted lead and the
// navy tile take the wide places, at opposite corners.
const BRICK = [
  ["lg:col-span-3", "lg:col-span-2", "lg:col-span-2"],
  ["lg:col-span-2", "lg:col-span-2", "lg:col-span-3"],
];

// Other counts keep three columns from lg, and the lead widens wherever the
// others would leave a gap in its row: it fills the row (or two of its three
// columns) and lays its title and text side by side, the title as wide as
// it needs (up to 18rem). The list has two columns from sm, so the count
// modulo 6 says which: 6 tiles need no widening, 3 only in two columns (the
// brick spans it from lg), 4 only in three, and so on.
const SM_WIDE =
  "sm:col-span-2 sm:grid-cols-[fit-content(18rem)_minmax(0,1fr)] sm:grid-rows-none sm:items-center sm:gap-x-8";
const LG_WIDE =
  "lg:grid-cols-[fit-content(18rem)_minmax(0,1fr)] lg:grid-rows-none lg:items-center lg:gap-x-8";
const LG_NARROW = "lg:grid-cols-1 lg:grid-rows-subgrid lg:items-stretch";

// Where the lead is wide its icon and title go one size up (IconCircle's
// lg and text-xl). Where it shares a row of tiles (subgrid) it keeps their
// size, so a bigger title cannot stretch the row's title line and leave
// gaps round their icons.
const BIG = {
  none: { icon: "", title: "" },
  sm: { icon: "sm:size-16 sm:[&>svg]:size-8", title: "sm:text-xl" },
  lg: { icon: "lg:size-16 lg:[&>svg]:size-8", title: "lg:text-xl" },
  smOnly: {
    icon: "sm:size-16 sm:[&>svg]:size-8 lg:size-12 lg:[&>svg]:size-6",
    title: "sm:text-xl lg:text-lg",
  },
};
const LEAD_LAYOUT = [
  { tile: "", big: BIG.none }, // 6
  { tile: `${SM_WIDE} lg:col-span-3`, big: BIG.sm }, // 1, 7
  { tile: `${LG_WIDE} lg:col-span-2`, big: BIG.lg }, // 2, 8
  { tile: `${SM_WIDE} ${LG_NARROW}`, big: BIG.smOnly }, // 3, 9
  { tile: `${LG_WIDE} lg:col-span-3`, big: BIG.lg }, // 4
  { tile: `${SM_WIDE} lg:col-span-2`, big: BIG.sm }, // 5
];

/**
 * What the product does, as a bento of tiles. The first feature leads on a
 * soft tint of the product's accent, its icon in a white halo and again as
 * a large faint watermark. The others are white cards (guide card style:
 * line edge, card radius, title colour), each icon a white glyph in a solid
 * circle of the product's colour with a halo of its tint, and a fainter
 * watermark of it in the corner (it fills the room a short text leaves when
 * a longer one sets the row's height). From three features the last one is
 * navy, closing the grid opposite the lead.
 */
export function FeatureGrid({ product, tone }: { product: Product; tone: BandTone }) {
  const { features } = product;
  const items = visible(features.items);
  const look = looks(product.accent);
  const brick = items.length % 3 === 0;
  const layout = LEAD_LAYOUT[items.length % 6];

  return (
    <Section id="features" tone={tone} labelledBy="features-title">
      <SectionHeader id="features-title" title={features.title} />
      {/* role="list": Safari drops the list role from unstyled lists. */}
      <ul
        role="list"
        className={`grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 ${brick ? "lg:grid-cols-7" : "lg:grid-cols-3"}`}
      >
        {items.map((item, i) => {
          const lead = i === 0;
          const last = i === items.length - 1 && items.length >= 3;
          const tile = lead ? look.lead : last ? look.dark : look.card;
          const icon = item.icon ?? product.icon;
          return (
            <li
              key={item.title}
              className={`${TILE} ${tile.box} ${lead ? layout.tile : ""} ${
                brick ? BRICK[Math.floor(i / 3) % 2][i % 3] : ""
              }`}
            >
              <Icon name={icon} className={`absolute -z-10 -rotate-12 ${tile.art}`} />
              <div className="flex items-center gap-4">
                <IconCircle
                  name={icon}
                  color={tile.circle}
                  className={`ring-4 ${tile.halo} ${lead ? layout.big.icon : ""}`}
                />
                <h3
                  className={`min-w-0 text-lg font-heading text-balance ${tile.title} ${lead ? layout.big.title : ""}`}
                >
                  {item.title}
                  {item.pending ? <PendingBadge note={item.note} /> : null}
                </h3>
              </div>
              {/* max-w-prose: a readable line when the lead spans the row. */}
              <p className={`max-w-prose text-base text-pretty ${tile.text}`}>
                <Highlight text={item.text} className={tile.names} />
              </p>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
