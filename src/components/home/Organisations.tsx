import Image from "next/image";
import { getSite } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { CheckDot } from "./parts";

/** For cooperatives and agribusinesses: what the web portal does, and the way in. */
export function Organisations() {
  const { organisations: org } = getSite();

  return (
    <Section id="organisations" tone="surface" labelledBy="organisations-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader
            id="organisations-title"
            eyebrow={org.eyebrow}
            title={org.title}
            intro={org.intro}
          />
          <ul className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {org.points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-base text-ink">
                <CheckDot />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <ButtonLink
            href={org.cta.url}
            track="portal_login_click"
            trackProps={{ position: "organisations-section" }}
            className="mt-8 w-full sm:w-auto"
          >
            {org.cta.label}
          </ButtonLink>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-white shadow-xl shadow-brand-900/10">
          <Image
            src={org.image.src}
            alt={org.image.alt}
            width={org.image.width}
            height={org.image.height}
            sizes="(min-width: 1152px) 528px, (min-width: 1024px) 45vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
            className="h-auto w-full"
          />
        </div>
      </div>
    </Section>
  );
}
