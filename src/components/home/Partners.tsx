import Image from "next/image";
import type { CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { getSite, isVisible, visible, type Site } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

type Partner = Site["partners"]["groups"][number]["items"][number];

// Groups with fewer logos than this sit still: a short list cannot fill a
// seamless loop across a wide screen.
const MIN_FOR_RAIL = 8;
// Seconds per logo, so every rail moves at the same speed.
const SECONDS_PER_LOGO = 3.5;

/**
 * Partner logos grouped as in the Business Profile (commercial, financial,
 * funding and strategic), one row per group: the group's name and count on
 * the left, its logos on the right. Long groups glide past as a slow
 * endless rail (alternating directions); short ones sit still.
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
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  // Rails alternate direction among themselves (still groups in between don't count).
  const rails = groups.filter((g) => g.items.length >= MIN_FOR_RAIL).map((g) => g.title);

  return (
    <Section id="partners" tone="subtle" labelledBy="partners-title" className="group/partners">
      {/* The count and Pause sit level with the intro's last line (the header has mb-10). */}
      <div className="flex flex-wrap items-end justify-between gap-x-8">
        <SectionHeader id="partners-title" title={partners.title} intro={partners.intro}>
          {partners.notice && isVisible(partners.notice) ? (
            <p className="mt-3 text-base text-muted">
              <ClaimText claim={partners.notice} />
            </p>
          ) : null}
        </SectionHeader>
        <div className="mb-8 flex items-center gap-3 sm:mb-10">
          <p className="flex items-baseline gap-2 rounded-pill bg-card px-4 py-2 shadow-card ring-1 ring-line">
            <span className="text-2xl font-heading text-accent-bright tabular-nums">{total}</span>
            <span className="text-sm font-label text-title">partners</span>
          </p>
          {rails.length > 0 ? <PauseToggle /> : null}
        </div>
      </div>

      <div className="space-y-4">
        {groups.map((group) => (
          <div
            key={group.title}
            className="grid items-center gap-3 rounded-card bg-card p-3 shadow-card ring-1 ring-line lg:grid-cols-[12rem_minmax(0,1fr)] lg:gap-5 lg:p-4"
          >
            <h3 className="flex items-center gap-2 px-1 text-sm text-label-style text-label lg:flex-col lg:items-start lg:gap-1">
              {group.title}
              <span className="rounded-pill bg-brand-soft px-2.5 py-0.5 text-xs font-label tracking-normal text-brand normal-case tabular-nums">
                {group.items.length}
              </span>
            </h3>
            {rails.includes(group.title) ? (
              <Rail items={group.items} reverse={rails.indexOf(group.title) % 2 === 1} />
            ) : (
              <ul className="flex flex-wrap gap-3">
                {group.items.map((p) => (
                  <Logo key={p.name} partner={p} />
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/** A group's logos twice over, sliding by one copy's width, edges faded. */
function Rail({ items, reverse }: { items: Partner[]; reverse: boolean }) {
  // Longhand animation properties (no shorthand), so the pause rules below
  // are never reset by it.
  const style: CSSProperties = {
    animationDuration: `${items.length * SECONDS_PER_LOGO}s`,
    animationDirection: reverse ? "reverse" : "normal",
  };
  return (
    <div className="group/rail overflow-hidden motion-safe:[mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]">
      <div
        style={style}
        className="flex w-max motion-safe:[animation-iteration-count:infinite] motion-safe:[animation-name:marquee] motion-safe:[animation-timing-function:linear] motion-reduce:w-full group-hover/rail:[animation-play-state:paused] group-has-[#partners-pause:checked]/partners:[animation-play-state:paused]"
      >
        {/* pr-3 on each copy (not a gap between them): -50% is exactly one copy. */}
        <ul className="flex gap-3 pr-3 motion-reduce:flex-wrap motion-reduce:justify-center motion-reduce:pr-0">
          {items.map((p) => (
            <Logo key={p.name} partner={p} />
          ))}
        </ul>
        <ul aria-hidden="true" className="flex gap-3 pr-3 motion-reduce:hidden">
          {items.map((p) => (
            <Logo key={p.name} partner={p} copy />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Logo({ partner, copy = false }: { partner: Partner; copy?: boolean }) {
  const { logo, pending, note } = partner;
  return (
    <li className="flex h-20 w-40 shrink-0 flex-col items-center justify-center gap-1 rounded-card border border-line bg-card px-4 py-2">
      <Image
        src={logo.src}
        alt={copy ? "" : logo.alt}
        width={logo.width}
        height={logo.height}
        sizes="128px"
        className="max-h-12 w-auto max-w-full object-contain"
      />
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
