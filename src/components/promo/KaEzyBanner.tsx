import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite, type IconName, type Product } from "@/lib/content";
import { DemoVideoPlayer } from "@/components/product/DemoVideoPlayer";
import { hasTryIt } from "@/components/product/kaezy/TryKaEzy";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { StoreBadges } from "@/components/ui/StoreBadges";

const AVATAR = "/images/products/ka-ezy-avatar.webp";

/** The footer's store badges carry this id, so "Download the App" works on every page. */
export const GET_THE_APP_ID = "get-the-app";

/** The banner's id on the Ka-Ezy page, where the hero's "Watch" link and the menus' strip point. */
export const KAEZY_BANNER_ID = "kaezy-banner";

/** The phone-shaped Ka-Ezy demo (demoVideos in ka-ezy.yaml): it plays inside the banner. */
function bannerVideo(kaezy: Product | undefined) {
  return kaezy?.demoVideos?.items.find((video) => video.orientation === "portrait");
}

/**
 * Where the Ka-Ezy actions lead on this build. "Try" and "pay" use the
 * Ka-Ezy page's "Ask Ka-Ezy, then hire it" section when it is shown (preview
 * builds, or once it is approved), else the Ka-Ezy page and its price cards.
 */
function targets() {
  const kaezy = getProduct("ka-ezy");
  const onSite = !!kaezy && hasTryIt(kaezy);
  return {
    // The strip (menus) opens the Ka-Ezy page's banner, which plays the demo.
    watch: bannerVideo(kaezy) ? `/ka-ezy/#${KAEZY_BANNER_ID}` : "/#stories",
    try: onSite ? "/ka-ezy/#try-ka-ezy" : "/ka-ezy/",
    pay: onSite ? "/ka-ezy/#hire-ka-ezy" : "/ka-ezy/#pricing",
    app: `#${GET_THE_APP_ID}`,
    tryOnSite: onSite,
  };
}

/**
 * The Ka-Ezy banner: the Ka-Ezy demo video (1 min 24 s), playable right here, beside
 * Try Ka-Ezy, Pay and Download the App. Placed at key points across the site
 * (home page, every service page, the 404 page), on the signature gradient
 * so it stands apart from the bands around it. `id` must be unique on the page.
 */
export function KaEzyBanner({ id, position }: { id: string; position: string }) {
  const { kaezyBanner: copy } = getSite();
  const video = bannerVideo(getProduct("ka-ezy"));
  const to = targets();
  const track = (action: string) => ({
    "data-track": "kaezy_banner_click",
    "data-track-action": action,
    "data-track-position": position,
  });

  return (
    <Section id={id} tone="gradient" labelledBy={`${id}-title`}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="flex size-20 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card shadow-raised sm:size-24">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
          <img src={AVATAR} alt="" width={200} height={178} loading="lazy" className="w-[4.5rem] sm:w-[5.5rem]" />
        </span>
        <div className="max-w-2xl">
          <p className="text-sm text-label-style text-on-inverse">{copy.eyebrow}</p>
          <h2
            id={`${id}-title`}
            className="mt-1 text-3xl font-heading tracking-heading text-balance text-on-inverse sm:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-lg text-pretty text-on-inverse">{copy.intro}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-6">
        {/* See Ka-Ezy in action: the demo plays in place (it downloads only on play). */}
        {video ? (
          <figure className="mx-auto w-full max-w-[15rem] lg:max-w-none">
            <div className="overflow-hidden rounded-card shadow-raised">
              <DemoVideoPlayer src={video.src} poster={video.poster} title={video.title} portrait />
            </div>
            {video.meta ? (
              <figcaption className="mt-2 text-center text-sm text-on-inverse">
                {copy.watch.title} · {video.meta}
              </figcaption>
            ) : null}
          </figure>
        ) : null}

        {/* Three compact rows that share the video's height (lg: one third each). */}
        <ul className="grid gap-4 lg:grid-rows-3">
          <ActionRow
            icon="message-circle"
            color="accent"
            title={copy.try.title}
            text={to.tryOnSite ? copy.try.text : copy.try.appText}
          >
            <BannerLink href={to.try} track={track("try")}>
              {to.tryOnSite ? copy.try.link : copy.try.appLink}
              <span className="sr-only">: {copy.try.title}</span>
            </BannerLink>
          </ActionRow>
          <ActionRow icon="wallet" color="deep" title={copy.pay.title} text={copy.pay.text}>
            <BannerLink href={to.pay} track={track("pay")}>
              {copy.pay.link}
              <span className="sr-only">: {copy.pay.title}</span>
            </BannerLink>
          </ActionRow>
          <ActionRow icon="smartphone" color="brand" title={copy.app.title} text={copy.app.text}>
            <StoreBadges campaign="ka-ezy" medium={position} size="md" className="sm:justify-end" />
          </ActionRow>
        </ul>
      </div>
    </Section>
  );
}

function ActionRow({
  icon,
  color,
  title,
  text,
  children,
}: {
  icon: IconName;
  color: "brand" | "accent" | "deep";
  title: string;
  text: string;
  children: ReactNode;
}) {
  return (
    // One line from sm: icon, title and text, then the action on the right.
    // [&_:focus-visible]:outline-focus: the band's white focus ring would vanish on these white tiles.
    <li className="flex flex-col gap-3 rounded-card bg-card px-5 py-4 text-body shadow-raised sm:flex-row sm:items-center sm:gap-5 [&_:focus-visible]:outline-focus">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <IconCircle name={icon} color={color} />
        <div className="min-w-0">
          <h3 className="text-lg font-heading text-title">{title}</h3>
          <p className="text-base text-pretty text-muted">{text}</p>
        </div>
      </div>
      <div className="shrink-0 pl-16 sm:pl-0">{children}</div>
    </li>
  );
}

function BannerLink({
  href,
  track,
  children,
}: {
  href: string;
  track: Record<string, string>;
  children: ReactNode;
}) {
  return (
    <Link
      prefetch={false}
      href={href}
      {...track}
      className="inline-flex min-h-11 items-center gap-1 rounded-control font-heading whitespace-nowrap text-link hover:underline"
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

/**
 * The one-line Ka-Ezy banner: the same four actions as pills, for the menus.
 * "See Ka-Ezy in action" opens the Ka-Ezy page's banner, where the demo plays.
 */
export function KaEzyStrip({ position, className = "" }: { position: string; className?: string }) {
  const { kaezyBanner: copy } = getSite();
  const to = targets();
  const actions: { key: string; href: string; label: string; icon: IconName }[] = [
    { key: "watch", href: to.watch, label: copy.strip.watch, icon: "play-circle" },
    { key: "try", href: to.try, label: copy.strip.try, icon: "message-circle" },
    { key: "pay", href: to.pay, label: copy.strip.pay, icon: "wallet" },
    { key: "app", href: to.app, label: copy.strip.app, icon: "smartphone" },
  ];

  return (
    <div className={`rounded-card border border-line bg-brand-soft p-3 ${className}`}>
      <p className="flex items-center gap-2 text-base font-heading text-title">
        <span className="flex size-9 shrink-0 items-end justify-center overflow-hidden rounded-full border border-line bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
          <img src={AVATAR} alt="" width={200} height={178} loading="lazy" className="w-8" />
        </span>
        {copy.strip.label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {actions.map((action) => (
          <li key={action.key}>
            <Link
              prefetch={false}
              href={action.href}
              data-track="kaezy_banner_click"
              data-track-action={action.key}
              data-track-position={position}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line bg-card px-3.5 text-sm font-label text-title transition-colors hover:border-secondary hover:text-link"
            >
              <Icon name={action.icon} className="size-4 text-secondary" />
              {action.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
