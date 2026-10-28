import { getBusinessModules } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";

/**
 * The chapters' thumb index from lg: one pill of the four modules, sticky
 * under the header on screens tall enough for it (tall-lg), so readers can
 * jump between chapters. The chapter in view lights up (a scroll timeline in
 * globals.css; where browsers lack those, the chapter jumped to). Phones and
 * tablets use the hero's Contents card instead.
 */
export function ModuleIndex({ label }: { label: string }) {
  const modules = getBusinessModules();

  return (
    <nav
      aria-label={label}
      data-module-index
      className="pointer-events-none z-30 mb-14 hidden justify-center lg:flex tall-lg:sticky tall-lg:top-31"
    >
      {/* role="list": Safari drops the list role from unstyled lists. */}
      <ol
        role="list"
        className="pointer-events-auto flex items-center gap-1 rounded-pill border border-line bg-subtle/90 p-1 shadow-raised backdrop-blur supports-[backdrop-filter]:bg-subtle/80"
      >
        {modules.map((module, i) => (
          <li key={module.id}>
            <a
              href={`#${module.id}`}
              data-index={module.id}
              data-track="business_module_click"
              data-track-module={module.id}
              data-track-position="business-index"
              className="flex min-h-11 items-center gap-2 rounded-pill px-4 text-sm font-label text-muted transition-colors hover:bg-card hover:text-title"
            >
              <span aria-hidden="true" className={`size-2.5 rounded-full ${ACCENTS[module.product.accent].bar}`} />
              <span aria-hidden="true" className="tabular-nums">
                {String(i + 1).padStart(2, "0")}
              </span>
              {module.name}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
