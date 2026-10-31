import type { ReactNode } from "react";
import { Highlight, plainText } from "@/components/home/parts";
import { getSite } from "@/lib/content";
import { playStoreUrl } from "@/lib/links";
import { AppStoreSoonButton, AppStoreSoonDialog } from "./AppStoreSoon";
import { PhoneFrame } from "./PhoneFrame";

// Store badges are official artwork: shown exactly as supplied (no
// recolouring, cropping or animation), at least 40px tall (Apple's minimum),
// with clear space of a quarter of their height around them (gap-3 = 12px at
// 48px). When both appear, the App Store badge comes first (Apple's rule).
const HEIGHT = {
  // 40px, Apple's minimum: for compact places such as the footer.
  sm: "h-10 w-auto",
  // 48px: both badges fit side by side on a 360px phone.
  md: "h-12 w-auto",
  lg: "h-12 w-auto sm:h-14",
  // The Ka-Ezy banner's steps: side by side in its Download column (17rem,
  // 20rem from xl) and on a 375px phone: 40px (120 + 12 + 136 = 268px), 48px
  // where the room allows (sm, and xl: 144 + 12 + 163 = 319px). A block, so
  // the link is exactly the badge's height (no line-box gap below it) and
  // centres on one line with the steps' buttons.
  row: "block h-10 w-auto sm:h-12 md:h-10 xl:h-12",
} as const;

/**
 * The farmer app's store badges. The App Store badge links to the store once
 * `appStore.url` is set in content/site.yaml. Until then it opens the "coming
 * soon" popup (AppStoreSoon below); without JavaScript the `comingSoon` line
 * shows beside it instead. `onDark` is for that line on the navy footer and
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
      ) : (
        <AppStoreSoonButton campaign={campaign} medium={medium}>
          <AppStoreImage className={height} />
        </AppStoreSoonButton>
      )}

      <StoreLink href={playStoreUrl(campaign, medium)} store="google_play" campaign={campaign} medium={medium}>
        <GooglePlayImage className={height} />
      </StoreLink>

      {appStore.url ? null : (
        <noscript>
          <p className={`text-sm font-label ${onDark ? "text-on-inverse" : "text-muted"}`}>
            {plainText(appStore.comingSoon)}
          </p>
        </noscript>
      )}
    </div>
  );
}

/**
 * The App Store badge's popup, once on every page (root layout); gone when
 * `appStore.url` is set. Its Google Play badge is the one thing a visitor can
 * do meanwhile; `position` "popup" tells its installs apart.
 */
export function AppStoreSoon() {
  const { appStore } = getSite();
  if (appStore.url) return null;

  return (
    <AppStoreSoonDialog
      title={<Highlight text={appStore.comingSoon} />}
      note={appStore.popup.note}
      close={appStore.popup.close}
      phone={
        <PhoneFrame
          size="sm"
          image={{ src: "/images/screens/ka-ezy.webp", alt: "", width: 640, height: 1385 }}
          className="w-full"
          sizes="144px"
        />
      }
      playBadge={
        <StoreLink
          href={playStoreUrl("app-store-soon", "popup")}
          store="google_play"
          campaign="app-store-soon"
          medium="popup"
        >
          <GooglePlayImage className={HEIGHT.md} />
        </StoreLink>
      }
    />
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

function GooglePlayImage({ className }: { className: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG badge
    <img
      src="/images/brand/google-play-badge.svg"
      alt="Get it on Google Play"
      width={180}
      height={53}
      className={className}
    />
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
