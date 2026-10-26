import { getSite, isVisible, visible } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { ButtonLink, PlayBadge } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText } from "@/components/ui/Pending";
import { CheckDot, Highlight } from "./parts";
import { Wave } from "@/components/ui/Wave";
import { HeroSlider } from "./HeroSlider";

/** "Farm the Ezy way." with the word Ezy in Vibrant Green (large text, so accent-bright passes). */
function Headline({ text }: { text: string }) {
  const parts = text.split(/\b(Ezy)\b/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="text-accent-bright">
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
 * Home hero on the canvas colour (the Ka-Ezy artwork has a white background),
 * with a heading-colour headline and product names in green. On a 360x740 phone the
 * headline, subline and Play badge sit above the fold; the service slider
 * (HeroSlider) follows below, and sits beside the text from lg up.
 */
export function Hero() {
  const { hero, contact } = getSite();
  const whatsapp = contact.whatsapp;

  // overflow-clip (not hidden): a hidden box can still be scrolled sideways by
  // focus or scrollIntoView, which would shift the hero next to the slider.
  return (
    <section aria-labelledby="hero-title" className="relative overflow-clip bg-canvas">
      <Container className="grid gap-6 pt-8 pb-0 sm:pt-14 lg:grid-cols-[1fr_1fr] lg:items-end lg:gap-8 lg:pt-12">
        <div className="lg:self-center lg:pb-28">
          <p className="text-sm text-label-style text-label">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-2 text-4xl font-heading tracking-heading text-balance text-heading sm:text-5xl lg:text-6xl"
          >
            <Headline text={hero.headline} />
          </h1>
          <p className="mt-4 max-w-xl text-lg text-pretty text-body sm:text-xl">
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
                <Icon name="message-circle" className="size-5 text-accent" />
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

        {/* One slide per service, standing on the brand wave. */}
        <HeroSlider />
      </Container>
      <Wave id="home-hero-wave" className="h-16 sm:h-20 lg:h-28" />
    </section>
  );
}
