import type { ReactNode } from "react";
import { getSite } from "@/lib/content";
import { SHOW_PENDING } from "@/lib/env";
import { playStoreUrl } from "@/lib/links";

// Store badges are official artwork: shown exactly as supplied (no
// recolouring, cropping or animation), at least 40px tall (Apple's minimum),
// with clear space of a quarter of their height around them (gap-3 = 12px at
// 48px). When both appear, the App Store badge comes first (Apple's rule).
const HEIGHT = {
  // 48px: both badges fit side by side on a 360px phone.
  md: "h-12 w-auto",
  lg: "h-12 w-auto sm:h-14",
} as const;

/**
 * The farmer app's store badges. The App Store badge appears once
 * `appStore.url` is set in content/site.yaml. Until then, preview builds show
 * it unlinked (so the team sees the launch look), and production builds show the
 * `comingSoon` line instead (the badge says "Download", so it waits until
 * the iPhone app can be downloaded). `onDark` is for the navy footer and
 * the gradient bands.
 */
export function StoreBadges({
  campaign,
  medium,
  size = "lg",
  onDark = false,
  className = "",
}: {
  campaign: string;
  medium: string;
  size?: keyof typeof HEIGHT;
  onDark?: boolean;
  className?: string;
}) {
  const { appStore } = getSite();
  const height = HEIGHT[size];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {appStore.url ? (
        <StoreLink href={appStore.url} store="app_store" campaign={campaign} medium={medium}>
          <AppStoreImage className={height} />
        </StoreLink>
      ) : SHOW_PENDING ? (
        <AppStoreImage className={height} />
      ) : null}

      <StoreLink href={playStoreUrl(campaign, medium)} store="google_play" campaign={campaign} medium={medium}>
        {/* eslint-disable-next-line @next/next/no-img-element -- static SVG badge */}
        <img
          src="/images/brand/google-play-badge.svg"
          alt="Get it on Google Play"
          width={180}
          height={53}
          className={height}
        />
      </StoreLink>

      {appStore.url || SHOW_PENDING ? null : (
        <p className={`text-sm font-label ${onDark ? "text-on-inverse" : "text-muted"}`}>{appStore.comingSoon}</p>
      )}
    </div>
  );
}

function StoreLink({
  href,
  store,
  campaign,
  medium,
  children,
}: {
  href: string;
  store: "app_store" | "google_play";
  campaign: string;
  medium: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      data-track="get_app_click"
      data-track-product={campaign}
      data-track-position={medium}
      data-track-store={store}
      className="inline-block rounded-control"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

function AppStoreImage({ className }: { className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG badge
    <img
      src="/images/brand/app-store-badge.svg"
      alt="Download on the App Store"
      width={120}
      height={40}
      className={className}
    />
  );
}
