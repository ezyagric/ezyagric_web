"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

/**
 * The phone menu. It is a <details> element so it still opens and closes
 * with JavaScript off; with JavaScript on, it also closes after a link is
 * tapped (the layout stays mounted across client-side navigations, so the
 * menu would otherwise stay open over the next page) and on Escape.
 */
export function MobileMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  // Close on a real page change, not on mount: a visitor may have opened
  // the native <details> before the scripts arrived.
  const shownPath = useRef(pathname);
  useEffect(() => {
    if (shownPath.current === pathname) return;
    shownPath.current = pathname;
    if (ref.current) ref.current.open = false;
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && ref.current?.open) {
        ref.current.open = false;
        ref.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <details
      ref={ref}
      className="group relative lg:hidden"
      onClick={(event) => {
        // Same-page hash links (/#contact-us) don't change the pathname.
        if ((event.target as Element).closest("a") && ref.current) ref.current.open = false;
      }}
    >
      <summary
        className="flex size-12 cursor-pointer list-none items-center justify-center rounded-button text-body hover:bg-brand-soft [&::-webkit-details-marker]:hidden"
        aria-label="Menu"
      >
        <Menu className="size-6 group-open:hidden" aria-hidden="true" />
        <X className="hidden size-6 group-open:block" aria-hidden="true" />
      </summary>
      {children}
    </details>
  );
}
