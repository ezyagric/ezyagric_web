"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const noSubscription = () => () => {};

export type CarouselSlide = {
  /** Unique id: anchor target for the switcher links (works without JS). */
  id: string;
  /** Name, e.g. "Ka-Ezy": shown in the switcher for the current slide, else announced. */
  name: string;
  /** The service's icon in the switcher. */
  icon: ReactNode;
  content: ReactNode;
};

/**
 * A slider with a compact switcher and a gentle auto-advance.
 *
 * - The switcher is one segmented pill as wide as the slides, so it lines
 *   up with the slide's text on the left and the pause button on the right.
 *   The current slide's segment takes the spare width and shows its icon and
 *   name (growing smoothly, unless reduced motion is on); the others show
 *   just their icon (with their name for screen readers and as a tooltip),
 *   so all of them fit on one line even on a phone (on the narrowest, the
 *   current name is shortened). Swiping and the switcher move between
 *   slides; there are no separate arrows.
 * - Without JavaScript it is a native swipeable row (CSS scroll snap) and the
 *   switcher links jump to their slide, so nothing depends on scripts.
 * - Auto-advance never starts for people who prefer reduced motion, pauses
 *   while the pointer or keyboard focus is inside, stops for good once the
 *   visitor picks a slide, swipes or presses pause, and has a pause button
 *   (WCAG 2.2.2). Off-screen slides are inert so keyboard users only reach
 *   the visible one.
 * - All looks come from theme tokens.
 */
export function Carousel({
  label,
  slides,
  intervalMs = 6000,
  className = "",
}: {
  label: string;
  slides: CarouselSlide[];
  intervalMs?: number;
  className?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  // false on the server and in the first client render, true once hydrated:
  // the pause button only appears when it can work.
  const enhanced = useSyncExternalStore(noSubscription, () => true, () => false);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => true,
  );
  // null until the visitor plays or pauses: then auto-advance follows the
  // reduced-motion setting.
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const playing = enhanced && (userPlaying ?? !reducedMotion);
  const setPlaying = (value: boolean) => setUserPlaying(value);
  const count = slides.length;

  const goTo = useCallback(
    (next: number, byUser: boolean) => {
      const track = trackRef.current;
      const i = (next + count) % count;
      const slide = track?.children[i] as HTMLElement | undefined;
      if (track && slide) {
        track.scrollTo({ left: slide.offsetLeft, behavior: reducedMotion ? "auto" : "smooth" });
      }
      setIndex(i);
      if (byUser) setUserPlaying(false);
    },
    [count, reducedMotion],
  );

  // Keep `index` in step with swipes and native scrolling.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIndex(Array.prototype.indexOf.call(track.children, entry.target));
          }
        }
      },
      { root: track, threshold: 0.6 },
    );
    for (const child of Array.from(track.children)) observer.observe(child);
    return () => observer.disconnect();
  }, []);

  // Auto-advance.
  useEffect(() => {
    if (!playing || hovered || focused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") goTo(index + 1, false);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [playing, hovered, focused, index, intervalMs, goTo]);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className={className}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <ul className="flex w-full items-center gap-1 rounded-pill border border-line bg-subtle p-1">
        {slides.map((slide, i) => {
          const current = i === index;
          return (
            <li
              key={slide.id}
              className={`min-w-0 motion-safe:transition-[flex-grow] motion-safe:duration-300 motion-safe:ease-out ${current ? "grow" : "shrink-0 grow-0"}`}
            >
              <a
                href={`#${slide.id}`}
                aria-controls={slide.id}
                aria-current={current ? "true" : undefined}
                title={current ? undefined : slide.name}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(i, true);
                }}
                className={`flex min-h-11 w-full min-w-11 items-center justify-center gap-2 rounded-pill p-1 text-sm font-label transition-colors ${
                  current ? "bg-card pr-3.5 text-title shadow-card" : "text-muted hover:bg-card"
                }`}
              >
                {slide.icon}
                <span className={current ? "min-w-0 truncate" : "sr-only"}>{slide.name}</span>
              </a>
            </li>
          );
        })}
      </ul>

      {/* Announces the slide after a visitor changes it (silent while auto-advancing). */}
      <p className="sr-only" aria-live="polite">
        {enhanced && !playing ? `${index + 1} of ${count}: ${slides[index]?.name}` : ""}
      </p>

      <div className="relative">
        <div
          ref={trackRef}
          onPointerDown={() => setPlaying(false)}
          className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              id={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}: ${slide.name}`}
              inert={enhanced && i !== index}
              className="w-full shrink-0 snap-center"
            >
              {slide.content}
            </div>
          ))}
        </div>

        {enhanced ? (
          // Pause / play at the top right of the slides (slide content keeps
          // its first line clear of it).
          <div className="absolute top-0 right-0 z-20">
            <ControlButton
              label={playing ? "Pause the slideshow" : "Play the slideshow"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            </ControlButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-11 cursor-pointer items-center justify-center rounded-button border border-line bg-card text-secondary shadow-card hover:border-secondary"
    >
      {children}
    </button>
  );
}
