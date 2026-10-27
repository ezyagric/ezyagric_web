import { Plus } from "lucide-react";
import { visible, type Faq } from "@/lib/content";
import { ButtonLink } from "./Button";
import { resolveFaqActions } from "./faqActions";
import { Icon } from "./Icon";
import { KeepHyphensTogether } from "./KeepHyphens";
import { PendingBadge } from "./Pending";
import { StoreBadges } from "./StoreBadges";
import { TryKaEzyButton } from "@/components/promo/KaEzyBanner";

/**
 * Accordion of questions built on <details>, so it works without JavaScript.
 * Each question is its own card (bg-card, border-line, rounded-card) with a
 * numbered circle and a plus in a secondary outline circle. An open question
 * lifts: its border turns secondary, its number green, and the plus turns
 * into a cross on a filled circle. An answer can end with up to two actions
 * (try Ka-Ezy, WhatsApp the team, ...): the first button is the main (green)
 * one. "Try Ka-Ezy" is the site's one TryKaEzyButton and "get the app" shows
 * the official store badges instead of a button.
 */
export function FaqList({
  items,
  page,
}: {
  items: Faq[];
  /** The product page the list sits on, if any (for the Try Ka-Ezy button's target). */
  page?: string;
}) {
  return (
    <div className="space-y-3">
      {visible(items).map((item, i) => {
        const actions = resolveFaqActions(item.actions);
        return (
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
                <KeepHyphensTogether text={item.q} />
                {item.pending ? <PendingBadge note={item.note} /> : null}
              </span>
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-secondary text-secondary transition-colors group-open:bg-secondary group-open:text-on-secondary"
              >
                <Plus
                  className="size-4 motion-safe:transition-transform group-open:rotate-45"
                  strokeWidth={2.25}
                />
              </span>
            </summary>
            {/* pl-13: the answer and its buttons line up with the question, past the number. */}
            <div className="pb-5 sm:pl-13">
              <p className="text-base text-pretty text-body">
                <KeepHyphensTogether text={item.a} />
              </p>
              {actions.length > 0 ? (
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {actions.map((action, j) =>
                    action.kind === "get-app" ? (
                      <StoreBadges
                        key={action.kind}
                        campaign="general"
                        medium="faq"
                        size="md"
                      />
                    ) : action.kind === "try-kaezy" ? (
                      <TryKaEzyButton
                        key={action.kind}
                        // Not the help card's position ("faq", "faq-<page>"): the two are told apart.
                        position={page ? `faq-answer-${page}` : "faq-answer"}
                        page={page}
                        variant={j === 0 ? "primary" : "secondary"}
                        className="w-full sm:w-auto"
                      />
                    ) : (
                      <ButtonLink
                        key={action.kind + action.label}
                        href={action.href}
                        variant={j === 0 ? "primary" : "secondary"}
                        track="faq_action_click"
                        trackProps={{ action: action.kind }}
                        className="w-full whitespace-nowrap sm:w-auto"
                      >
                        {action.icon ? (
                          <Icon
                            name={action.icon}
                            className="size-5 shrink-0"
                          />
                        ) : null}
                        {action.label}
                      </ButtonLink>
                    ),
                  )}
                </div>
              ) : null}
            </div>
          </details>
        );
      })}
    </div>
  );
}
