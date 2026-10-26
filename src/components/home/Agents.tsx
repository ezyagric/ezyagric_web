import Image from "next/image";
import { getSite } from "@/lib/content";
import { AGENT_APP_ID, playStoreUrl } from "@/lib/links";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { CheckDot } from "./parts";

/**
 * The Digital Agriculture Champion (DAC) programme: village agents who take
 * EzyAgric to farmers. Reads top to bottom on a phone as: what DACs do, a
 * photo of an agent at work, how to start, then the Agent app button. From
 * lg the photo moves to the left, mirroring the Organisations band above.
 */
export function Agents() {
  const { agents } = getSite();

  return (
    <Section id="agents" labelledBy="agents-title">
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <SectionHeader
            id="agents-title"
            eyebrow={agents.eyebrow}
            title={agents.title}
            intro={agents.intro}
          />
          <h3 className="text-xl font-bold text-ink">What DACs do</h3>
          <ul className="mt-4 space-y-3">
            {agents.roles.map((role) => (
              <li key={role} className="flex items-start gap-3 text-base text-ink">
                <CheckDot />
                <span>{role}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* A real EzyAgric agent guiding farmers (lazy: below the fold). */}
        <div className="overflow-hidden rounded-lg border border-line lg:order-first">
          <Image
            src={agents.image.src}
            alt={agents.image.alt}
            width={agents.image.width}
            height={agents.image.height}
            sizes="(min-width: 1152px) 528px, (min-width: 1024px) 45vw, (min-width: 640px) calc(100vw - 48px), calc(100vw - 32px)"
            className="h-auto w-full"
          />
        </div>
      </div>

      <h3 className="mt-14 text-xl font-bold text-ink">How to get started</h3>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {agents.steps.map((step, i) => (
          <li key={step} className="flex items-start gap-4 rounded-lg border border-line bg-white p-5">
            {/* The <ol> already numbers steps for screen readers. */}
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-700 text-lg font-bold text-white"
            >
              {i + 1}
            </span>
            <span className="pt-2 text-base text-ink">{step}</span>
          </li>
        ))}
      </ol>

      <ButtonLink
        href={playStoreUrl(agents.cta.campaign, "agents-section", AGENT_APP_ID)}
        track="agent_app_click"
        trackProps={{ position: "agents-section" }}
        size="lg"
        className="mt-8 w-full sm:w-auto"
      >
        <Icon name="smartphone" className="size-5" />
        {agents.cta.label}
      </ButtonLink>
    </Section>
  );
}
