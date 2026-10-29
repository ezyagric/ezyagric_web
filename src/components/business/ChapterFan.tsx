import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBusiness, getBusinessModules } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";
import { LOOKS, lookName, splitEzy } from "./chapterLooks";

// Each page's pose. Full class strings so Tailwind finds them. li: layout
// (the right column lower from sm; from lg the overlap and the arc). sheet:
// the tilt, which straightens on hover and keyboard focus. tab: on phones
// the tabs step right like binder dividers. page: the corner under the tab.
const POSE = [
  { li: "lg:translate-y-4", sheet: "sm:-rotate-1 lg:-rotate-3", tab: "", page: "rounded-tl-none" },
  { li: "sm:translate-y-6 lg:-ml-6 lg:translate-y-0", sheet: "sm:rotate-1 lg:-rotate-1", tab: "ml-[20%] sm:ml-0", page: "sm:rounded-tl-none" },
  { li: "lg:-ml-6", sheet: "sm:-rotate-1 lg:rotate-1", tab: "ml-[40%] sm:ml-0", page: "sm:rounded-tl-none" },
  { li: "sm:translate-y-6 lg:-ml-6 lg:translate-y-4", sheet: "sm:rotate-1 lg:rotate-3", tab: "ml-[60%] sm:ml-0", page: "sm:rounded-tl-none" },
] as const;

// Phones: the container less the page's padding. sm-md: half the two-column
// grid less the padding. lg: four pages overlapping by 24px, less padding.
const SIZES =
  "(min-width: 1152px) 254px, (min-width: 1024px) calc(25vw - 34px), (min-width: 640px) calc(50vw - 76px), calc(100vw - 56px)";

/**
 * The EzyAgric Business record book fanned open on the home page: its four
 * numbered chapter pages (the business page's surfaces: paper, green, navy
 * "ink", blue), each with its index tab, who it is for, the module's name
 * ("Ezy" in green) and a crop of its real screen, each opening its chapter on
 * the business page. A gradient cover board peeks out behind the pages.
 *
 * Phones: one column, untilted, the tabs stepping right like binder
 * dividers, each screen a 16:6 strip (cropped by its thumb's `focus`). From
 * sm: two by two, the right column lower, tilted by a degree. From lg: one
 * fanned row, each page overlapping the one before by 24px, tilted -3 to +3
 * degrees round its foot; a page straightens on hover and keyboard focus,
 * and lifts on hover. The tilting sheet ignores the pointer, so the link's
 * box (its hit area and focus ring) stays still and nothing flickers.
 *
 * The screens' figures stay inside the images (alt="": each link is named by
 * its own text); never restate them as text.
 */
export function ChapterFan({ href }: { href: string }) {
  const { modules: copy } = getBusiness();
  const modules = getBusinessModules();

  return (
    <div className="relative isolate sm:px-2 lg:px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-6 top-12 -bottom-3 -z-10 hidden rotate-1 rounded-media gradient-brand-decor shadow-raised sm:block lg:inset-x-12 lg:top-16 lg:-bottom-4 lg:-rotate-1"
      />
      {/* role="list": Safari drops the list role from unstyled lists. */}
      <ol
        role="list"
        aria-label={copy.eyebrow ?? copy.title}
        className="grid gap-3 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-8 sm:pb-6 lg:flex lg:gap-0 lg:pb-5"
      >
        {modules.map((module, i) => {
          const pose = POSE[i] ?? POSE[0];
          const look = LOOKS[lookName(module)];
          const ezy = splitEzy(module.name);
          const { thumb } = module;
          return (
            <li
              key={module.id}
              className={`relative flex min-w-0 flex-col hover:z-10 focus-within:z-10 lg:flex-1 lg:basis-0 ${pose.li}`}
            >
              <Link
                prefetch={false}
                href={`${href}#${module.id}`}
                data-track="business_page_click"
                data-track-position="organisations-module"
                data-track-module={module.id}
                className="group flex flex-1 flex-col rounded-media"
              >
                <div
                  className={`pointer-events-none flex flex-1 flex-col lg:origin-bottom motion-safe:transition-transform motion-safe:duration-200 group-hover:-translate-y-1.5 group-hover:rotate-0 group-focus-visible:rotate-0 ${pose.sheet}`}
                >
                  <span
                    aria-hidden="true"
                    className={`flex h-8 w-fit items-center gap-1.5 rounded-t-media px-3 forced-colors:border sm:h-10 sm:gap-2 sm:px-4 ${look.tab} ${pose.tab}`}
                  >
                    <span className="text-xl/none font-heading tracking-heading tabular-nums sm:text-2xl/none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon name={module.product.icon} className="size-4 sm:size-5" />
                  </span>
                  <span
                    className={`relative isolate flex flex-1 flex-col overflow-clip rounded-media p-3 forced-colors:border sm:p-4 ${look.page} ${pose.page}`}
                  >
                    {look.bar ? <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1 ${look.bar}`} /> : null}
                    <span className="mb-3 flex items-start gap-3 sm:mb-4">
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-label text-pretty ${look.eyebrow}`}>{module.audience}</span>
                        <span className="sr-only">, </span>
                        <span
                          className={`mt-0.5 block text-xl/tight font-heading tracking-heading underline-offset-4 group-hover:underline sm:text-2xl/tight ${look.name}`}
                        >
                          {ezy ? (
                            <>
                              <span className={look.ezy}>{ezy[0]}</span>
                              {ezy[1]}
                            </>
                          ) : (
                            module.name
                          )}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5 ${look.arrow}`}
                      >
                        <ArrowRight className="size-4" />
                      </span>
                    </span>
                    <Image
                      src={thumb.src}
                      alt=""
                      width={thumb.width}
                      height={thumb.height}
                      sizes={SIZES}
                      style={thumb.focus ? { objectPosition: thumb.focus } : undefined}
                      className={`aspect-[16/6] w-full rounded-control object-cover object-left-top shadow-card ring-1 sm:mt-auto sm:aspect-[16/10] ${look.windowRing}`}
                    />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
