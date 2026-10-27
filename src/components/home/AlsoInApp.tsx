import type { ReactNode } from "react";
import { PawPrint, Ruler, Sprout, TrendingUp } from "lucide-react";
import { getSite, visible, type Accent } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import { Highlight } from "./parts";

type Visual = "records" | "mapping" | "calendar" | "guides";

// Each tool's tile: its tone, icon colour, place in the grid and illustration.
// Full class strings so Tailwind can find them. md:col-span-2 makes the
// records tile wide and md:row-span-2 the mapping tile tall: a bento grid
// (two columns on tablets, three from lg).
const TILES: Record<
  Visual,
  { box: string; icon: Accent; dark?: boolean; span: string; art: () => ReactNode }
> = {
  records: { box: "bg-brand-soft", icon: "brand", span: "md:col-span-2", art: RecordsArt },
  mapping: { box: "bg-accent-soft", icon: "accent", span: "md:row-span-2", art: MappingArt },
  calendar: { box: "bg-inverse text-on-inverse", icon: "accent", dark: true, span: "", art: CalendarArt },
  guides: { box: "border border-line bg-card", icon: "brand", span: "", art: GuidesArt },
};

/**
 * The free farm-management tools that sit alongside the four products, as a
 * bento grid of tiles in different tones, each with a small illustration of
 * the tool (decorative: the title and text say it all).
 */
export function AlsoInApp() {
  const { alsoInApp } = getSite();

  return (
    <Section id="also-in-the-app" labelledBy="also-in-the-app-title">
      <SectionHeader id="also-in-the-app-title" title={alsoInApp.title} intro={alsoInApp.intro} />
      {/* dense: tiles fill the gaps left by the wide and tall ones. */}
      <ul className="grid grid-cols-1 gap-4 md:grid-flow-row-dense md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {visible(alsoInApp.items).map((item) => {
          const tile = item.visual ? TILES[item.visual] : undefined;
          const wide = item.visual === "records";
          return (
            <li
              key={item.title}
              className={`flex flex-col overflow-hidden rounded-card p-5 sm:p-6 ${
                tile ? `${tile.box} ${tile.span}` : "border border-line bg-card"
              } ${wide ? "md:flex-row md:items-center md:gap-8" : ""}`}
            >
              <div className={wide ? "md:w-2/5 md:shrink-0" : ""}>
                <div className="flex items-center gap-3">
                  <IconCircle name={item.icon ?? "sprout"} color={tile?.icon ?? "brand"} />
                  <h3 className={`text-lg font-heading ${tile?.dark ? "text-on-inverse" : "text-title"}`}>
                    {item.title}
                    {item.pending ? <PendingBadge note={item.note} /> : null}
                  </h3>
                </div>
                <p className={`mt-3 text-base text-pretty ${tile?.dark ? "text-on-inverse" : "text-body"}`}>
                  {/* Green product names fall below 4.5:1 on navy: white there. */}
                  <Highlight
                    text={item.text}
                    className={tile?.dark ? "font-heading text-on-inverse" : undefined}
                  />
                </p>
              </div>
              {tile ? (
                // mt-auto: the art sits at the foot, level across a row.
                <div aria-hidden="true" className={`mt-auto flex flex-1 flex-col justify-end pt-5 ${wide ? "md:pt-0" : ""}`}>
                  {tile.art()}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

// The illustrations below are decorative (aria-hidden on their wrapper) and
// show sample data only. Heights as full class strings for Tailwind.
const INCOME = ["h-[40%]", "h-[54%]", "h-[47%]", "h-[66%]", "h-[60%]", "h-[84%]"];
const COSTS = ["h-[32%]", "h-[36%]", "h-[42%]", "h-[38%]", "h-[44%]", "h-[41%]"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/** Farm records: income and expenses by month, and a profit trend. */
function RecordsArt() {
  return (
    <div className="w-full rounded-2xl bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-label text-muted">
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-accent-bright" />
            Income
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand" />
            Expenses
          </span>
        </span>
        <span className="flex items-center gap-1 rounded-pill bg-accent-soft px-2 py-0.5 text-accent">
          <TrendingUp className="size-3.5" />
          Profit
        </span>
      </div>
      <div className="mt-4 flex h-28 items-end gap-2 border-b border-line">
        {INCOME.map((height, i) => (
          <div key={MONTHS[i]} className="flex h-full flex-1 items-end justify-center gap-1">
            <span className={`w-2.5 rounded-t-sm bg-accent-bright ${height}`} />
            <span className={`w-2.5 rounded-t-sm bg-brand ${COSTS[i]}`} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2 text-[11px] text-muted">
        {MONTHS.map((month) => (
          <span key={month} className="flex-1 text-center">
            {month}
          </span>
        ))}
      </div>
    </div>
  );
}

// A garden walked out on the map: its corner points, in the SVG's 240x230
// box, with room above for the pin and below for the size label.
const GARDEN = [
  [50, 70],
  [166, 50],
  [204, 132],
  [124, 178],
  [40, 144],
] as const;

/** Garden mapping: a garden outlined on a map grid, with its size. */
function MappingArt() {
  const [pinX, pinY] = GARDEN[1];
  return (
    <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-line bg-card md:h-full md:min-h-56">
      <div className="absolute inset-0 bg-[linear-gradient(var(--color-line)_1px,transparent_1px),linear-gradient(90deg,var(--color-line)_1px,transparent_1px)] bg-[size:24px_24px]" />
      <svg viewBox="0 0 240 230" className="absolute inset-0 size-full">
        <polygon
          points={GARDEN.map((p) => p.join(",")).join(" ")}
          fill="var(--color-accent-soft-strong)"
          fillOpacity="0.75"
          stroke="var(--color-accent-bright)"
          strokeWidth="2.5"
          strokeDasharray="7 5"
          strokeLinejoin="round"
        />
        {GARDEN.map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="5" fill="var(--color-card)" stroke="var(--color-accent-bright)" strokeWidth="2.5" />
        ))}
        {/* A map pin on the second corner. */}
        <g transform={`translate(${pinX} ${pinY - 6})`}>
          <path d="M0 0C-9-11-13-17-13-23a13 13 0 1 1 26 0c0 6-4 12-13 23Z" fill="var(--color-brand)" />
          <circle cy="-23" r="5" fill="var(--color-card)" />
        </g>
      </svg>
      <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-pill bg-card px-3 py-1.5 text-xs font-label text-title shadow-card">
        <Ruler className="size-3.5 text-accent" />
        Maize garden · 1.5 acres
      </span>
    </div>
  );
}

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const TODAY = 2;
const TASKS = [
  { task: "Plant maize", when: "Today", dot: "bg-accent-bright" },
  { task: "First weeding", when: "In 3 weeks", dot: "bg-on-inverse" },
  { task: "Apply fertiliser", when: "In 5 weeks", dot: "bg-on-inverse" },
];

/** Crop calendars: this week, with today's task and the next ones. */
function CalendarArt() {
  return (
    <div className="w-full rounded-2xl bg-on-inverse/10 p-3 ring-1 ring-on-inverse/15">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-label">
        {DAYS.map((day, i) => (
          <span
            key={i}
            className={`rounded-lg py-1.5 ${i === TODAY ? "bg-accent-bright text-on-accent" : "text-on-inverse/80"}`}
          >
            {day}
          </span>
        ))}
      </div>
      <div className="mt-3 space-y-2">
        {TASKS.map((t) => (
          <div key={t.task} className="flex items-center gap-2.5 rounded-lg bg-on-inverse/10 px-3 py-2 text-sm">
            <span className={`size-2 shrink-0 rounded-full ${t.dot}`} />
            <span className="min-w-0 flex-1 truncate font-label">{t.task}</span>
            <span className="shrink-0 text-xs text-on-inverse/80">{t.when}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Crop and animal guides: a fanned stack of guides, a crop one on top. */
function GuidesArt() {
  return (
    <div className="relative mx-auto mt-3 h-44 w-full max-w-72">
      {/* Two guides fanned out behind the top one. */}
      <div className="absolute inset-x-6 top-3 bottom-0 -rotate-[9deg] rounded-2xl bg-accent-soft-strong" />
      <div className="absolute inset-x-4 top-2 bottom-1 rotate-[6deg] rounded-2xl bg-brand-soft-strong" />
      <div className="absolute inset-x-1 top-0 bottom-4 rounded-2xl bg-card p-4 shadow-raised ring-1 ring-line">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-accent-bright text-on-accent">
            <Sprout className="size-[18px]" />
          </span>
          <span className="text-sm font-heading text-title">Maize guide</span>
        </div>
        <div className="mt-3 space-y-2">
          <span className="block h-2 w-full rounded-pill bg-line" />
          <span className="block h-2 w-11/12 rounded-pill bg-line" />
          <span className="block h-2 w-3/4 rounded-pill bg-line" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-label text-muted">
          {["Planting", "Pests", "Harvest"].map((tag) => (
            <span key={tag} className="rounded-pill bg-subtle px-2 py-0.5 ring-1 ring-line">
              {tag}
            </span>
          ))}
        </div>
      </div>
      {/* The animal guides peek out above the stack. */}
      <span className="absolute -top-3 -right-1 flex rotate-6 items-center gap-1.5 rounded-pill bg-brand px-3 py-1 text-xs font-label text-on-brand shadow-card">
        <PawPrint className="size-3.5" />
        Poultry guide
      </span>
    </div>
  );
}
