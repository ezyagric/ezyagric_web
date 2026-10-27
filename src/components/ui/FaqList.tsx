import { Plus } from "lucide-react";
import { visible, type Faq } from "@/lib/content";
import { PendingBadge } from "./Pending";

/**
 * Accordion of questions built on <details>, so it works without JavaScript.
 * Each question is its own card (bg-card, border-line, rounded-card) with a
 * numbered circle and a plus in a secondary outline circle. An open question
 * lifts: its border turns secondary, its number green, and the plus turns
 * into a cross on a filled circle.
 */
export function FaqList({ items }: { items: Faq[] }) {
  return (
    <div className="space-y-3">
      {visible(items).map((item, i) => (
        <details
          key={item.q}
          className="group rounded-card border border-line bg-card px-4 transition-shadow open:border-secondary open:shadow-raised sm:px-5"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-4 text-lg font-label text-title [&::-webkit-details-marker]:hidden">
            {/* The number is decoration: the questions are read in order anyway. */}
            <span
              aria-hidden="true"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-heading text-brand tabular-nums transition-colors group-open:bg-accent-bright group-open:text-on-accent"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="min-w-0 flex-1">
              {item.q}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </span>
            <span
              aria-hidden="true"
              className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary text-secondary transition-colors group-open:bg-secondary group-open:text-on-secondary"
            >
              <Plus className="size-4 motion-safe:transition-transform group-open:rotate-45" strokeWidth={2.25} />
            </span>
          </summary>
          {/* pl-13: the answer lines up with the question, past the number. */}
          <p className="pb-5 text-base text-pretty text-body sm:pl-13">{item.a}</p>
        </details>
      ))}
    </div>
  );
}
