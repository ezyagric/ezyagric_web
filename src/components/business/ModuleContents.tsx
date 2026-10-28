import Image from "next/image";
import { ArrowDown } from "lucide-react";
import { getBusiness, getBusinessModules } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { IconCircle } from "@/components/ui/IconCircle";
import { LOOKS, lookName } from "./chapterLooks";

/**
 * The hero's Contents card, like the first page of a record book: one row
 * per module chapter (its number in the chapter's colour, a thumb of its
 * screen, its name and who it is for) that jumps down to the chapter, over
 * the FaqList spine. A coloured index tab sticks out of each row's right
 * edge, as on a ledger's thumb index. Behind the card, a gradient folder
 * peeks out at the right and bottom.
 *
 * Phones get a strip of the four screens under the header (the rows show
 * icons there); from sm each row shows its own screen thumb.
 */
export function ModuleContents() {
  const { hero } = getBusiness();
  const modules = getBusinessModules();

  return (
    <div className="relative isolate w-full max-w-2xl pr-3 pb-3 sm:pr-5 sm:pb-4 lg:max-w-none">
      <span
        aria-hidden="true"
        className="absolute inset-0 top-4 -z-10 translate-x-2 translate-y-2 rotate-1 rounded-media gradient-brand-decor shadow-raised sm:translate-x-4 sm:translate-y-3 sm:rotate-2"
      />
      <span
        aria-hidden="true"
        className="absolute -bottom-8 -left-8 -z-20 hidden size-40 bg-[radial-gradient(var(--color-brand-soft-strong)_1.5px,transparent_2px)] bg-size-[1rem_1rem] sm:block"
      />

      <nav
        aria-labelledby="contents-title"
        className="relative rounded-media bg-card shadow-raised ring-1 ring-line [--index:3.25rem] sm:[--index:4.5rem]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
          <p id="contents-title" className="text-sm text-label-style text-label">
            {hero.contents.label}
          </p>
          {hero.contents.note ? <p className="text-sm text-muted">{hero.contents.note}</p> : null}
        </div>

        <div aria-hidden="true" className="grid grid-cols-4 gap-1.5 border-b border-line bg-subtle p-2 sm:hidden">
          {modules.map((module) => (
            <Image
              key={module.id}
              src={module.thumb.src}
              alt=""
              width={module.thumb.width}
              height={module.thumb.height}
              sizes="calc(25vw - 20px)"
              className="aspect-[16/10] w-full rounded-control object-cover object-left-top ring-1 ring-line"
            />
          ))}
        </div>

        {/* role="list": Safari drops the list role from unstyled lists. */}
        <ol role="list" className="divide-y divide-line">
          {modules.map((module, i) => {
            const look = LOOKS[lookName(module)];
            const { accent, icon } = module.product;
            return (
              <li key={module.id} className="relative">
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 left-(--index) w-px bg-line"
                />
                <a
                  href={`#${module.id}`}
                  data-track="business_module_click"
                  data-track-module={module.id}
                  data-track-position="business-contents"
                  className={`group relative grid grid-cols-[var(--index)_auto_minmax(0,1fr)_auto] items-center gap-x-2.5 py-3 pr-4 transition-colors hover:bg-subtle focus-visible:-outline-offset-4 sm:gap-x-4 sm:py-4 sm:pr-5 ${
                    i === modules.length - 1 ? "rounded-b-media" : ""
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pl-4 text-2xl/none font-heading tracking-heading tabular-nums sm:pl-5 sm:text-3xl/none ${look.contentsNum}`}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <IconCircle name={icon} color={accent} size="sm" className="sm:hidden" />
                  <span className="relative hidden w-24 sm:block lg:w-28">
                    <Image
                      src={module.thumb.src}
                      alt=""
                      width={module.thumb.width}
                      height={module.thumb.height}
                      sizes="112px"
                      className="aspect-[16/10] w-full rounded-control object-cover object-left-top shadow-card ring-1 ring-line motion-safe:transition-transform motion-safe:group-hover:-translate-y-0.5"
                    />
                    <IconCircle
                      name={icon}
                      color={accent}
                      size="sm"
                      className="absolute -bottom-2 -left-2 ring-2 ring-card"
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-heading text-title underline-offset-4 group-hover:underline sm:text-lg">
                      {module.name}
                    </span>
                    <span className="sr-only">, </span>
                    <span className="block text-sm text-muted">{module.audience}</span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`flex size-9 items-center justify-center rounded-full ${ACCENTS[accent].icon} motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5`}
                  >
                    <ArrowDown className="size-4" />
                  </span>
                  {/* The thumb-index tab, sticking out of the card's right edge. */}
                  <span
                    aria-hidden="true"
                    className={`absolute top-1/2 -right-2 h-10 w-2 -translate-y-1/2 rounded-r-control forced-colors:border motion-safe:transition-[width,right] group-hover:-right-3.5 group-hover:w-3.5 ${look.swatch}`}
                  />
                </a>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
