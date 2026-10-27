import { getSite } from "@/lib/content";
import { Container } from "@/components/ui/Container";
import { StoreBadges } from "@/components/ui/StoreBadges";
import { TryKaEzyButton } from "@/components/promo/KaEzyBanner";
import { Highlight } from "./parts";
import { Wave } from "@/components/ui/Wave";
import { HeroSlider } from "./HeroSlider";

/** "Farm the Ezy Way, the Smart Way." with the words Ezy and Smart in Vibrant Green (large text, so accent-bright passes). */
function Headline({ text }: { text: string }) {
  const parts = text.split(/\b(Ezy|Smart)\b/);
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
 * headline, subline and store badges sit above the fold; the service slider
 * (HeroSlider) follows below, and sits beside the text from lg up.
 */
export function Hero() {
  const { hero } = getSite();

  // overflow-clip (not hidden): a hidden box can still be scrolled sideways by
  // focus or scrollIntoView, which would shift the hero next to the slider.
  return (
    <section aria-labelledby="hero-title" className="relative overflow-clip bg-canvas">
      {/* From lg the text column stretches to the slider's height: the eyebrow
          lines up with the top of the slider and the last line sits where the
          slide art meets the wave (pb-28 = the wave's height). 1.15fr leaves
          room for the try button and both store badges on one row at 1024px. */}
      <Container className="grid gap-6 pt-8 pb-0 sm:pt-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch lg:gap-8 lg:pt-12">
        <div className="lg:flex lg:flex-col lg:pb-28">
          <p className="text-sm text-label-style text-label">
            {hero.eyebrow}
          </p>
          <h1
            id="hero-title"
            className="mt-2 text-4xl font-heading tracking-heading text-balance text-heading sm:text-5xl lg:text-6xl xl:text-7xl"
          >
            <Headline text={hero.headline} />
          </h1>
          {/* From lg, centred between the headline and the buttons: equal space
              above and below (the buttons stay level with the wave). */}
          <p className="mt-4 max-w-xl text-lg text-pretty text-body sm:text-xl lg:my-auto lg:py-4">
            <Highlight text={hero.subline} />
          </p>


          {/* As on the service pages: the try button and the store badges on
              one row, all 48px tall (full-width button on phones). */}
          <div className="mt-6 flex flex-wrap items-center gap-3 lg:mt-0">
            <TryKaEzyButton position="home-hero" className="w-full sm:w-auto" />
            <StoreBadges campaign="general" medium="hero" size="md" />
          </div>
        </div>

        {/* One slide per service, standing on the brand wave. */}
        <HeroSlider />
      </Container>
      <Wave id="home-hero-wave" className="h-16 sm:h-20 lg:h-28" />
    </section>
  );
}
