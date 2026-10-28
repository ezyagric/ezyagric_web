import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";
import { getBusiness, getSite, isVisible, visible, type BusinessModuleWithProduct } from "@/lib/content";
import { whatsappUrl } from "@/lib/links";
import { AppTile } from "@/components/ui/AppTile";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { LOOKS, lookName, splitEzy } from "./chapterLooks";
import { PhotoPrint } from "./PhotoPrint";
import { ScreenLoupe } from "./ScreenLoupe";
import { ScreenWindow } from "./ScreenWindow";
import { StatusChip } from "./StatusChip";

// Which side things go on. Odd chapters: text left, screen right, tab on the
// left; even chapters mirror that from lg, so the tabs zigzag down the page.
// Full class strings so Tailwind can find them.
const SIDES = {
  odd: {
    tab: "",
    page: "md:mr-(--gutter) lg:grid-cols-[minmax(0,9fr)_minmax(0,11fr)]",
    text: "lg:col-start-1",
    figure: "lg:col-start-2 md:mr-[calc((var(--pad)_+_var(--gutter))*-1)]",
    loupe: "lg:mr-auto lg:-ml-10",
    print: "ml-auto mr-6 rotate-2",
    mark: "-right-8",
  },
  even: {
    tab: "md:ml-(--gutter) lg:ml-0 lg:self-end",
    page: "md:ml-(--gutter) lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:rounded-tl-media lg:rounded-tr-none",
    text: "lg:col-start-2",
    figure: "lg:col-start-1 md:ml-[calc((var(--pad)_+_var(--gutter))*-1)]",
    loupe: "lg:-mr-10",
    print: "mr-auto ml-6 -rotate-2",
    mark: "-left-8",
  },
} as const;

/**
 * One module as a chapter of the record book:
 * - a thumb-index tab with its number and icon, on the page's top edge;
 * - the page in the chapter's own surface (chapterLooks): who it is for, its
 *   name set large ("Ezy" in green), its summary and its points as ruled,
 *   numbered lines (1.1, 1.2, ...);
 * - its real screen spilling off the page's outer edge from md (the spill
 *   margins are the page's padding plus its side margin, from the same CSS
 *   variables), with a dashed frame round the detail its loupe magnifies, an
 *   illustrative status chip (from sm) and, from lg, a field photo clipped on;
 * - a torn-off stub: "Built on" the farmer-app service (to its page), and a
 *   WhatsApp button to ask about the module.
 * The article keeps the module's id (#ezysupplier, ...), which the home
 * page's tiles and the Contents card link to; jumped to, its tab gets a halo.
 */
export function ModuleChapter({
  module,
  number,
  flip,
}: {
  module: BusinessModuleWithProduct;
  number: number;
  flip: boolean;
}) {
  const business = getBusiness();
  const { contact } = getSite();
  const whatsapp = isVisible(contact.whatsapp) ? contact.whatsapp : null;
  const look = LOOKS[lookName(module)];
  const side = SIDES[flip ? "even" : "odd"];
  const { id, name, product, screen, loupe, status, photo } = module;
  const ezy = splitEzy(name);
  const points = visible(module.points);
  const ask = business.modules.ask;

  return (
    <article
      id={id}
      data-chapter={id}
      aria-labelledby={`${id}-title`}
      className="group/chapter relative flex flex-col [--pad:1.25rem] [--tab:3.5rem] sm:[--pad:2rem] sm:[--tab:4rem] md:[--gutter:2.5rem] lg:[--pad:3rem] lg:[--gutter:4rem]"
    >
      <div
        aria-hidden="true"
        className={`flex h-(--tab) w-fit items-center gap-3 rounded-t-media px-4 outline-offset-2 sm:px-5 forced-colors:border group-target/chapter:outline-4 ${look.tab} ${look.halo} ${side.tab}`}
      >
        <span className="text-4xl/none font-heading tracking-heading tabular-nums sm:text-5xl/none">
          {String(number).padStart(2, "0")}
        </span>
        <Icon name={product.icon} className="size-6 sm:size-7" />
      </div>

      <div
        className={`relative isolate grid grid-cols-1 rounded-media rounded-tl-none p-(--pad) lg:grid-rows-[auto_1fr_auto] lg:gap-x-12 ${look.page} ${side.page}`}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-clip rounded-[inherit]">
          {look.bar ? <span className={`absolute inset-x-0 top-0 h-1.5 ${look.bar}`} /> : null}
          {/* lg only, on the screen side: never under the small text. */}
          <Icon
            name={product.icon}
            className={`absolute -bottom-10 hidden size-56 -rotate-12 lg:block ${side.mark} ${look.mark}`}
          />
        </span>

        <div className={`lg:row-start-1 ${side.text}`}>
          <p className={`text-sm text-label-style ${look.eyebrow}`}>{module.audience}</p>
          <h3
            id={`${id}-title`}
            className={`mt-2 text-4xl/[1.05] font-heading tracking-heading sm:text-5xl/[1.05] min-[72rem]:text-6xl/[1.02] ${look.name}`}
          >
            {ezy ? (
              <>
                <span className={look.ezy}>{ezy[0]}</span>
                {ezy[1]}
              </>
            ) : (
              name
            )}
            {module.pending ? <PendingBadge note={module.note} /> : null}
          </h3>
          <p className={`mt-4 max-w-prose text-lg text-pretty sm:text-xl ${look.text}`}>
            <KeepHyphensTogether text={module.summary} />
          </p>
        </div>

        <div
          className={`relative isolate mt-6 sm:mt-8 lg:row-span-2 lg:row-start-1 lg:mt-[calc((var(--pad)_+_var(--tab))*-1)] lg:self-start ${side.figure}`}
        >
          <div className="relative">
            {screen.frame ? (
              <ScreenWindow
                image={screen}
                crumb={business.name}
                label={name}
                accent={product.accent}
                ring={look.windowRing}
                shadow="device"
                region={loupe?.region}
                sizes="(min-width: 1152px) 605px, (min-width: 1024px) calc(55vw - 29px), (min-width: 768px) calc(100vw - 80px), (min-width: 640px) calc(100vw - 112px), calc(100vw - 72px)"
              />
            ) : (
              <>
                <Image
                  src={screen.src}
                  alt={screen.alt}
                  width={screen.width}
                  height={screen.height}
                  sizes="(min-width: 1152px) 605px, (min-width: 1024px) calc(55vw - 29px), (min-width: 768px) calc(100vw - 80px), (min-width: 640px) calc(100vw - 112px), calc(100vw - 72px)"
                  className="h-auto w-full drop-shadow-[0_24px_24px_color-mix(in_srgb,var(--color-shade)_22%,transparent)]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-x-[12%] -bottom-1 -z-10 h-6 rounded-[50%] bg-shade/15 blur-md"
                />
              </>
            )}
            {status ? (
              <StatusChip
                status={status}
                accent={product.accent}
                className="absolute -top-4 -right-3 z-20 hidden rotate-2 sm:flex"
              />
            ) : null}
          </div>
          {loupe ? (
            <ScreenLoupe
              loupe={loupe}
              ring={look.loupeRing}
              className={`relative z-10 -mt-10 ml-auto w-[88%] sm:-mt-12 sm:w-3/4 lg:-mt-16 lg:w-[62%] ${side.loupe}`}
            />
          ) : null}
          {photo ? <PhotoPrint image={photo} sizes="176px" className={`mt-10 hidden w-44 lg:block ${side.print}`} /> : null}
        </div>

        <div className={`mt-6 lg:row-start-2 lg:mt-8 ${side.text}`}>
          {/* role="list": Safari drops the list role from unstyled lists. A
              hairline margin runs down beside the numbers, as in a ledger. */}
          <ul
            role="list"
            className={`relative divide-y border-y before:absolute before:inset-y-0 before:left-10 before:w-px ${look.rule} ${look.margin}`}
          >
            {points.map((point, i) => (
              <li key={point.text} className={`flex gap-3 py-3 text-base text-pretty ${look.text}`}>
                <span aria-hidden="true" className={`w-9 shrink-0 pt-0.5 text-sm font-label tabular-nums ${look.num}`}>
                  {number}.{i + 1}
                </span>
                <span className="min-w-0 pl-1">
                  <ClaimText claim={point} keepHyphens />
                </span>
              </li>
            ))}
          </ul>
          {product.slug === "ka-ezy" && business.modules.kaezyLink ? (
            <a
              href="#kaezy-banner"
              data-track="kaezy_banner_click"
              data-track-action="watch"
              data-track-position="business-ezyservices"
              className={`group mt-5 inline-flex min-h-11 items-center gap-2 rounded-control font-label underline underline-offset-4 hover:decoration-2 ${look.linkText}`}
            >
              {/* One flex item, so the gap never splits "Ka-Ezy" from the words before it. */}
              <span>
                <KeepHyphensTogether text={business.modules.kaezyLink} />
              </span>
              <ArrowDown
                aria-hidden="true"
                className="size-4 shrink-0 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5"
              />
            </a>
          ) : null}
        </div>

        <div
          className={`mt-8 flex flex-col gap-4 border-t-2 border-dashed pt-5 md:flex-row md:items-center md:justify-between md:gap-6 lg:col-span-2 lg:col-start-1 lg:row-start-3 lg:mt-12 ${look.tear}`}
        >
          <Link
            prefetch={false}
            href={`/${product.slug}/`}
            data-track="business_product_click"
            data-track-module={id}
            data-track-product={product.slug}
            className="group flex min-h-12 min-w-0 items-center gap-4 rounded-control"
          >
            <AppTile product={product} sizes="48px" className={`size-11 sm:size-12 ${look.tile}`} />
            <span className="min-w-0">
              <span className={`block text-sm text-label-style ${look.eyebrow}`}>
                Built on<span className="sr-only">: </span>
              </span>
              <span className={`block text-xl font-heading underline-offset-4 group-hover:underline ${look.linkText}`}>
                {product.name}
                <span className="sr-only">, </span>
              </span>
              <span className={`block text-sm text-pretty ${look.muted}`}>{product.appTagline}</span>
            </span>
            <span
              aria-hidden="true"
              className={`ml-auto flex size-10 shrink-0 items-center justify-center rounded-full transition-transform motion-safe:group-hover:translate-x-1 ${look.arrow}`}
            >
              <ArrowRight className="size-5" />
            </span>
          </Link>
          {whatsapp ? (
            <ButtonLink
              variant="secondary"
              href={whatsappUrl(whatsapp.number, ask.message.replaceAll("{module}", name))}
              track="whatsapp_click"
              trackProps={{ position: "business-module", module: id }}
              className="w-full shrink-0 md:w-auto"
            >
              <Icon name="message-circle" className="size-5 shrink-0" />
              {ask.label.replaceAll("{module}", name)}
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </article>
  );
}
