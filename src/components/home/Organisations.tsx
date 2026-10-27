import Image from "next/image";
import { getSite, type IconName, type ImageData } from "@/lib/content";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * For cooperatives and agribusinesses: what the web portal does, and the way in.
 *
 * From lg the two columns share one height: the tinted panel with the
 * laptop and tablet starts level with the eyebrow and ends level with the
 * Partner login button. What the platform does sits on small icon tiles
 * (blue down the left column, green down the right).
 */
export function Organisations() {
  const { organisations: org } = getSite();

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
          <ul className="-mt-2 grid gap-3 sm:grid-cols-2">
            {org.points.map((point, i) => (
              <li
                key={point.text}
                // A step smaller from lg to xl, where the tiles are narrowest.
                className="flex items-center gap-3 rounded-card bg-card px-3 py-2.5 text-base text-body shadow-card ring-1 ring-line lg:text-sm xl:text-base"
              >
                <IconCircle name={point.icon} color={i % 2 ? "accent" : "brand"} size="sm" />
                <span className="min-w-0">{point.text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 lg:mt-auto lg:pt-8">
            <ButtonLink
              href={org.cta.url}
              track="portal_login_click"
              trackProps={{ position: "organisations-section" }}
              className="w-full sm:w-auto"
            >
              {org.cta.label}
            </ButtonLink>
          </div>
        </div>

        <PortalVisual image={org.image} />
      </div>
    </Section>
  );
}

/**
 * The laptop and tablet on a soft blue-to-green panel, between two small
 * illustrative notifications (decorative; the list says what they mean).
 * The panel takes the text column's height from lg, so the spare height
 * goes to the notifications rather than to empty space.
 */
function PortalVisual({ image }: { image: ImageData }) {
  return (
    <div className="relative isolate flex flex-col justify-between gap-4 overflow-hidden rounded-media bg-linear-to-br from-brand-soft to-accent-soft p-5 ring-1 ring-line sm:p-8">
      <span aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-72 rounded-full bg-card/60" />
      <span aria-hidden="true" className="absolute -bottom-24 -left-16 -z-10 size-64 rounded-full bg-accent-soft-strong/60" />

      <Toast icon="hand-coins" color="accent" title="Payments sent" text="Farmers paid · just now" className="self-start -rotate-2" />
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        sizes="(min-width: 1152px) 488px, (min-width: 1024px) 42vw, (min-width: 640px) calc(100vw - 112px), calc(100vw - 72px)"
        className="h-auto w-full"
      />
      <Toast icon="package" color="brand" title="Bulk produce traced" text="Back to each farmer" className="self-end rotate-2" />
    </div>
  );
}

function Toast({
  icon,
  color,
  title,
  text,
  className,
}: {
  icon: IconName;
  color: "brand" | "accent";
  title: string;
  text: string;
  className: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`hidden items-center gap-3 rounded-card bg-card py-2.5 pr-4 pl-2.5 shadow-raised ring-1 ring-line sm:flex ${className}`}
    >
      <IconCircle name={icon} color={color} size="sm" />
      <span>
        <span className="block text-sm font-heading text-title">{title}</span>
        <span className="block text-xs text-muted">{text}</span>
      </span>
    </div>
  );
}
