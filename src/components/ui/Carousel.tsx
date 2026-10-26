"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const noSubscription = () => () => {};

export type CarouselSlide = {
  /** Unique id: anchor target for the picker links (works without JS). */
  id: string;
  /** Accessible name, e.g. "Ka-Ezy". */
  name: string;
  /** Picker label (icon + name). */
  picker: ReactNode;
  content: ReactNode;
};

/**
 * A slider with a picker row, previous/next arrows and a gentle auto-advance.
 *
 * - Without JavaScript it is a native swipeable row (CSS scroll snap) and the
 *   picker links jump to their slide, so nothing depends on scripts.
 * - Auto-advance never starts for people who prefer reduced motion, pauses
 *   while the pointer or keyboard focus is inside, stops for good once the
 *   visitor picks, swipes or presses an arrow, and has a pause button
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
  // the arrows and pause button only appear when they can work.
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
      <ul className="flex flex-wrap gap-2 py-1">
          {slides.map((slide, i) => (
            <li key={slide.id} className="shrink-0">
              <a
                href={`#${slide.id}`}
                aria-controls={slide.id}
                aria-current={i === index ? "true" : undefined}
                onClick={(event) => {
                  event.preventDefault();
                  goTo(i, true);
                }}
                className={`inline-flex min-h-11 items-center gap-1.5 rounded-pill border py-1 pr-3 pl-1 text-sm font-label transition-colors ${
                  i === index
                    ? "border-secondary bg-brand-soft text-title"
                    : "border-line bg-card text-muted hover:border-secondary hover:text-title"
                }`}
              >
                {slide.picker}
              </a>
            </li>
          ))}
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
          // Controls sit together at the top right of the slides (slide
          // content keeps its first line clear of them).
          <div className="absolute top-1 right-0 z-20 flex gap-2">
            <ControlButton label="Previous service" onClick={() => goTo(index - 1, true)}>
              <ChevronLeft aria-hidden="true" className="size-5" />
            </ControlButton>
            <ControlButton
              label={playing ? "Pause the slideshow" : "Play the slideshow"}
              onClick={() => setPlaying(!playing)}
            >
              {playing ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
            </ControlButton>
            <ControlButton label="Next service" onClick={() => goTo(index + 1, true)}>
              <ChevronRight aria-hidden="true" className="size-5" />
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
