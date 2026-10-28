import { Plug } from "lucide-react";
import { getBusinessModules, type Accent } from "@/lib/content";
import { Icon } from "@/components/ui/Icon";

// Glyph colours on a white disc. Full class strings so Tailwind finds them.
const GLYPH: Record<Accent, string> = {
  brand: "text-brand",
  accent: "text-accent-bright",
  deep: "text-inverse",
};

/**
 * The APIs card's illustration on navy: EzyAgric Business (with its four
 * modules' icons) wired down through a plug into the enterprise's own
 * system, with three status lights. Decoration: the card's text says the
 * same, and it shows no endpoints, formats or field names.
 */
export function PlugStrip({ plug }: { plug: { from: string; to: string; label: string } }) {
  const modules = getBusinessModules();

  return (
    <div aria-hidden="true" className="relative isolate overflow-hidden bg-inverse p-4 text-center text-on-inverse sm:p-5">
      <span className="absolute -top-16 -right-16 -z-10 size-48 rounded-full bg-accent-bright/15 blur-2xl" />
      <div className="flex flex-col items-center">
        <span className="inline-flex items-center gap-2 rounded-pill py-1.5 pr-3 pl-1.5 text-sm font-label ring-1 ring-on-inverse/25 gradient-brand">
          <span className="flex -space-x-1.5">
            {modules.map((module) => (
              <span
                key={module.id}
                className={`flex size-6 items-center justify-center rounded-full bg-card ring-2 ring-inverse ${GLYPH[module.product.accent]}`}
              >
                <Icon name={module.product.icon} className="size-3.5" />
              </span>
            ))}
          </span>
          {plug.from}
        </span>
        <span className="h-6 w-1 bg-on-inverse/25 forced-colors:bg-[CanvasText]" />
        <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-accent-bright text-on-accent ring-4 ring-inverse">
          <Plug className="size-5 rotate-180" />
        </span>
        <span className="-mt-2 flex max-w-full items-center gap-3 rounded-control bg-on-inverse/10 px-3 py-2 text-sm font-label ring-1 ring-on-inverse/25">
          <span className="min-w-0 text-pretty">{plug.to}</span>
          <span className="flex shrink-0 gap-1">
            <span className="size-1.5 rounded-full bg-accent-bright" />
            <span className="size-1.5 rounded-full bg-on-inverse/40" />
            <span className="size-1.5 rounded-full bg-on-inverse/40" />
          </span>
        </span>
      </div>
      <p className="mt-4 text-sm text-label-style text-on-inverse/80">{plug.label}</p>
    </div>
  );
}
