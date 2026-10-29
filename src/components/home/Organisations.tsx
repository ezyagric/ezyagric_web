import { ArrowRight } from "lucide-react";
import { getBusiness, getSite } from "@/lib/content";
import { PORTAL_URL } from "@/lib/links";
import { ChapterFan } from "@/components/business/ChapterFan";
import { ButtonLink } from "@/components/ui/Button";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";

/**
 * For agribusinesses: a glimpse of EzyAgric Business, as its record book
 * fanned open (ChapterFan): the four chapter pages, each with who it is for,
 * the module and a crop of its real screen, each opening its chapter on the
 * EzyAgric Business page. Above, the eyebrow and title, with the intro beside
 * them from lg; below, on a dashed tear line, how it connects (web portal,
 * APIs) and the ways in: the page and Partner login.
 */
export function Organisations() {
  const { organisations: org } = getSite();
  const facts = getBusiness().hero.facts.flatMap((fact) => ("icon" in fact ? [fact] : []));

  return (
    <Section id="organisations" tone="subtle" labelledBy="organisations-title" className="overflow-x-clip">
      <div className="mb-8 sm:mb-12 lg:grid lg:grid-cols-2 lg:items-end lg:gap-12">
        <div>
          <p className="mb-2 text-sm text-label-style text-label">{org.eyebrow}</p>
          <h2
            id="organisations-title"
            className="text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl"
          >
            <KeepHyphensTogether text={org.title} />
          </h2>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-pretty text-muted lg:mt-0">
          <KeepHyphensTogether text={org.intro} />
        </p>
      </div>

      <ChapterFan href={org.cta.href} />

      <div className="mt-6 flex flex-col gap-5 border-t-2 border-dashed border-brand-soft-strong pt-6 sm:mt-8 md:flex-row md:flex-wrap md:items-center md:justify-between">
        {facts.length > 0 ? (
          // role="list": Safari drops the list role from unstyled lists.
          <ul role="list" className="hidden flex-wrap gap-2 sm:flex">
            {facts.map((fact) => (
              <li
                key={fact.text}
                className="inline-flex min-h-9 items-center gap-2 rounded-pill border border-line bg-card px-3 text-sm font-label text-title"
              >
                <Icon name={fact.icon} className="size-4 shrink-0 text-secondary" />
                {fact.text}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <ButtonLink
            href={org.cta.href}
            track="business_page_click"
            trackProps={{ position: "organisations-section" }}
            className="w-full sm:w-auto"
          >
            {org.cta.label}
            <ArrowRight aria-hidden="true" className="size-5" />
          </ButtonLink>
          <ButtonLink
            href={PORTAL_URL}
            variant="secondary"
            track="portal_login_click"
            trackProps={{ position: "organisations-section" }}
            className="w-full sm:w-auto"
          >
            Partner login
          </ButtonLink>
        </div>
      </div>
    </Section>
  );
}
