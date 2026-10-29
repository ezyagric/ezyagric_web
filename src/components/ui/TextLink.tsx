"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { trackData } from "@/lib/track";
import { HashLink, samePath } from "./HashLink";

/**
 * A link inside a passage of copy (from [words](target) in content/*.yaml),
 * underlined in the text's flow. On dark bands it turns white with a green
 * underline (globals.css, a.inline-link). Copy shown on several pages never
 * links a page to itself: there the words stay plain. Other pages go through
 * HashLink (a section of this page jumps natively); https opens in a new tab.
 * Analytics: inline_link_click with the copy's target ("/agrishop/",
 * "whatsapp") and the section it sits in (filled in by the click listener).
 */
export function TextLink({ href, linkTarget, children }: { href: string; linkTarget: string; children: ReactNode }) {
  const pathname = usePathname();
  if (href.startsWith("/") && !href.includes("#") && samePath(href, pathname)) return <>{children}</>;

  const className =
    "inline-link font-label text-link underline decoration-1 underline-offset-4 transition-colors hover:decoration-2";
  const data = trackData("inline_link_click", { target: linkTarget, section: "" });
  if (href.startsWith("/")) {
    return (
      <HashLink href={href} className={className} {...data}>
        {children}
      </HashLink>
    );
  }
  const newTab = href.startsWith("http");
  return (
    <a href={href} className={className} {...data} {...(newTab ? { target: "_blank", rel: "noopener" } : {})}>
      {children}
      {newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}
