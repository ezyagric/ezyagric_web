import Link from "next/link";
import type { ReactNode } from "react";
import { playStoreUrl } from "@/lib/links";

const VARIANTS = {
  primary: "bg-brand-700 text-white hover:bg-brand-900",
  secondary: "border-2 border-brand-700 bg-white text-brand-700 hover:bg-brand-50",
  ghost: "text-brand-700 hover:bg-brand-50",
  whatsapp: "bg-whatsapp text-white hover:bg-[#0b5f32]",
  light: "bg-white text-brand-900 hover:bg-brand-50",
  // No colours of its own: pass a product's ACCENTS[accent].button in
  // className. (Tailwind orders same-property utilities by name, not by
  // class order, so overriding another variant's colours does not work.)
  accent: "",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

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
  const sizing = size === "lg" ? "min-h-14 px-6 text-lg" : "min-h-12 px-5 text-base";
  const classes = `inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors ${sizing} ${VARIANTS[variant]} ${className}`;
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
