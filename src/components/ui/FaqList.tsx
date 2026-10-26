import { ChevronDown } from "lucide-react";
import { visible, type Faq } from "@/lib/content";
import { PendingBadge } from "./Pending";

/** Accordion of questions built on <details>, so it works without JavaScript. */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="divide-y divide-line rounded-2xl border border-line bg-white">
      {visible(items).map((item) => (
        <details key={item.q} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-bold text-ink [&::-webkit-details-marker]:hidden">
            <span>
              {item.q}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </span>
            <ChevronDown
              aria-hidden="true"
              className="size-5 shrink-0 text-brand-700 transition-transform group-open:rotate-180"
            />
          </summary>
          <p className="pb-5 text-base text-muted">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
