"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { trackData } from "@/lib/track";
import { HashLink, samePath } from "@/components/ui/HashLink";

export type ServiceItem = {
  href: string;
  name: string;
  tagline: string;
  /** Server-rendered icon (IconCircle), so the icon set stays out of the client bundle. */
  icon: ReactNode;
  /** Analytics event on the link (data-track), with its params. */
  track?: { event: string; params?: Record<string, string> };
  /** The tile's colours; a plain tile without. */
  tone?: TileTone;
  /** Server-rendered decoration clipped to the tile, behind its content (a glyph watermark, a page's top bar). */
  mark?: ReactNode;
  /** Server-rendered screen (an <Image alt="" absolute inset-0>) filling the tile's art row; the icon rides its lower-left corner. */
  strip?: ReactNode;
};

/** A tile's colours, as full class strings set by Header (so Tailwind finds them there). */
export type TileTone = {
  /** The surface at rest, and its hover tint if any. */
  tile: string;
  name: string;
  /** The number and the tagline. */
  muted: string;
  /** The arrow that fades in on hover. */
  arrow: string;
  /** The ring round a screen strip. */
  frame?: string;
};

const PLAIN: TileTone = { tile: "bg-subtle hover:bg-brand-soft", name: "text-title", muted: "text-muted", arrow: "text-link" };

function closeDetails(details: HTMLDetailsElement | null) {
  if (details) details.open = false;
}

/**
 * A services dropdown in the header (lg and up): the services as numbered
 * tiles, two by two (art above, name and tagline below, an arrow fading in on
 * hover), stretched to the height of the card beside them (`aside`), so the
 * panel has no empty bands. There are two: "Farmer Services" (the four farmer-app services
 * and the Ka-Ezy card) and "Agribusiness Services" (EzyAgric Business's four
 * modules, which jump to their chapters on its page, and its card). The panel
 * hangs from the header's nav pill (the nearest positioned ancestor, not this
 * menu), so both open at the pill's left edge and stay on screen at 1024px.
 *
 * It is a <details> element, so it opens and closes with JavaScript off; the
 * menus share a `name`, so opening one closes the other even then. With
 * JavaScript on, it also closes on Escape (focus goes back to its button), on
 * a click or tap outside (so opening one menu closes the other), when
 * keyboard focus moves on past it, and after a service is chosen. On a
 * service page, the button and that service are highlighted; on `pagePath`,
 * the button only, and the items jump natively to their sections there
 * (HashLink), so :target and keyboard focus follow.
 */
export function ServicesMenu({
  label,
  icon,
  items,
  aside,
  pagePath,
}: {
  label: string;
  /** Server-rendered icon before the label. */
  icon?: ReactNode;
  items: ServiceItem[];
  /** Server-rendered column beside the services (the Ka-Ezy or EzyAgric Business card). */
  aside?: ReactNode;
  /** The page the items jump into (anchors on it), where the button is highlighted too. */
  pagePath?: string;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const onServicePage =
    items.some((item) => samePath(item.href, pathname)) || (pagePath ? samePath(pagePath, pathname) : false);

  // The layout stays mounted across client-side navigations, so close on
  // a real page change. Not on mount: a visitor may have opened the native
  // <details> before the scripts arrived.
  const shownPath = useRef(pathname);
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    closeDetails(ref.current);
  }, [pathname]);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (ref.current?.open && !ref.current.contains(event.target as Node)) closeDetails(ref.current);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        closeDetails(ref.current);
        ref.current.querySelector("summary")?.focus();
      }
    }
    // A click into an iframe (a playing YouTube video) fires no pointerdown
    // here; the window loses focus to the iframe instead.
    function onWindowBlur() {
      if (ref.current?.open && document.activeElement instanceof HTMLIFrameElement) {
        closeDetails(ref.current);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("blur", onWindowBlur);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blur", onWindowBlur);
    };
  }, []);

  return (
    // Not `relative`: the panel is placed against the nav pill (see above).
    <details
      ref={ref}
      name="header-services"
      className="group"
      onBlur={(event) => {
        // Tabbing past the last service closes the panel.
        const next = event.relatedTarget as Node | null;
        if (next && !event.currentTarget.contains(next)) closeDetails(event.currentTarget);
      }}
    >
      {/* A segment of the header's nav pill: white and raised when open or hovered. */}
      <summary
        className={`inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-pill px-3.5 transition-colors group-open:bg-card group-open:text-link group-open:shadow-card hover:bg-card hover:text-link [&::-webkit-details-marker]:hidden ${
          onServicePage ? "bg-card text-link shadow-card" : "text-body"
        }`}
      >
        {icon}
        {/* Underlined on a service page: a cue that is not colour alone. */}
        <span className={onServicePage ? "underline decoration-2 underline-offset-4" : undefined}>
          {label}
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 motion-safe:transition-transform group-open:rotate-180"
        />
      </summary>

      <div
        className={`absolute top-full left-0 z-50 mt-3 grid gap-2 rounded-card border border-line bg-card p-2 whitespace-normal shadow-raised ${
          aside ? "w-[44rem] grid-cols-[minmax(0,1fr)_15rem]" : "w-[26rem]"
        }`}
        onClick={(event) => {
          // A plain click on any link in the panel closes it: same-page jumps
          // (/ka-ezy/#try-ka-ezy, a module's chapter on the EzyAgric Business
          // page) don't change the pathname.
          const plain = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
          if (plain && (event.target as Element).closest("a")) closeDetails(ref.current);
        }}
      >
        {/* role="list": Safari drops the list role from unstyled lists. Two by
            two: each tile spans two rows of this grid (subgrid): its art in
            the first (1fr, so the art rows share whatever height the card
            leaves and the tiles end flush with it), its name and tagline in
            the second, so the names in a row line up however the taglines wrap. */}
        <ol role="list" className="grid grid-cols-2 grid-rows-[1fr_auto_1fr_auto] gap-2">
          {items.map((item, i) => {
            const current = samePath(item.href, pathname);
            const tone = item.tone ?? PLAIN;
            return (
              <li key={item.href} className="row-span-2 grid grid-rows-subgrid">
                <HashLink
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  {...(item.track ? trackData(item.track.event, item.track.params) : {})}
                  // onNavigate, not onClick: a Ctrl/Cmd-click opens a new tab
                  // and should leave this panel open.
                  onNavigate={() => closeDetails(ref.current)}
                  // The current service is outlined, not only tinted. The
                  // tile itself never moves: only its art does.
                  className={`group/item relative isolate row-span-2 grid grid-rows-subgrid rounded-control border-2 p-3 transition-[background-color,box-shadow] hover:shadow-raised ${tone.tile} ${
                    current ? "border-brand forced-colors:border-[Highlight]" : "border-transparent forced-colors:border-[CanvasText]"
                  }`}
                >
                  {item.mark ? (
                    <span aria-hidden="true" className="pointer-events-none absolute -inset-0.5 -z-10 overflow-clip rounded-[inherit]">
                      {item.mark}
                    </span>
                  ) : null}
                  <span aria-hidden="true" className="relative flex flex-col items-start">
                    {item.strip ? (
                      <>
                        <span
                          className={`relative block min-h-14 w-full flex-1 overflow-clip rounded-control shadow-card ring-1 ${tone.frame ?? "ring-line"}`}
                        >
                          {item.strip}
                        </span>
                        <span className="absolute bottom-1.5 left-1.5 flex">{item.icon}</span>
                      </>
                    ) : (
                      item.icon
                    )}
                  </span>
                  <span className="min-w-0 self-start">
                    <span className="flex items-center gap-2">
                      <span className={`min-w-0 flex-1 font-heading underline-offset-4 group-hover/item:underline ${tone.name}`}>
                        <span className={`mr-1.5 tabular-nums ${tone.muted}`}>{i + 1}.</span>
                        {item.name}
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className={`size-4 shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100 motion-safe:transition-[opacity,translate] motion-safe:group-hover/item:translate-x-0.5 ${tone.arrow}`}
                      />
                    </span>
                    <span className={`mt-0.5 block text-sm font-normal text-pretty ${tone.muted}`}>{item.tagline}</span>
                  </span>
                </HashLink>
              </li>
            );
          })}
        </ol>
        {aside}
      </div>
    </details>
  );
}
