import type { ReactNode } from "react";
import { Sprout } from "lucide-react";

/** From here the plan counts as used up (the API's "exhausted"), and the gauges turn red. */
export const LOW_FROM = 98;

/** A ring that fills from the top with the plan's use; its centre is `children`. */
export function UsageRing({
  percent,
  track,
  fill,
  className,
  children,
}: {
  percent: number;
  /** The empty ring's and the filled part's stroke classes. */
  track: string;
  fill: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <span className={`relative shrink-0 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 36 36" className="size-full -rotate-90">
        <circle cx="18" cy="18" r="16" fill="none" strokeWidth="3.5" className={track} />
        <circle
          cx="18"
          cy="18"
          r="16"
          fill="none"
          strokeWidth="3.5"
          pathLength={100}
          strokeDasharray={`${percent} 100`}
          strokeLinecap={percent > 0 ? "round" : "butt"}
          className={`transition-[stroke-dasharray] duration-700 ease-out motion-reduce:transition-none ${fill}`}
        />
      </svg>
      {children}
    </span>
  );
}

/**
 * "Live" and how much of their Ka-Ezy plan a signed-in visitor has used, one
 * capsule in the Ka-Ezy window's header (same figure as "Your Ka-Ezy account"
 * under the window, and it moves with each answer). A ring fills around a
 * sprout. It links down to that account panel; when the plan is used up or
 * nearly, the capsule turns white and red and links to "Pay for Ka-Ezy here"
 * instead. Phones have room for the ring alone, with the figure inside it.
 */
export function UsageGauge({
  label,
  used,
  exhausted,
  usedWord,
  planLabel,
  accountHref,
  payHref,
}: {
  /** "Live", or "Live · test". */
  label: string;
  /** Percent of the plan used. */
  used: number;
  exhausted: boolean;
  usedWord: string;
  planLabel: string;
  accountHref: string;
  payHref: string;
}) {
  const percent = Math.min(100, Math.max(0, used));
  const low = exhausted || percent >= LOW_FROM;
  const figure = `${Math.round(percent)}%`;

  return (
    <span className="flex shrink-0 items-center rounded-pill sm:border sm:border-on-brand/40">
      <span className="hidden items-center gap-1.5 pr-1 pl-3 text-xs font-label sm:flex">
        <span aria-hidden="true" className="size-2 rounded-full bg-accent-soft-strong motion-safe:animate-pulse" />
        {label}
      </span>
      <a
        href={low ? payHref : accountHref}
        title={planLabel}
        aria-label={`${figure} ${usedWord}, ${planLabel}`}
        data-track="kaezy_usage_click"
        data-track-state={low ? "low" : "ok"}
        className={`flex min-h-11 items-center gap-1.5 rounded-pill transition-colors focus-visible:outline-focus-inverse sm:py-1 sm:pr-3 sm:pl-1.5 ${
          low ? "bg-on-brand text-danger" : "hover:bg-on-brand/15"
        }`}
      >
        <UsageRing
          percent={percent}
          track="stroke-current opacity-25"
          fill={low ? "stroke-current" : "stroke-accent-soft-strong"}
          className="size-11 sm:size-8"
        >
          <Sprout aria-hidden="true" className="absolute inset-0 m-auto size-4 max-sm:hidden" />
          <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-[0.6875rem] font-heading tabular-nums sm:hidden">
            {figure}
          </span>
        </UsageRing>
        <span className="text-sm whitespace-nowrap max-sm:hidden">
          <span className="font-heading tabular-nums">{figure}</span>
          <span className="text-xs font-label"> {usedWord}</span>
        </span>
      </a>
    </span>
  );
}
