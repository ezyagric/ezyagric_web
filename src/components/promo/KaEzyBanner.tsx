import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite, type IconName, type Product } from "@/lib/content";
import { DemoVideoPlayer } from "@/components/product/DemoVideoPlayer";
import { hasTryIt } from "@/components/product/kaezy/TryKaEzy";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { StoreBadges } from "@/components/ui/StoreBadges";

/** Ka-Ezy's face, for small round avatars. */
export const KAEZY_AVATAR = "/images/products/ka-ezy-avatar.webp";

/** The footer's store badges carry this id, so "Download the App" works on every page. */
export const GET_THE_APP_ID = "get-the-app";

/** The banner's id on the Ka-Ezy page, where the hero's "Watch" link and the menus' strip point. */
export const KAEZY_BANNER_ID = "kaezy-banner";

/** "Try Ka-Ezy": the demo on the Ka-Ezy page when it is shown, else the Ka-Ezy page. */
export function kaezyTryHref(): string {
  return targets().try;
}

/** "Pay for Ka-Ezy": the hire section on the Ka-Ezy page when it is shown, else its price cards. */
export function kaezyPayHref(): string {
  return targets().pay;
}

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
    tryOnSite: onSite,
  };
}

/**
 * The Ka-Ezy banner: the Ka-Ezy demo video, playable right here, beside a
 * three-step path: 1 Try Ka-Ezy, 2 Pay, 3 Download the App. Placed at key
 * points across the site (home page, every service page, the 404 page), on
 * the signature gradient so it stands apart from the bands around it. `id`
 * must be unique on the page.
 *
 * From lg the video stands on the left, as tall as the heading and the steps
 * beside it: the label above it lines up with "Meet Ka-Ezy", and its bottom
 * edge with the steps card (the video is at least its 9:16 height and
 * stretches when the steps run taller, e.g. a wrapped title).
 */
export function KaEzyBanner({ id, position }: { id: string; position: string }) {
  const { kaezyBanner: copy } = getSite();
  const video = bannerVideo(getProduct("ka-ezy"));
  const to = targets();
  const trackProps = (action: string) => ({ action, position });

  return (
    <Section id={id} tone="gradient" labelledBy={`${id}-title`}>
      <div
        className={`grid grid-cols-1 gap-8 ${video ? "lg:grid-cols-[15rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-12" : ""}`}
      >
        <div className={video ? "lg:col-start-2 lg:row-start-1" : ""}>
          <p className="flex min-h-11 items-center gap-3 text-sm text-label-style text-on-inverse">
            <span className="flex size-11 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card shadow-raised">
              {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
              <img src={KAEZY_AVATAR} alt="" width={200} height={178} loading="lazy" className="w-10" />
            </span>
            {copy.eyebrow}
          </p>
          <h2
            id={`${id}-title`}
            className="mt-3 text-3xl font-heading tracking-heading text-balance text-on-inverse lg:text-4xl"
          >
            {copy.title}
          </h2>
          <p className="mt-2 text-lg text-pretty text-on-inverse">{copy.intro}</p>
        </div>

        {/* See Ka-Ezy in action: the demo plays in place (it downloads only on play). */}
        {video ? (
          <figure className="mx-auto w-full max-w-[13rem] sm:max-w-[15rem] lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:flex lg:max-w-none lg:flex-col">
            <figcaption className="flex min-h-11 items-center justify-center gap-2 text-sm text-label-style text-on-inverse lg:justify-start">
              <Icon name="play-circle" className="size-5" />
              {copy.watch.title}
            </figcaption>
            {/* A soft glow lifts the phone-shaped video off the gradient. */}
            {/* From lg the box fills the rest of the figure, at least 9:16 (240 x 426.7px). */}
            <div className="relative isolate mt-3 lg:min-h-[26.67rem] lg:flex-1">
              <span aria-hidden="true" className="absolute -inset-3 -z-10 rounded-card bg-on-inverse/15 blur-xl" />
              <div className="overflow-hidden rounded-card shadow-raised ring-1 ring-on-inverse/30 lg:absolute lg:inset-0">
                <DemoVideoPlayer
                  src={video.src}
                  poster={video.poster}
                  title={video.title}
                  portrait
                  className="lg:aspect-auto lg:h-full"
                />
              </div>
            </div>
          </figure>
        ) : null}

        {/* The three steps in one white card, numbered in the order a visitor takes them.
            role="list": Safari drops the list role from unstyled lists.
            [&_:focus-visible]:outline-focus: the band's white focus ring would vanish on white. */}
        <ol
          role="list"
          className={`self-end divide-y divide-line overflow-hidden rounded-card bg-card text-body shadow-raised [&_:focus-visible]:outline-focus ${
            video ? "lg:col-start-2 lg:row-start-2" : ""
          }`}
        >
          <Step
            n={1}
            icon="message-circle"
            color="accent"
            title={copy.try.title}
            text={to.tryOnSite ? copy.try.text : copy.try.appText}
            highlight
          >
            <ButtonLink
              href={to.try}
              track="kaezy_banner_click"
              trackProps={trackProps("try")}
              className="w-full whitespace-nowrap sm:w-auto"
            >
              {to.tryOnSite ? copy.try.link : copy.try.appLink}
              <span className="sr-only">: {copy.try.title}</span>
            </ButtonLink>
          </Step>
          <Step n={2} icon="wallet" color="deep" title={copy.pay.title} text={copy.pay.text}>
            <ButtonLink
              href={to.pay}
              variant="secondary"
              track="kaezy_banner_click"
              trackProps={trackProps("pay")}
              className="w-full whitespace-nowrap sm:w-auto"
            >
              {copy.pay.link}
              <span className="sr-only">: {copy.pay.title}</span>
            </ButtonLink>
          </Step>
          <Step n={3} icon="smartphone" color="brand" title={copy.app.title} text={copy.app.text}>
            <StoreBadges campaign="ka-ezy" medium={position} size="md" className="sm:justify-end" />
          </Step>
        </ol>
      </div>
    </Section>
  );
}

function Step({
  n,
  icon,
  color,
  title,
  text,
  highlight = false,
  children,
}: {
  n: number;
  icon: IconName;
  color: "brand" | "accent" | "deep";
  title: string;
  text: string;
  /** The first step a visitor should take, on a soft tint. */
  highlight?: boolean;
  children: ReactNode;
}) {
  return (
    // One line from sm: icon, title and text, then the action on the right.
    <li
      className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-5 sm:px-5 xl:py-5 ${highlight ? "bg-brand-soft" : ""}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-4">
        {/* The step number rides on the icon; screen readers get it from the heading. */}
        <span className="relative shrink-0">
          <IconCircle name={icon} color={color} />
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 flex size-6 items-center justify-center rounded-full bg-card text-xs font-heading text-title shadow-card ring-1 ring-line"
          >
            {n}
          </span>
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-heading text-title">
            <span className="sr-only">Step {n}: </span>
            {title}
          </h3>
          {/* A step smaller from lg to xl, where the card is narrowest beside the video. */}
          <p className="text-base text-pretty text-muted lg:text-sm xl:text-base">{text}</p>
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </li>
  );
}

/** The Ka-Ezy actions in the menus: watch, try and pay (the app has its own badges). */
function menuActions(): { key: string; href: string; label: string; icon: IconName }[] {
  const { kaezyBanner: copy } = getSite();
  const to = targets();
  return [
    { key: "watch", href: to.watch, label: copy.strip.watch, icon: "play-circle" },
    { key: "try", href: to.try, label: copy.strip.try, icon: "message-circle" },
    { key: "pay", href: to.pay, label: copy.strip.pay, icon: "wallet" },
  ];
}

/**
 * The Ka-Ezy card beside the services in the desktop "Our services" menu: his
 * face and line on navy, then the three actions as rows.
 * "See Ka-Ezy in action" opens the Ka-Ezy page's banner, where the demo plays.
 */
export function KaEzyMenuCard({ position }: { position: string }) {
  const { kaezyBanner: copy } = getSite();
  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden rounded-card bg-inverse p-4 text-on-inverse">
      <span aria-hidden="true" className="absolute -top-12 -right-12 -z-10 size-40 rounded-full bg-accent-bright/25" />
      <span className="flex size-14 shrink-0 items-end justify-center overflow-hidden rounded-full bg-card">
        {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
        <img src={KAEZY_AVATAR} alt="" width={200} height={178} loading="lazy" className="w-12" />
      </span>
      <p className="mt-3 text-xs text-label-style text-on-inverse">{copy.eyebrow}</p>
      <p className="mt-1 text-lg leading-snug font-heading text-on-inverse">{copy.strip.label}</p>
      <ul className="mt-auto space-y-1.5 pt-4">
        {menuActions().map((action) => (
          <li key={action.key}>
            <Link
              prefetch={false}
              href={action.href}
              data-track="kaezy_banner_click"
              data-track-action={action.key}
              data-track-position={position}
              className="group/action flex min-h-11 items-center gap-2.5 rounded-control bg-on-inverse/10 px-3 text-sm font-label text-on-inverse transition-colors hover:bg-on-inverse/20"
            >
              <Icon name={action.icon} className="size-4 shrink-0" />
              {action.label}
              <ArrowRight
                aria-hidden="true"
                className="ml-auto size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover/action:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The one-line Ka-Ezy banner for the phone menu: the same actions as pills.
 */
export function KaEzyStrip({ position, className = "" }: { position: string; className?: string }) {
  const { kaezyBanner: copy } = getSite();
  const actions = menuActions();

  return (
    <div className={`rounded-card border border-line bg-brand-soft p-3 ${className}`}>
      <p className="flex items-center gap-2 text-base font-heading text-title">
        <span className="flex size-9 shrink-0 items-end justify-center overflow-hidden rounded-full border border-line bg-card">
          {/* eslint-disable-next-line @next/next/no-img-element -- small static avatar */}
          <img src={KAEZY_AVATAR} alt="" width={200} height={178} loading="lazy" className="w-8" />
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
