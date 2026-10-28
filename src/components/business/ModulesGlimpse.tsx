import { getBusinessModules } from "@/lib/content";
import { ScreenWindow } from "./ScreenWindow";

/**
 * A glimpse of EzyAgric Business: one small window per module (EzySupplier,
 * EzyProduce, EzyCredits, EzyServices), each a close crop of its screen,
 * two by two on a soft blue-to-green panel. From sm the right-hand column
 * sits a little lower than the left, like windows laid on a desk. In the
 * home page's agribusiness section; from lg the panel takes the text
 * column's height and the windows centre in it.
 */
export function ModulesGlimpse() {
  const modules = getBusinessModules();

  return (
    <div className="relative isolate flex flex-col justify-center overflow-hidden rounded-media bg-linear-to-br from-brand-soft to-accent-soft p-4 ring-1 ring-line sm:p-6">
      <span aria-hidden="true" className="absolute -top-20 -right-16 -z-10 size-72 rounded-full bg-card/60" />
      <span aria-hidden="true" className="absolute -bottom-24 -left-16 -z-10 size-64 rounded-full bg-accent-soft-strong/60" />

      {/* role="list": Safari drops the list role from unstyled lists. */}
      <ul role="list" className="grid grid-cols-2 gap-3 sm:gap-4">
        {modules.map((module, i) => (
          <li key={module.id} className={i % 2 === 0 ? "sm:-translate-y-2" : "sm:translate-y-2"}>
            <ScreenWindow
              image={module.thumb}
              label={module.name}
              accent={module.product.accent}
              size="sm"
              // Half the panel: 232px from lg (it sits in a half column),
              // else half the container less the panel's padding.
              sizes="(min-width: 1152px) 232px, (min-width: 1024px) calc(25vw - 56px), (min-width: 640px) calc(50vw - 56px), calc(50vw - 38px)"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
