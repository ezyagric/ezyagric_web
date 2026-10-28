import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBusinessModules, getSite } from "@/lib/content";
import { PORTAL_URL } from "@/lib/links";
import { ModulesGlimpse } from "@/components/business/ModulesGlimpse";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * For agribusiness enterprises: a glimpse of EzyAgric Business. Its four
 * modules (content/business.yaml) as tiles that each open their part of the
 * EzyAgric Business page, each in the colour and icon of the farmer-app
 * service it is built on; then the way in (the page) and Partner login.
 * Beside them, a window onto each module's screen (ModulesGlimpse).
 *
 * From lg the two columns share one height: the tinted panel starts level
 * with the eyebrow and ends level with the buttons.
 */
export function Organisations() {
  const { organisations: org } = getSite();
  const modules = getBusinessModules();

  return (
    <Section id="organisations" tone="subtle" labelledBy="organisations-title">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
        <div className="lg:flex lg:flex-col">
          <SectionHeader
            id="organisations-title"
            eyebrow={org.eyebrow}
            title={org.title}
            intro={org.intro}
          />
          {/* role="list": Safari drops the list role from unstyled lists. */}
          <ul role="list" className="-mt-2 grid gap-3 sm:grid-cols-2">
            {modules.map((module) => (
              <li key={module.id}>
                <Link
                  prefetch={false}
                  href={`${org.cta.href}#${module.id}`}
                  data-track="business_page_click"
                  data-track-position="organisations-module"
                  data-track-module={module.id}
                  className="group flex h-full items-center gap-3 rounded-card bg-card px-3 py-2.5 shadow-card ring-1 ring-line transition hover:shadow-raised hover:ring-secondary"
                >
                  <IconCircle name={module.product.icon} color={module.product.accent} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-heading text-title group-hover:underline group-hover:underline-offset-4">
                      {module.name}
                    </span>
                    <span className="block text-sm text-body">{module.audience}</span>
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="size-4 shrink-0 text-secondary motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3 lg:mt-auto lg:pt-8">
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

        <ModulesGlimpse />
      </div>
    </Section>
  );
}
