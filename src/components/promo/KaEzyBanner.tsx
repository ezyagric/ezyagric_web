import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite, type IconName, type Product } from "@/lib/content";
import { DemoVideoPlayer } from "@/components/product/DemoVideoPlayer";
import { Highlight } from "@/components/home/parts";
import { KAEZY_ASK_ID, hasTryIt } from "@/components/product/kaezy/TryKaEzy";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { RichText } from "@/components/ui/RichText";
import { StoreBadges } from "@/components/ui/StoreBadges";

/** Ka-Ezy's face, for small round avatars. */
export const KAEZY_AVATAR = "/images/products/ka-ezy-avatar.webp";

/** The footer's store badges carry this id, a jump target on every page for links from outside the site. */
export const GET_THE_APP_ID = "get-the-app";

/** The banner's id on the Ka-Ezy page, where the menus' "See Ka-Ezy in action" points. */
export const KAEZY_BANNER_ID = "kaezy-banner";

/** Each banner's "Download the App" step carries this id: `${banner id}-app`. */
function appStepId(bannerId: string): string {
  return `${bannerId}-app`;
}

/**
 * "Try Ka-Ezy": the demo on the Ka-Ezy page when it is shown, else the Ka-Ezy
 * page. `page` is the product page the link sits on: on the Ka-Ezy page itself
 * the demo is a jump down the page, and without the demo (production) the
 * link goes to the "Download the App" step of the banner under the hero
 * instead of reloading the same page (its store badges carry the Ka-Ezy
 * campaign, so installs from it still count for Ka-Ezy).
 */
export function kaezyTryHref(page?: string): string {
  const to = targets();
  if (page !== "ka-ezy") return to.try;
  return to.tryOnSite ? "#try-ka-ezy" : `#${appStepId(KAEZY_BANNER_ID)}`;
}

/**
 * "Ask Ka-Ezy": like kaezyTryHref, but straight to the Ka-Ezy window, where
 * Farm Expert opens with the cursor in its question box.
 */
export function kaezyAskHref(page?: string): string {
  const to = targets();
  if (!to.tryOnSite) return kaezyTryHref(page);
  return page === "ka-ezy" ? `#${KAEZY_ASK_ID}` : `/ka-ezy/#${KAEZY_ASK_ID}`;
}

/**
 * The one "Try Ka-Ezy" button, reused wherever the site invites people to try
 * Ka-Ezy (home hero, this banner, FAQ answers and help cards, the Ka-Ezy
 * page): always the same label and robot icon, going to kaezyTryHref(), with
 * the green fill unless a FAQ answer lists it second. `position` tells the
 * clicks apart in analytics.
 */
export function TryKaEzyButton({
  position,
  page,
  variant = "primary",
  size = "md",
  className = "",
}: {
  position: string;
  /** The product page it sits on, if any (see kaezyTryHref). */
  page?: string;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  className?: string;
}) {
  return (
    <ButtonLink
      href={kaezyTryHref(page)}
      variant={variant}
      size={size}
      track="kaezy_try_click"
      trackProps={{ position }}
      className={`whitespace-nowrap ${className}`}
    >
      <Icon name="bot" className="size-5 shrink-0" />
      {getSite().kaezyBanner.try.title}
    </ButtonLink>
  );
}

/**
 * "Pay for Ka-Ezy": the hire section on the Ka-Ezy page when it is shown,
 * else its price cards. On the Ka-Ezy page itself (`page`), a jump down it.
 */
export function kaezyPayHref(page?: string): string {
  return onKaezyPage(targets().pay, page);
}

/** "See Ka-Ezy in action": the demo video in the Ka-Ezy page's banner. On that page (`page`), a jump down it. */
export function kaezyWatchHref(page?: string): string {
  return onKaezyPage(targets().watch, page);
}

/** True when this build shows the Ka-Ezy demo (the "Ask Ka-Ezy, then hire it" section). */
export function kaezyOnSite(): boolean {
  return targets().tryOnSite;
}

/** A link into the Ka-Ezy page, as just its #hash when it sits on that page. */
function onKaezyPage(href: string, page?: string): string {
  return page === "ka-ezy" && href.startsWith("/ka-ezy/#") ? href.slice("/ka-ezy/".length) : href;
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
 * three-step tap path on the gradient itself (no card): 1 Try Ka-Ezy, 2 Pay,
 * 3 Download the App. Placed at key
 * points across the site (home page, every service page, the 404 page), on
 * the signature gradient so it stands apart from the bands around it. `id`
 * must be unique on the page.
 *
 * From lg the video stands on the left, as tall as the heading and the steps
 * beside it: the label above it lines up with "Meet Ka-Ezy", and its bottom
 * edge with the foot of the steps (the video is at least its 9:16 height and
 * stretches when the steps run taller, e.g. a wrapped title).
 */
export function KaEzyBanner({
  id,
  position,
  page,
  intro,
}: {
  id: string;
  position: string;
  page?: string;
  /** This page's line under the title, if not the site's (EzyAgric Business: what your farmers get). */
  intro?: string;
}) {
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
          <p className="mt-2 text-lg text-pretty text-on-inverse">
            <RichText text={intro ?? copy.intro} />
          </p>
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

        {/* The three steps as a tap path on the band itself, as on the product
            pages' "How it works": a numbered disc per step (step 1 lit green
            like the video's play button, the others glass), joined by a fading
            line. Phones and sm: down the page, each disc beside its text. From
            md: across, one column per step; each step spans the list's four
            rows (subgrid: disc, title, text, action), so the titles, texts and
            actions line up across the three. Every action is 48px tall and
            starts on its text's left edge. Everything sits on the band, so its
            white focus ring applies (globals.css).
            role="list": Safari drops the list role from unstyled lists. */}
        <ol
          role="list"
          className={`self-end md:grid md:grid-cols-3 md:grid-rows-[repeat(4,auto)] md:gap-x-6 ${
            video ? "lg:col-start-2 lg:row-start-2" : ""
          }`}
        >
          <Step n={1} title={copy.try.title} text={to.tryOnSite ? copy.try.text : copy.try.appText} lit>
            {/* The site's one Try Ka-Ezy button, edged in white: its green is the band's own green end. */}
            <TryKaEzyButton position={position} page={page} className="border-2 border-on-inverse" />
          </Step>
          <Step n={2} title={copy.pay.title} text={copy.pay.text}>
            <ButtonLink
              href={to.pay}
              variant="glass"
              track="kaezy_banner_click"
              trackProps={trackProps("pay")}
              className="whitespace-nowrap"
            >
              <Icon name="wallet" className="size-5 shrink-0" />
              {copy.pay.link}
              <span className="sr-only">: {copy.pay.title}</span>
            </ButtonLink>
          </Step>
          <Step id={appStepId(id)} n={3} title={copy.app.title} text={copy.app.text} last>
            {/* Side by side where the column allows (about 320px), else App Store
                over Google Play (flex-wrap keeps Apple's order; never reorder).
                onDark: the "coming soon" line is white on the band. */}
            <StoreBadges campaign="ka-ezy" medium={position} size="md" onDark />
          </Step>
        </ol>
      </div>
    </Section>
  );
}

/**
 * One stop on the tap path: its number in a disc (lit green with a white
 * edge for the step to take first, glass for the others), a fading line on
 * to the next disc, then its title, text and action in white. Phones and sm:
 * the disc beside the text, the line running down. From md: the disc heads
 * the column, the line runs across the gap, and the title, text and action
 * join the list's rows (md:contents into the subgrid). The step a link
 * jumps to (#kaezy-banner-app, e.g. Try Ka-Ezy on the Ka-Ezy page without
 * the demo) lights its disc like step 1. Nothing moves.
 */
function Step({
  id,
  n,
  title,
  text,
  lit = false,
  last = false,
  children,
}: {
  id?: string;
  n: number;
  title: string;
  text: string;
  /** The step to take first: its disc lit green. */
  lit?: boolean;
  /** The end of the path: no line on. */
  last?: boolean;
  children: ReactNode;
}) {
  return (
    <li
      id={id}
      className={`group/step relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 md:row-span-4 md:grid-cols-1 md:grid-rows-subgrid md:pb-0 ${
        last ? "" : "pb-8"
      }`}
    >
      {last ? null : (
        // On to the next disc, 8px clear of both ripples (outline-8): down
        // below md (top-16 = disc 48 + ripple 8 + 8; bottom-4 = the li's pb-8
        // less the next ripple's 8, less 8), across the 24px gap from md
        // (left-16, -right-2). Forced colours drop the fade; CanvasText keeps it.
        <span
          aria-hidden="true"
          className="absolute top-16 bottom-4 left-6 w-0.5 -translate-x-1/2 rounded-pill bg-linear-to-b from-on-inverse/70 to-on-inverse/15 forced-colors:bg-[CanvasText] md:top-6 md:-right-2 md:bottom-auto md:left-16 md:h-0.5 md:w-auto md:translate-x-0 md:-translate-y-1/2 md:bg-linear-to-r"
        />
      )}
      {/* The tap. Screen readers get the number from the heading. Glass is a
          navy tint: a white tint would pull white text under 4.5:1 on the
          band's green end. The ripple (outline) is dropped in forced colours. */}
      <span
        aria-hidden="true"
        className={`flex size-12 items-center justify-center rounded-full text-xl/none font-heading text-on-inverse tabular-nums outline-8 forced-colors:outline-none ${
          lit
            ? "border-2 border-on-inverse bg-primary outline-on-inverse/20"
            : "border border-on-inverse/40 bg-inverse/25 outline-on-inverse/10 group-target/step:border-2 group-target/step:border-on-inverse group-target/step:bg-primary group-target/step:outline-on-inverse/20"
        }`}
      >
        {n}
      </span>
      {/* Beside the disc below md; from md its children join the list's rows. */}
      <div className="min-w-0 md:contents">
        <h3 className="pt-2.5 text-lg font-heading text-balance text-on-inverse md:mt-4 md:pt-0">
          <span className="sr-only">Step {n}: </span>
          {title}
        </h3>
        {/* Full white (tinted whites fail on the green end). A size smaller
            from md to xl, where the columns are narrowest. Highlight keeps
            "Ka-Ezy" and "UGX 5,000" whole, a shade bolder. */}
        <p className="mt-1 text-base text-pretty text-on-inverse md:text-sm xl:text-base">
          <Highlight text={text} className="font-label" />
        </p>
        <div className="mt-4">{children}</div>
      </div>
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
 * The Ka-Ezy card beside the services in the desktop "Farmer Services" menu: his
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
