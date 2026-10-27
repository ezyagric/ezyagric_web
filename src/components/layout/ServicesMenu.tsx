"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";

export type ServiceItem = {
  href: string;
  name: string;
  tagline: string;
  /** Server-rendered icon (IconCircle), so the icon set stays out of the client bundle. */
  icon: ReactNode;
};

/** "/ka-ezy/" and "/ka-ezy" are the same page. */
function samePath(a: string, b: string): boolean {
  return a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
}

function closeDetails(details: HTMLDetailsElement | null) {
  if (details) details.open = false;
}

/**
 * The header's services dropdown, labelled "Our services" (lg and up): the four
 * services as rows on the left (an arrow slides in on hover) and, beside
 * them, the Ka-Ezy card (`aside`). It is a <details> element,
 * so it opens and closes with JavaScript off. With JavaScript on, it also
 * closes on Escape (focus goes back to its button), on a click or tap
 * outside, when keyboard focus moves on past it, and after a service is
 * chosen. On a service page, the button and that service are highlighted.
 */
export function ServicesMenu({
  label,
  icon,
  items,
  aside,
}: {
  label: string;
  /** Server-rendered icon before the label. */
  icon?: ReactNode;
  items: ServiceItem[];
  /** Server-rendered column beside the services (the Ka-Ezy card). */
  aside?: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const onServicePage = items.some((item) => samePath(item.href, pathname));

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
    <details
      ref={ref}
      className="group relative"
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
          // A plain click on any link in the Ka-Ezy card (same-page jumps such
          // as /ka-ezy/#try-ka-ezy don't change the pathname) closes the panel.
          const plain = !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
          if (plain && (event.target as Element).closest("a")) closeDetails(ref.current);
        }}
      >
        <ul className="grid content-start gap-1">
          {items.map((item) => {
            const current = samePath(item.href, pathname);
            return (
              <li key={item.href}>
                <Link
                  prefetch={false}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  // onNavigate, not onClick: a Ctrl/Cmd-click opens a new tab
                  // and should leave this panel open.
                  onNavigate={() => closeDetails(ref.current)}
                  // The current service is outlined, not only tinted (the
                  // tint alone is the hover look and too faint to tell).
                  className={`group/item flex items-center gap-3 rounded-control border-2 p-3 transition-colors hover:bg-brand-soft ${
                    current ? "border-brand bg-brand-soft" : "border-transparent"
                  }`}
                >
                  {item.icon}
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-title">{item.name}</span>
                    <span className="mt-0.5 block text-sm font-normal text-muted">{item.tagline}</span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-link opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-visible/item:opacity-100 motion-safe:transition-[opacity,transform] motion-safe:group-hover/item:translate-x-0.5"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        {aside}
      </div>
    </details>
  );
}
