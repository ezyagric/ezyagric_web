import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { getProduct, getSite, type IconName } from "@/lib/content";
import { hasDemoVideos } from "@/components/product/DemoVideos";
import { hasTryIt } from "@/components/product/kaezy/TryKaEzy";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { StoreBadges } from "@/components/ui/StoreBadges";

const AVATAR = "/images/products/ka-ezy-avatar.webp";

/** The footer's store badges carry this id, so "Get the app" works on every page. */
export const GET_THE_APP_ID = "get-the-app";

/**
 * Where the four Ka-Ezy actions lead on this build. "Try" and "pay" use the
 * Ka-Ezy page's "Ask Ka-Ezy, then hire it" section when it is shown (preview
 * builds, or once it is approved), else the Ka-Ezy page and its price cards.
 */
function targets() {
  const kaezy = getProduct("ka-ezy");
  const onSite = !!kaezy && hasTryIt(kaezy);
  return {
    watch: kaezy && hasDemoVideos(kaezy) ? "/ka-ezy/#demo-videos" : "/#stories",
    try: onSite ? "/ka-ezy/#try-ka-ezy" : "/ka-ezy/",
    pay: onSite ? "/ka-ezy/#hire-ka-ezy" : "/ka-ezy/#pricing",
    app: `#${GET_THE_APP_ID}`,
    tryOnSite: onSite,
  };
}

/**
 * The Ka-Ezy banner: watch the demos, try Ka-Ezy, pay for it, download the
 * app. Placed at key points across the site (home page, the other service
 * pages, the 404 page), on the signature gradient so it stands apart from
 * the bands around it. `id` must be unique on the page.
 */
export function KaEzyBanner({ id, position }: { id: string; position: string }) {
  const { kaezyBanner: copy } = getSite();
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

      <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ActionCard
          icon="play-circle"
          color="brand"
          title={copy.watch.title}
          text={copy.watch.text}
          link={{ href: to.watch, label: copy.watch.link, track: track("watch") }}
        >
          <Link
            prefetch={false}
            href="/#stories"
            {...track("all_videos")}
            className="inline-flex min-h-11 items-center rounded-control text-sm font-label text-link hover:underline"
          >
            {copy.watch.more}
          </Link>
        </ActionCard>
        <ActionCard
          icon="message-circle"
          color="accent"
          title={copy.try.title}
          text={to.tryOnSite ? copy.try.text : copy.try.appText}
          link={{
            href: to.try,
            label: to.tryOnSite ? copy.try.link : copy.try.appLink,
            track: track("try"),
          }}
        />
        <ActionCard
          icon="wallet"
          color="deep"
          title={copy.pay.title}
          text={copy.pay.text}
          link={{ href: to.pay, label: copy.pay.link, track: track("pay") }}
        />
        <ActionCard icon="smartphone" color="brand" title={copy.app.title} text={copy.app.text}>
          <StoreBadges campaign="ka-ezy" medium={position} size="md" className="mt-auto pt-4" />
        </ActionCard>
      </ul>
    </Section>
  );
}

function ActionCard({
  icon,
  color,
  title,
  text,
  link,
  children,
}: {
  icon: IconName;
  color: "brand" | "accent" | "deep";
  title: string;
  text: string;
  link?: { href: string; label: string; track: Record<string, string> };
  children?: ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-card bg-card p-5 text-body shadow-raised">
      <IconCircle name={icon} color={color} />
      <h3 className="mt-4 text-lg font-heading text-title">{title}</h3>
      <p className="mt-1 text-base text-pretty text-muted">{text}</p>
      {link ? (
        <Link
          prefetch={false}
          href={link.href}
          {...link.track}
          className="mt-auto inline-flex min-h-11 items-center gap-1 self-start rounded-control pt-3 font-heading text-link hover:underline"
        >
          {link.label}
          <span className="sr-only">: {title}</span>
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
      {children}
    </li>
  );
}

/**
 * The one-line Ka-Ezy banner: the same four actions as pills, for the menus
 * and the Ka-Ezy page (where the full banner would repeat the page).
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
