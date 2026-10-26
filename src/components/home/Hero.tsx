import Image from "next/image";
import { getSite, isVisible, visible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { ButtonLink, PlayBadge } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText } from "@/components/ui/Pending";
import { PhoneFrame } from "@/components/ui/PhoneFrame";

/**
 * Home hero. On a 360x740 phone the headline, subline and Play badge sit
 * above the fold; the phone screenshot follows below at a modest size.
 */
export function Hero() {
  const { hero, contact } = getSite();
  const whatsapp = contact.whatsapp;

  return (
    <section
      aria-labelledby="hero-title"
      className="overflow-hidden bg-linear-to-b from-brand-50 to-white"
    >
      <Container className="grid items-center gap-10 pt-8 pb-14 sm:pt-14 sm:pb-20 lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:py-20">
        <div>
          <p className="text-sm font-bold tracking-wider text-brand-700 uppercase">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-2 text-4xl font-extrabold tracking-tight text-balance text-ink sm:text-5xl lg:text-6xl"
          >
            {hero.headline}
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-muted sm:text-xl">
            {hero.subline}
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
                <Icon name="message-circle" className="size-5 text-whatsapp" />
                Chat on WhatsApp
              </ButtonLink>
            ) : null}
          </div>

          <ul className="mt-6 space-y-2 text-base text-muted">
            {visible(hero.smallPrint).map((claim) => (
              <li key={claim.text} className="flex items-start gap-2">
                <Icon name="check-circle" className="mt-0.5 size-5 shrink-0 text-leaf-700" />
                <span>
                  <ClaimText claim={claim} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* The mascot overlaps the phone's left edge from sm up; padding on
            the wrapper makes room for it, so nothing overflows sideways. */}
        <div className="relative isolate mx-auto w-fit sm:pl-24 lg:pl-28">
          <div
            aria-hidden="true"
            className="absolute top-1/4 right-0 -z-10 aspect-square w-64 rounded-full bg-brand-100/70 sm:w-80"
          />
          <PhoneFrame
            image={hero.screenshot}
            preload
            className="w-52 sm:w-64 lg:w-72"
            sizes="(min-width: 1024px) 288px, (min-width: 640px) 256px, 208px"
          />
          <Image
            src={hero.mascot.src}
            alt={hero.mascot.alt}
            width={hero.mascot.width}
            height={hero.mascot.height}
            sizes="(min-width: 1024px) 176px, 160px"
            className="absolute bottom-6 left-0 hidden h-auto w-40 drop-shadow-xl sm:block lg:w-44"
          />
        </div>
      </Container>
    </section>
  );
}
