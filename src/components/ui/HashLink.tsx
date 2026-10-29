"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AnchorHTMLAttributes, ReactNode } from "react";

/** "/ka-ezy/" and "/ka-ezy" are the same page. */
export function samePath(a: string, b: string): boolean {
  return a.replace(/\/+$/, "") === b.replace(/\/+$/, "");
}

/**
 * An internal link that jumps natively when it points at a section of the
 * page it is on (/ezyagric-business/#ezycredits on that page). The browser's
 * own fragment navigation sets :target (the business page's chapter tabs and
 * index light up from it) and moves keyboard focus to the section; next/link
 * scrolls there but leaves both behind. Anywhere else it is a next/link
 * (prefetch off, as everywhere on the site); `onNavigate` only applies then.
 */
export function HashLink({
  href,
  onNavigate,
  children,
  ...rest
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  onNavigate?: () => void;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const hashAt = href.indexOf("#");
  if (hashAt === 0 || (hashAt > 0 && samePath(href.slice(0, hashAt), pathname))) {
    return (
      <a href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link prefetch={false} href={href} onNavigate={onNavigate} {...rest}>
      {children}
    </Link>
  );
}
