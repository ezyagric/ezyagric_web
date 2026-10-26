import { ChevronDown } from "lucide-react";
import { visible, type Faq } from "@/lib/content";
import { PendingBadge } from "./Pending";

/**
 * Accordion of questions built on <details>, so it works without JavaScript.
 * A brand-guide card (white, 1px border, 8px radius) with navy SemiBold
 * questions and the chevron in an outline circle that fills when open.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-lg border border-line bg-white">
      {visible(items).map((item) => (
        <details key={item.q} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-ink [&::-webkit-details-marker]:hidden">
            <span>
              {item.q}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </span>
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-700 text-brand-700 transition-colors group-open:bg-brand-700 group-open:text-white"
            >
              <ChevronDown className="size-4 transition-transform group-open:rotate-180" strokeWidth={2.25} />
            </span>
          </summary>
          <p className="pb-5 text-base text-ink">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
