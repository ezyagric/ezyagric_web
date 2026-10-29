import type { ReactNode } from "react";
import { Feather, LockKeyhole, type LucideIcon } from "lucide-react";
import type { PromiseKind } from "@/lib/content";

/**
 * The marks of EzyAgric Business's two promises, used across the page: a
 * padlock in brand blue for privacy and security, a feather in green for no
 * heavy upfront investment. Shape tells them apart as well as colour.
 */
export const PROMISE_GLYPH: Record<PromiseKind, LucideIcon> = { privacy: LockKeyhole, investment: Feather };

// Stamp ink on white (accent green passes 5.1:1). Full class strings so
// Tailwind can find them.
export const STAMP_INK: Record<PromiseKind, string> = {
  privacy: "border-brand bg-card text-brand",
  investment: "border-accent bg-card text-accent",
};

const DOT: Record<PromiseKind, string> = {
  privacy: "bg-brand text-on-brand",
  investment: "bg-accent-bright text-on-accent",
};

/**
 * A rubber stamp with the promise's glyph: real text (read in line), unless
 * `decorative`. `ink` overrides the colours (the navy chapter).
 */
export function PromiseStamp({
  kind,
  ink,
  size = "sm",
  decorative = false,
  className = "",
  children,
}: {
  kind: PromiseKind;
  ink?: string;
  size?: "sm" | "md";
  decorative?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const Glyph = PROMISE_GLYPH[kind];
  return (
    <span
      aria-hidden={decorative || undefined}
      className={`inline-flex w-fit max-w-full items-center gap-1.5 rounded-control border-2 text-sm font-label text-pretty forced-colors:border-[CanvasText] ${
        size === "md" ? "px-2.5 py-1 text-label-style" : "px-2 py-0.5"
      } ${ink ?? STAMP_INK[kind]} ${className}`}
    >
      <Glyph aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
      {children}
    </span>
  );
}

/** The promise's glyph in a small circle, in place of a list's green tick (CheckDot). */
export function PromiseDot({
  kind,
  onDark = false,
  className = "mt-0.5",
}: {
  kind: PromiseKind;
  onDark?: boolean;
  className?: string;
}) {
  const Glyph = PROMISE_GLYPH[kind];
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full forced-colors:border ${
        onDark && kind === "privacy" ? "bg-card text-brand" : DOT[kind]
      } ${className}`}
    >
      <Glyph strokeWidth={2.5} className="size-3" />
    </span>
  );
}

// The seal's scalloped rim: 18 bumps round a 100x100 box, worked out once.
const pt = (r: number, a: number) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
const BUMPS = 18;
const RIM =
  Array.from({ length: BUMPS }, (_, i) => {
    const a0 = (i / BUMPS) * 2 * Math.PI;
    const a1 = ((i + 1) / BUMPS) * 2 * Math.PI;
    return `${i === 0 ? `M${pt(41, a0)}` : ""} Q${pt(49, (a0 + a1) / 2)} ${pt(41, a1)}`;
  }).join("") + "Z";

/** A blue wax seal with a padlock: the privacy promise, sealed. Decoration. */
export function PromiseSeal({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative inline-block drop-shadow-[0_6px_8px_color-mix(in_srgb,var(--color-shade)_30%,transparent)] ${className}`}
    >
      <svg viewBox="0 0 100 100" className="size-full">
        <path
          d={RIM}
          strokeWidth={2}
          className="fill-brand stroke-transparent forced-colors:fill-[Canvas] forced-colors:stroke-[CanvasText]"
        />
        <circle
          cx="50"
          cy="50"
          r="33"
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          className="stroke-on-brand/60 forced-colors:stroke-[CanvasText]"
        />
      </svg>
      <LockKeyhole
        strokeWidth={2}
        className="absolute inset-0 m-auto size-[36%] text-on-brand forced-colors:text-[CanvasText]"
      />
    </span>
  );
}
