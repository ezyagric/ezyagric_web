import Image from "next/image";
import { getSite, isVisible, visible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { ButtonLink, PlayBadge } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText } from "@/components/ui/Pending";
import { PhoneFrame } from "@/components/ui/PhoneFrame";
import { CheckDot, Highlight } from "./parts";
import { Wave } from "@/components/ui/Wave";

/** "Farm the Ezy way." with the word Ezy in Vibrant Green (large text, so leaf-500 passes). */
function Headline({ text }: { text: string }) {
  const parts = text.split(/\b(Ezy)\b/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-leaf-500">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * Home hero on pure white (the Ka-Ezy artwork has a white background), with
 * a blue headline and product names in green. On a 360x740 phone the
 * headline, subline and Play badge sit above the fold; Ka-Ezy follows below,
 * and the app screenshot joins him from sm up.
 */
export function Hero() {
  const { hero, contact } = getSite();
  const whatsapp = contact.whatsapp;

  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden bg-white">
      <Container className="grid gap-6 pt-8 pb-1 sm:pt-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-end lg:gap-8 lg:pt-12 lg:pb-6">
        <div className="lg:self-center lg:pb-28">
          <p className="text-sm font-semibold tracking-[0.14em] text-brand-700 uppercase">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-2 text-4xl font-bold tracking-tight text-balance text-brand-700 sm:text-5xl lg:text-6xl"
          >
            <Headline text={hero.headline} />
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-ink sm:text-xl">
            <Highlight text={hero.subline} />
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <PlayBadge campaign="general" medium="hero" />
            {isVisible(whatsapp) ? (
              <ButtonLink
                href={whatsappUrl(whatsapp.number, whatsapp.message)}
                variant="secondary"
                size="lg"
                track="whatsapp_click"
                trackProps={{ position: "hero" }}
              >
                <Icon name="message-circle" className="size-5 text-leaf-700" />
                Chat on WhatsApp
              </ButtonLink>
            ) : null}
          </div>

          <ul className="mt-6 space-y-2 text-base text-muted">
            {visible(hero.smallPrint).map((claim) => (
              <li key={claim.text} className="flex items-start gap-2.5">
                <CheckDot />
                <span>
                  <ClaimText claim={claim} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ka-Ezy, cropped to the figure (the artwork has white margins and
            ends in a flat cut at the legs, which the wave covers). From sm the
            phone overlaps his right side. Nothing tinted sits behind him. */}
        <div className="mx-auto flex items-end lg:mr-0">
          <div className="relative aspect-[640/958] w-40 shrink-0 sm:w-72 lg:w-80 xl:w-[22rem]">
            <Image
              src={hero.mascot.src}
              alt={hero.mascot.alt}
              width={hero.mascot.width}
              height={hero.mascot.height}
              preload
              sizes="(min-width: 1280px) 352px, (min-width: 1024px) 320px, (min-width: 640px) 288px, 160px"
              className="size-full object-cover object-[50%_53.7%]"
            />
          </div>
          {/* Lazy (the default): below sm it is display:none and never fetched. */}
          <div className="relative -ml-12 hidden shrink-0 sm:block lg:-ml-14">
            <PhoneFrame
              image={hero.screenshot}
              className="w-40 lg:w-44 xl:w-48"
              sizes="(min-width: 1280px) 192px, (min-width: 1024px) 176px, 160px"
            />
          </div>
        </div>
      </Container>
      <Wave id="home-hero-wave" className="h-16 sm:h-20 lg:h-28" />
    </section>
  );
}
