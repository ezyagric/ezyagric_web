import Image from "next/image";
import type { CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { getSite, isVisible, visible, type Site } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

type Partner = Site["partners"]["groups"][number]["items"][number];

// Groups with fewer logos than this sit still: a short list cannot fill a
// seamless loop across a wide screen.
const MIN_FOR_RAIL = 8;
// Seconds per logo, so every rail moves at the same speed.
const SECONDS_PER_LOGO = 3.5;

// Each group's row on a soft tint, alternating green and blue, with its icon
// in the matching solid circle and a bar of that colour that grows under a
// logo on hover. Full class strings so Tailwind can find them.
const TONES = [
  { row: "bg-accent-soft ring-accent-soft-strong", circle: "accent", bar: "after:bg-accent-bright" },
  { row: "bg-brand-soft ring-brand-soft-strong", circle: "brand", bar: "after:bg-brand" },
] as const;
type Tone = (typeof TONES)[number];

/**
 * Partner logos by group (commercial, strategic), one tinted row per group:
 * the group's icon and name on the left, its logos on raised white plates on
 * the right. Long groups glide past as a slow endless rail (alternating
 * directions); short ones sit still. Hovering a logo lifts its plate and
 * grows a bar of the row's colour under it.
 *
 * Motion (WCAG 2.2.2): rails pause on hover and with the Pause button (a
 * checkbox, so it works without JavaScript), and never move for people who
 * prefer reduced motion: then every logo shows, wrapped and centred. Each
 * rail holds its logos twice for the loop; the copy is hidden from screen
 * readers. Images are lazy-loaded below the fold.
 */
export function Partners() {
  const { partners } = getSite();
  const groups = partners.groups
    .map((g) => ({ ...g, items: visible(g.items) }))
    .filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;
  // Rails alternate direction among themselves (still groups in between don't count).
  const rails = groups.filter((g) => g.items.length >= MIN_FOR_RAIL).map((g) => g.title);

  return (
    <Section id="partners" tone="subtle" labelledBy="partners-title" className="group/partners">
      {/* Pause sits level with the intro's last line (the header has mb-10). */}
      <div className="flex flex-wrap items-end justify-between gap-x-8">
        <SectionHeader id="partners-title" title={partners.title} intro={partners.intro}>
          {partners.notice && isVisible(partners.notice) ? (
            <p className="mt-3 text-base text-muted">
              <ClaimText claim={partners.notice} />
            </p>
          ) : null}
        </SectionHeader>
        {rails.length > 0 ? (
          <div className="mb-8 sm:mb-10">
            <PauseToggle />
          </div>
        ) : null}
      </div>

      <div className="space-y-4">
        {groups.map((group, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <div
              key={group.title}
              className={`grid items-center gap-3 rounded-card p-3 ring-1 lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-5 lg:p-4 ${tone.row}`}
            >
              <div className="flex items-center gap-3 px-1">
                <IconCircle name={group.icon ?? "users"} color={tone.circle} size="sm" />
                <h3 className="text-sm text-label-style text-title">{group.title}</h3>
              </div>
              {rails.includes(group.title) ? (
                <Rail items={group.items} tone={tone} reverse={rails.indexOf(group.title) % 2 === 1} />
              ) : (
                <ul className="flex flex-wrap gap-3">
                  {group.items.map((p) => (
                    <Logo key={p.name} partner={p} tone={tone} />
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/** A group's logos twice over, sliding by one copy's width, edges faded. */
function Rail({ items, tone, reverse }: { items: Partner[]; tone: Tone; reverse: boolean }) {
  // Longhand animation properties (no shorthand), so the pause rules below
  // are never reset by it.
  const style: CSSProperties = {
    animationDuration: `${items.length * SECONDS_PER_LOGO}s`,
    animationDirection: reverse ? "reverse" : "normal",
  };
  return (
    // -my-3 py-3: room inside the clipped rail for a lifted plate and its
    // shadow-lift (which ends about 10px below it; shadow-raised would be cut off).
    <div className="group/rail -my-3 overflow-hidden py-3 motion-safe:[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div
        style={style}
        className="flex w-max motion-safe:[animation-iteration-count:infinite] motion-safe:[animation-name:marquee] motion-safe:[animation-timing-function:linear] motion-reduce:w-full group-hover/rail:[animation-play-state:paused] group-has-[#partners-pause:checked]/partners:[animation-play-state:paused]"
      >
        {/* pr-3 on each copy (not a gap between them): -50% is exactly one copy. */}
        <ul className="flex gap-3 pr-3 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0">
          {items.map((p) => (
            <Logo key={p.name} partner={p} tone={tone} />
          ))}
        </ul>
        <ul aria-hidden="true" className="flex gap-3 pr-3 motion-reduce:hidden">
          {items.map((p) => (
            <Logo key={p.name} partner={p} tone={tone} copy />
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * A partner's logo on a white plate (logos stay as supplied, in colour); a
 * partner without a logo file yet shows its name as a wordmark. On hover
 * the plate lifts and the row's colour grows along its foot; without
 * motion, the bar just appears.
 */
function Logo({ partner, tone, copy = false }: { partner: Partner; tone: Tone; copy?: boolean }) {
  const { name, logo, pending, note } = partner;
  return (
    <li
      className={`group/logo relative flex h-20 w-44 shrink-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-card bg-card px-5 py-2 shadow-card ring-1 ring-line after:absolute after:inset-x-0 after:bottom-0 after:h-1 after:origin-left after:scale-x-0 hover:shadow-lift hover:after:scale-x-100 motion-safe:transition motion-safe:after:transition-transform motion-safe:after:duration-300 motion-safe:hover:-translate-y-0.5 ${tone.bar}`}
    >
      {logo ? (
        <Image
          src={logo.src}
          alt={copy ? "" : logo.alt}
          width={logo.width}
          height={logo.height}
          sizes="136px"
          className="max-h-12 w-auto max-w-full object-contain motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover/logo:scale-105"
        />
      ) : (
        <span className="text-center text-xl leading-tight font-heading tracking-heading text-brand">{name}</span>
      )}
      {pending && !copy ? <PendingBadge note={note} /> : null}
    </li>
  );
}

/**
 * Pauses every rail. A checkbox styled as a button, so it works without
 * JavaScript; hidden for people who prefer reduced motion (nothing moves).
 */
function PauseToggle() {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-pill border border-line bg-card px-4 text-sm font-label text-title shadow-card hover:border-secondary has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus motion-reduce:hidden">
      <input id="partners-pause" type="checkbox" aria-label="Pause the moving logos" className="peer sr-only" />
      <Pause aria-hidden="true" className="size-4 text-secondary peer-checked:hidden" />
      <Play aria-hidden="true" className="hidden size-4 text-secondary peer-checked:block" />
      <span aria-hidden="true" className="peer-checked:hidden">
        Pause
      </span>
      <span aria-hidden="true" className="hidden peer-checked:inline">
        Play
      </span>
    </label>
  );
}
