import { getBusiness, getSite, isVisible } from "@/lib/content";
import { PORTAL_URL, whatsappUrl } from "@/lib/links";
import { HeadlineText, Highlight } from "@/components/home/parts";
import { ButtonLink } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { ModuleContents } from "./ModuleContents";
import { PROMISE_GLYPH } from "./PromiseMarks";

// The promises' stamps in the hero (accent on accent-soft passes 4.5:1).
const HERO_STAMP = {
  privacy: "border-brand text-brand hover:bg-brand-soft",
  investment: "border-accent text-accent hover:bg-accent-soft",
} as const;

/**
 * The record book's cover, on white like the product heroes: the eyebrow
 * (the name in green, then who it is for), the headline with its key words
 * in Vibrant Green, the intro and the buttons on the left, the Contents card
 * on the right. The facts (web portal, APIs, and the two promises as stamps
 * that jump down to them) run in one line across the foot of the hero from
 * lg, where the text column is too narrow for all four; below lg they sit
 * under the intro (one line from about 690px; they wrap on phones). Phones
 * read: text, facts, buttons, Contents card. Pricing is custom, so the main
 * button starts a WhatsApp chat with the team; Partner login is for
 * enterprises already on it.
 */
export function BusinessHero() {
  const { name, hero, pricing } = getBusiness();
  const { contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  // "EzyAgric Business · For agribusiness enterprises"
  const rest = hero.eyebrow.split(" · ").slice(1).join(" · ");

  return (
    <section aria-labelledby="business-title" className="overflow-hidden bg-canvas">
      {/* Four grid items so the facts can leave the text column from lg:
          text (row 1) and buttons (row 2) on the left, the Contents card
          over both rows on the right, the facts across both columns below. */}
      <Container className="grid pt-4 pb-12 sm:pt-5 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,31rem)] lg:gap-x-14">
        <div className="lg:col-start-1 lg:row-start-1 lg:self-end">
          <p className="flex items-center gap-3 text-base font-label">
            <IconCircle name="users" color="brand" size="sm" />
            <span>
              <span className="font-heading text-accent">{name}</span>
              {rest ? (
                <>
                  {" "}
                  <span aria-hidden="true" className="text-accent-bright">
                    ·
                  </span>{" "}
                  <span className="text-body">{rest}</span>
                </>
              ) : null}
            </span>
          </p>
          <h1
            id="business-title"
            className="mt-3 text-4xl font-heading tracking-heading text-balance text-heading sm:text-5xl min-[72rem]:text-6xl"
          >
            <HeadlineText text={hero.headline} className="text-accent-bright" />
          </h1>
          <p className="mt-3 max-w-xl text-lg text-pretty text-body sm:mt-4 sm:text-xl">
            <Highlight text={hero.intro} />
          </p>
        </div>
        {hero.facts.length > 0 ? (
          // role="list": Safari drops the list role from unstyled lists.
          <ul role="list" className="mt-5 flex flex-wrap gap-2 lg:col-span-2 lg:row-start-3 lg:mt-12 lg:flex-nowrap">
            {hero.facts.map((fact) => {
              if ("promise" in fact) {
                const Glyph = PROMISE_GLYPH[fact.promise];
                return (
                  <li key={fact.text}>
                    <a
                      href={`#promise-${fact.promise}`}
                      data-track="business_promise_click"
                      data-track-promise={fact.promise}
                      data-track-position="business-hero"
                      className={`inline-flex min-h-9 items-center gap-2 rounded-control border-2 bg-card px-3 py-1 text-sm font-label text-pretty underline-offset-4 hover:underline forced-colors:border-[CanvasText] ${HERO_STAMP[fact.promise]}`}
                    >
                      <Glyph aria-hidden="true" strokeWidth={2} className="size-4 shrink-0" />
                      {fact.text}
                    </a>
                  </li>
                );
              }
              return (
                <li
                  key={fact.text}
                  className="inline-flex min-h-9 items-center gap-2 rounded-pill border border-line bg-subtle px-3 text-sm font-label text-title"
                >
                  <Icon name={fact.icon} className="size-4 shrink-0 text-secondary" />
                  {fact.text}
                </li>
              );
            })}
          </ul>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3 lg:col-start-1 lg:row-start-2 lg:mt-8 lg:self-start">
          {whatsapp ? (
            <ButtonLink
              href={whatsappUrl(whatsapp.number, pricing.whatsappMessage)}
              track="whatsapp_click"
              trackProps={{ position: "business-hero" }}
              className="w-full sm:w-auto"
            >
              <Icon name="message-circle" className="size-5 shrink-0" />
              Talk to our team
            </ButtonLink>
          ) : null}
          <ButtonLink
            href={PORTAL_URL}
            variant="secondary"
            track="portal_login_click"
            trackProps={{ position: "business-hero" }}
            className="w-full sm:w-auto"
          >
            Partner login
          </ButtonLink>
        </div>

        <div className="mt-10 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:self-center">
          <ModuleContents />
        </div>
      </Container>
    </section>
  );
}
