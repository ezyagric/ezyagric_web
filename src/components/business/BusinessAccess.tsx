import type { ReactNode } from "react";
import { getBusiness, getBusinessModules, getSite, isVisible, visible, type Accent } from "@/lib/content";
import { PORTAL_URL, whatsappUrl } from "@/lib/links";
import { CheckDot } from "@/components/home/parts";
import { ButtonLink } from "@/components/ui/Button";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { IconCircle } from "@/components/ui/IconCircle";
import { ClaimText } from "@/components/ui/Pending";
import type { BandTone } from "@/components/product/tones";
import { PlugStrip } from "./PlugStrip";
import { PromiseDot } from "./PromiseMarks";
import { ScreenWindow } from "./ScreenWindow";

// Glyph colours on a white disc. Full class strings so Tailwind finds them.
const GLYPH: Record<Accent, string> = {
  brand: "text-brand",
  accent: "text-accent-bright",
  deep: "text-inverse",
};

/**
 * How enterprises connect, as a wiring sheet on a dot-grid board: a gradient
 * hub (EzyAgric Business and its four modules) wired down to two outlets,
 * the web portal (its screen on top, Partner login) and the APIs (the plug
 * strip on top, a WhatsApp button to ask about them), with a navy "or"
 * plate on the seam between them. Everything sits in normal flow: stacked
 * on phones, the outlets side by side from lg at equal height.
 */
export function BusinessAccess({ tone }: { tone: BandTone }) {
  const { access } = getBusiness();
  const modules = getBusinessModules();
  const { contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const [portal, api] = [access.items.find((i) => i.kind === "portal"), access.items.find((i) => i.kind === "api")];

  return (
    <Section id="connect" tone={tone} labelledBy="connect-title">
      <SectionHeader id="connect-title" eyebrow={access.eyebrow} title={access.title} intro={access.intro} />
      <div className="relative isolate overflow-clip rounded-media border border-line bg-card bg-[radial-gradient(var(--color-brand-soft-strong)_1px,transparent_1.5px)] bg-size-[1.25rem_1.25rem] p-4 shadow-card sm:p-6 lg:p-10">
        <div className="mx-auto max-w-3xl rounded-card p-4 text-on-inverse shadow-raised gradient-brand sm:p-6">
          <p className="text-sm text-label-style text-on-inverse">{access.hub.label}</p>
          <p className="mt-1 text-xl font-heading text-on-inverse sm:text-2xl">{access.hub.text}</p>
          {/* role="list": Safari drops the list role from unstyled lists. */}
          <ul role="list" className="mt-4 grid grid-cols-1 gap-2 min-[25rem]:grid-cols-2 lg:grid-cols-4">
            {modules.map((module) => (
              <li
                key={module.id}
                className="flex min-h-11 items-center gap-2 rounded-pill bg-inverse/25 py-1 pr-3 pl-1 text-sm font-label text-on-inverse ring-1 ring-on-inverse/20"
              >
                <span
                  aria-hidden="true"
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-card ${GLYPH[module.product.accent]}`}
                >
                  <Icon name={module.product.icon} className="size-4" />
                </span>
                {module.name}
              </li>
            ))}
          </ul>
        </div>

        <span aria-hidden="true" className="mx-auto block h-8 w-1 rounded-pill bg-brand-soft-strong forced-colors:bg-[CanvasText]" />

        <div className="grid lg:grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] lg:gap-x-4">
          {portal ? (
            <Outlet id="connect-portal" item={portal} accent="brand" whatsappNumber={whatsapp?.number}>
              {access.screen ? (
                <figure className="border-b border-line bg-brand-soft p-3 sm:p-4">
                  <ScreenWindow
                    image={access.screen.image}
                    crumb={access.hub.label}
                    label={portal.title}
                    accent="brand"
                    region={access.screen.blurred}
                    pin="blur"
                    sizes="(min-width: 1152px) 440px, (min-width: 1024px) calc(50vw - 136px), (min-width: 640px) calc(100vw - 128px), calc(100vw - 88px)"
                  />
                  <figcaption className="px-1 pt-2 text-sm text-pretty text-muted">{access.screen.caption}</figcaption>
                </figure>
              ) : null}
            </Outlet>
          ) : null}

          {/* The seam: a wire with an "or" plate, between the stacked cards on
              phones and down the gap between them from lg. */}
          <div aria-hidden="true" className="flex flex-col items-center py-1 lg:py-0">
            <span className="h-4 w-1 bg-brand-soft-strong lg:h-auto lg:flex-1 forced-colors:bg-[CanvasText]" />
            <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-inverse font-heading text-on-inverse ring-4 ring-card forced-colors:border">
              or
            </span>
            <span className="h-4 w-1 bg-brand-soft-strong lg:h-auto lg:flex-1 forced-colors:bg-[CanvasText]" />
          </div>

          {api ? (
            <Outlet id="connect-api" item={api} accent="accent" whatsappNumber={whatsapp?.number}>
              {api.plug ? <PlugStrip plug={api.plug} /> : null}
            </Outlet>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

type AccessItem = ReturnType<typeof getBusiness>["access"]["items"][number];

/** One way in: its illustration on top, then its title, text, points and button. */
function Outlet({
  id,
  item,
  accent,
  whatsappNumber,
  children,
}: {
  id: string;
  item: AccessItem;
  accent: Accent;
  whatsappNumber?: string;
  children: ReactNode;
}) {
  return (
    <article aria-labelledby={id} className="flex flex-col overflow-clip rounded-card bg-card shadow-card ring-1 ring-line">
      {children}
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <IconCircle name={item.icon} color={accent} />
          <h3 id={id} className="text-2xl font-heading text-title">
            {item.title}
          </h3>
        </div>
        <p className="mt-3 text-base text-pretty text-body">{item.text}</p>
        {/* role="list": Safari drops the list role from unstyled lists. */}
        <ul role="list" className="mt-4 space-y-2.5">
          {visible(item.points).map((point) => (
            <li key={point.text} className="flex items-start gap-2.5 text-base text-body">
              {point.promise ? <PromiseDot kind={point.promise} /> : <CheckDot />}
              <span>
                <ClaimText claim={point} keepHyphens />
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pt-6">
          {item.kind === "portal" ? (
            // Partner login for teams already on it; a chat with the team for those who aren't.
            <div className="flex flex-wrap gap-3">
              <ButtonLink
                href={PORTAL_URL}
                variant="secondary"
                track="portal_login_click"
                trackProps={{ position: "business-connect" }}
                className="w-full sm:w-auto"
              >
                {item.button}
              </ButtonLink>
              {item.ask && whatsappNumber ? (
                <ButtonLink
                  href={whatsappUrl(whatsappNumber, item.ask.message)}
                  variant="secondary"
                  track="whatsapp_click"
                  trackProps={{ position: "business-connect-portal" }}
                  className="w-full sm:w-auto"
                >
                  <Icon name="message-circle" className="size-5 shrink-0" />
                  {item.ask.label}
                </ButtonLink>
              ) : null}
            </div>
          ) : whatsappNumber ? (
            <ButtonLink
              href={whatsappUrl(whatsappNumber, item.message)}
              variant="secondary"
              track="whatsapp_click"
              trackProps={{ position: "business-connect" }}
              className="w-full sm:w-auto"
            >
              <Icon name="message-circle" className="size-5 shrink-0" />
              {item.button}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
