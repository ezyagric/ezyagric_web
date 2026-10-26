import Link from "next/link";
import type { ReactNode } from "react";
import { playStoreUrl } from "@/lib/links";

// Brand guide: primary buttons are a green fill with a white SemiBold label
// and an 8px radius; secondary buttons are a Primary Blue outline on white.
const VARIANTS = {
  primary: "bg-leaf-700 text-white hover:bg-leaf-800",
  secondary: "border-2 border-brand-700 bg-white text-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  whatsapp: "bg-leaf-700 text-white hover:bg-leaf-800",
  light: "bg-white text-ink hover:bg-brand-50",
  // White outline, for buttons on the blue-green gradient or navy.
  outlineLight: "border-2 border-white text-white hover:bg-white/10",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

/**
 * The button look as a class string, for the few real <button>s (the cookie
 * banner) so they match the links below. Minimum height 48px.
 */
export function buttonClasses(variant: ButtonVariant = "primary", size: "md" | "lg" = "md"): string {
  const sizing = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-12 px-5 text-base";
  return `inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors ${sizing} ${VARIANTS[variant]}`;
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

/** Official "Get it on Google Play" badge linking to the farmer app. */
export function PlayBadge({
  campaign,
  medium,
  className = "h-14 w-auto",
}: {
  campaign: string;
  medium: string;
  className?: string;
}) {
  return (
    <a
      href={playStoreUrl(campaign, medium)}
      target="_blank"
      rel="noopener"
      data-track="get_app_click"
      data-track-product={campaign}
      data-track-position={medium}
      className="inline-block rounded-lg"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static SVG badge */}
      <img
        src="/images/brand/google-play-badge.svg"
        alt="Get it on Google Play"
        width={180}
        height={53}
        className={className}
      />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
