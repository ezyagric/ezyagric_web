import Image from "next/image";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import type { Product, Step, StepAction } from "@/lib/content";
import { playStoreUrl } from "@/lib/links";
import { trackData } from "@/lib/track";
import { Highlight } from "@/components/home/parts";
import { kaezyAskHref, kaezyOnSite, kaezyPayHref, kaezyTryHref, kaezyWatchHref } from "@/components/promo/KaEzyBanner";
import { Section, SectionHeader } from "@/components/ui/Container";
import { resolveFaqActions } from "@/components/ui/faqActions";
import { HashLink } from "@/components/ui/HashLink";
import type { BandTone } from "./tones";

// Where the photo goes beside the steps. In the 5/12 column the photo is as
// tall as the steps, so a landscape photo there below lg would show only
// about a third of its width: it stays across the top of the panel (16:9
// from sm) until lg. A portrait photo goes beside the steps from md, and on
// top it stays 4:3 (16:9 would leave a strip of it). Full class strings so
// Tailwind can find them.
const BESIDE = {
  portrait: {
    panel: "md:grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
    box: "aspect-[4/3] md:aspect-auto md:min-h-[26rem]",
    fade: "md:bg-linear-to-r md:from-75%",
    sizes: "(min-width: 768px) 460px, calc(100vw - 32px)",
    list: "md:self-center md:py-10 md:pr-8 md:pl-5 lg:py-12 lg:pr-12 lg:pl-6",
  },
  landscape: {
    panel: "lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
    box: "aspect-[4/3] sm:aspect-video lg:aspect-auto lg:min-h-[26rem]",
    fade: "lg:bg-linear-to-r lg:from-75%",
    sizes: "(min-width: 1024px) 460px, calc(100vw - 32px)",
    list: "lg:self-center lg:py-12 lg:pr-12 lg:pl-6",
  },
};

/**
 * How to get started, as one Dark Navy story panel instead of cards: the
 * product's photo from the field on one side, fading into the navy, and the
 * steps on the other as a tap path. Each step is a big green number in a
 * glassy disc with a soft ripple round it (a tap), joined to the next by a
 * line that fades down from green; its title and text sit beside it in
 * white. A step with an `action` is a link to where the visitor takes it
 * (Google Play, the Ka-Ezy demo): the whole step is the target, lit on
 * hover, with the link's label under the text.
 *
 * Phones: the photo across the top of the panel, fading down into the
 * steps. From md (a portrait photo) or lg (a landscape one) the photo takes
 * the left 5/12, as tall as the steps (at least 26rem), cropped round its
 * `focus`, fading to the right.
 * Without a photo the steps fill the panel, two columns from md and no
 * joining lines.
 */
export function Steps({ product, tone }: { product: Product; tone: BandTone }) {
  const { steps, photo } = product;
  const image = photo?.image;
  const beside = image ? BESIDE[image.width > image.height ? "landscape" : "portrait"] : null;

  return (
    <Section id="how-it-works" tone={tone} labelledBy="how-it-works-title">
      <SectionHeader id="how-it-works-title" eyebrow="How it works" title={steps.title} wide />
      <div
        className={`relative isolate overflow-hidden rounded-media bg-inverse text-on-inverse shadow-raised ${
          beside ? beside.panel : ""
        }`}
      >
        {/* A soft green glow behind the steps (decoration). */}
        <span
          aria-hidden="true"
          className="absolute -right-24 -bottom-24 -z-10 size-80 rounded-full bg-accent-bright/15 blur-3xl"
        />
        {image && beside ? (
          <div className={`relative ${beside.box}`}>
            {/* Lazy-loaded: always well below the fold. */}
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes={beside.sizes}
              className="object-cover"
              style={image.focus ? { objectPosition: image.focus } : undefined}
            />
            {/* Into the navy: downwards on top of the steps, to the right beside them. */}
            <span
              aria-hidden="true"
              className={`absolute inset-0 bg-linear-to-b from-transparent from-60% to-inverse ${beside.fade}`}
            />
          </div>
        ) : null}
        <StepList items={steps.items} beside={beside?.list ?? null} product={product} />
      </div>
    </Section>
  );
}

/**
 * Where a step's link goes, its label, and the same analytics as the site's
 * other links there. Without the Ka-Ezy demo on this build, "try" plays the
 * banner's demo video and "ask" goes to the Ka-Ezy plans (`appLabel`). The
 * other targets resolve as FAQ buttons do; null when hidden on this build.
 * Also used by the home journey's steps: `page` is the page the link sits on
 * (the product's own page by default; null on the home page), so the Ka-Ezy
 * links jump within the Ka-Ezy page or go to it.
 */
export function actionLink(
  action: StepAction,
  product: Product,
  { position = "how-it-works", page: on }: { position?: string; page?: string | null } = {},
) {
  const page = on === undefined ? product.slug : (on ?? undefined);
  const onSite = kaezyOnSite();
  const appLabel = action.appLabel ?? action.label;
  switch (action.kind) {
    case "get-app":
      return {
        href: playStoreUrl(product.cta.campaign, position),
        label: action.label,
        external: true,
        track: {
          "data-track": "get_app_click",
          "data-track-product": product.cta.campaign,
          "data-track-position": position,
          "data-track-store": "google_play",
        },
      };
    case "try-kaezy":
      return onSite
        ? {
            href: kaezyTryHref(page),
            label: action.label,
            external: false,
            track: { "data-track": "kaezy_try_click", "data-track-position": position },
          }
        : {
            href: kaezyWatchHref(page),
            label: appLabel,
            external: false,
            track: { "data-track": "kaezy_banner_click", "data-track-action": "watch", "data-track-position": position },
          };
    case "ask-kaezy":
      return onSite
        ? {
            href: kaezyAskHref(page),
            label: action.label,
            external: false,
            track: { "data-track": "kaezy_try_click", "data-track-position": `${position}-ask` },
          }
        : {
            href: kaezyPayHref(page),
            label: appLabel,
            external: false,
            track: { "data-track": "kaezy_banner_click", "data-track-action": "pay", "data-track-position": position },
          };
    default: {
      // pay-kaezy, whatsapp, call, page and portal go where the FAQ buttons do.
      const [to] = resolveFaqActions([{ kind: action.kind, label: action.label, href: action.href }]);
      if (!to || !("href" in to)) return null;
      return {
        href: to.href,
        label: action.label,
        external: to.href.startsWith("http"),
        track: trackData("step_action_click", {
          action: action.kind,
          product: product.slug,
          position,
          ...(action.href ? { target: action.href } : {}),
        }),
      };
    }
  }
}

/**
 * A step's link: a page of the site through HashLink (a section of this page
 * jumps natively), anything else as a plain link, in a new tab when it
 * leaves the site.
 */
export function StepActionLink({
  link,
  className,
  children,
}: {
  link: NonNullable<ReturnType<typeof actionLink>>;
  className: string;
  children: ReactNode;
}) {
  if (link.href.startsWith("/") || link.href.startsWith("#")) {
    return (
      <HashLink href={link.href} className={className} {...link.track}>
        {children}
      </HashLink>
    );
  }
  return (
    <a href={link.href} className={className} {...(link.external ? { target: "_blank", rel: "noopener" } : {})} {...link.track}>
      {children}
      {link.external ? <span className="sr-only"> (opens in a new tab)</span> : null}
    </a>
  );
}

/** `beside`: the list's classes when it sits beside (or under) a photo, joined by lines. */
function StepList({ items, beside, product }: { items: Step[]; beside: string | null; product: Product }) {
  const joined = beside !== null;
  return (
    // role="list": Safari drops the list role from unstyled lists.
    <ol
      role="list"
      className={`relative px-5 pb-8 sm:px-8 ${
        joined
          ? `pt-2 ${beside}`
          : "pt-8 sm:py-10 md:grid md:grid-cols-2 md:gap-x-10 md:gap-y-8 lg:px-12"
      }`}
    >
      {items.map((step, i) => {
        const last = i === items.length - 1;
        const link = step.action ? actionLink(step.action, product) : null;
        return (
          // flow-root: the link wrapper's -m-3 stays inside the li instead of
          // collapsing through it (which would lift the li, and the joining
          // line with it, 12px into the disc's ripple).
          <li key={step.title} className={`relative flow-root ${last ? "" : joined ? "pb-8" : "pb-8 md:pb-0"}`}>
            {joined && !last ? (
              // Down to the next disc, clear of both ripples.
              <span
                aria-hidden="true"
                className="absolute top-[4.25rem] bottom-2 left-7 w-0.5 -translate-x-1/2 rounded-pill bg-linear-to-b from-accent-bright/70 to-on-inverse/10 sm:top-[4.75rem] sm:left-8"
              />
            ) : null}
            {/* With a link, the link's ::after covers the whole step; -m-3 p-3
                gives the hover tint and the focus ring room round it. */}
            <div
              className={`relative grid grid-cols-[3.5rem_minmax(0,1fr)] gap-x-4 sm:grid-cols-[4rem_minmax(0,1fr)] sm:gap-x-5 ${
                link ? "group -m-3 rounded-card p-3 transition-colors hover:bg-on-inverse/5 has-focus-visible:bg-on-inverse/5" : ""
              }`}
            >
              {/* The tap: a glassy disc with a ripple (ring and outline), lit
                  green when the step is a link and hovered. Screen readers get
                  the number from the heading. */}
              <span
                aria-hidden="true"
                className="relative flex size-14 items-center justify-center rounded-full bg-on-inverse/10 text-2xl font-heading text-accent-bright tabular-nums ring-1 ring-on-inverse/25 outline-8 outline-on-inverse/5 transition-colors group-hover:bg-accent-bright/20 group-hover:ring-accent-bright/70 sm:size-16 sm:text-3xl"
              >
                {i + 1}
              </span>
              <div className="min-w-0 pt-2.5 sm:pt-3">
                <h3 className="text-xl font-heading text-balance text-on-inverse">
                  <span className="sr-only">Step {i + 1}: </span>
                  {step.title}
                </h3>
                {/* On navy, product names are white and a ==marked== phrase's
                    stroke turns the accessible green (white on it is 5.1:1). */}
                <p className="mt-1 text-base text-pretty text-on-inverse/85 [&_mark]:bg-[linear-gradient(transparent_55%,var(--color-accent)_55%)] [&_mark]:text-on-inverse">
                  <Highlight text={step.text} className="font-heading text-on-inverse" />
                </p>
                {link ? (
                  // White, underlined in green (the green alone is too close
                  // to 4.5:1 on the hover tint). The focus ring is drawn
                  // round the whole step, on the ::after.
                  <StepActionLink
                    link={link}
                    className="mt-2 inline-flex items-center gap-1.5 text-base font-label text-on-inverse underline decoration-accent-bright decoration-2 underline-offset-4 after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-offset-2 focus-visible:after:outline-focus-inverse"
                  >
                    {link.label}
                    <ArrowRight
                      aria-hidden="true"
                      className="size-4 shrink-0 text-accent-bright transition-transform motion-safe:group-hover:translate-x-0.5"
                    />
                  </StepActionLink>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
