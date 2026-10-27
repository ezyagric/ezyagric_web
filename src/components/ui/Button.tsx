import Link from "next/link";
import type { ReactNode } from "react";

// Brand guide: primary buttons are a green fill with a white SemiBold label;
// secondary buttons are a blue outline on white. Corners come from the theme's
// rounded-button: pills in the default theme (the EzyAgric team's choice,
// 26 Oct 2026), and the guide's 8px in the ezyagric-guide theme.
const PRIMARY = "bg-primary text-on-primary hover:bg-primary-hover";
const VARIANTS = {
  primary: PRIMARY,
  secondary: "border-2 border-secondary bg-canvas text-secondary hover:bg-brand-soft",
  // WhatsApp buttons share the primary look (the theme decides it).
  whatsapp: PRIMARY,
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/**
 * The button look as a class string, for the few real <button>s (the cookie
 * banner) so they match the links below. Minimum height 48px.
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: "md" | "lg" = "md"): string {
  const sizing = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-12 px-5 text-base";
  return `inline-flex items-center justify-center gap-2 rounded-button font-label transition-colors ${sizing} ${VARIANTS[variant]}`;
}

/**
 * A link styled as a button (every CTA on this site navigates somewhere).
 * `track` names the analytics event; it is emitted as data-track so the
 * analytics script can pick it up once a provider is chosen.
 */
export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
  track,
  trackProps,
  size = "md",
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  className?: string;
  track?: string;
  trackProps?: Record<string, string>;
  size?: "md" | "lg";
}) {
  const external = /^(https?:|mailto:|tel:)/.test(href);
  const classes = `${buttonClasses(variant, size)} ${className}`;
  const data = {
    "data-track": track,
    ...(trackProps
      ? Object.fromEntries(Object.entries(trackProps).map(([k, v]) => [`data-track-${k}`, v]))
      : {}),
  };

  if (external) {
    const newTab = href.startsWith("http");
    return (
      <a
        href={href}
        className={classes}
        {...data}
        {...(newTab ? { target: "_blank", rel: "noopener" } : {})}
      >
        {children}
        {newTab ? <span className="sr-only"> (opens in a new tab)</span> : null}
      </a>
    );
  }
  return (
    <Link prefetch={false} href={href} className={classes} {...data}>
      {children}
    </Link>
  );
}
