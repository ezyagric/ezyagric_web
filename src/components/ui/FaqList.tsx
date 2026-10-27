import { visible, type Faq } from "@/lib/content";
import { TryKaEzyButton } from "@/components/promo/KaEzyBanner";
import { ButtonLink } from "./Button";
import { resolveFaqActions } from "./faqActions";
import { Icon } from "./Icon";
import { KeepHyphensTogether } from "./KeepHyphens";
import { PendingBadge } from "./Pending";
import { StoreBadges } from "./StoreBadges";

/**
 * The questions as one index panel, like the numbered margin of a farm
 * record book: a single white card (bg-card, border-line, rounded-card)
 * split by hairlines, each question's number set large in a margin column.
 * From sm a hairline "spine" runs down the margin's edge. Built on
 * <details>, so every answer opens without JavaScript.
 *
 * Open, a question's row is washed in brand-soft (from sm only right of the
 * spine, so the margin stays white), its number turns Vibrant Green (large
 * text) and the plus a minus on a solid blue circle; from sm its stretch of
 * the spine also becomes a blue-to-green rail (not on phones, where a tint
 * and a left bar would look like the disclaimer above some lists). Where the
 * browser can animate to height: auto (interpolate-size), the answer slides
 * open and the rail draws down with it; elsewhere, and with reduced motion,
 * it simply opens.
 *
 * Every margin measure reads one variable, --index (3.5rem, 5rem from sm):
 * the number's column, the spine and rail, the white margin of the wash and
 * the answer's indent. The number, the question's first line and the toggle
 * share a 28px line (text-2xl/7 and text-3xl/7, text-base/7 and text-lg/7,
 * h-7), so the big number sits optically centred on the first line.
 *
 * An answer can end with up to two actions (try Ka-Ezy, WhatsApp the team,
 * ...), set off by a hairline: the first button is the main (green) one.
 * "Try Ka-Ezy" is the site's one TryKaEzyButton and "get the app" shows the
 * official store badges instead of a button. On phones the answer runs the
 * row's whole width (under the number), so the buttons keep one-line labels
 * at 320px; from sm it lines up with the question, past the spine.
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
    // role="list": Safari drops the list role from unstyled lists (and the
    // list tells screen readers how many questions there are; the numbers
    // are decoration). overflow-hidden keeps the washes and rails inside the
    // card's corners, so each question draws its focus ring inside itself
    // (-outline-offset-6), where the clip cannot cut it.
    <ol
      role="list"
      className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card shadow-card [--index:3.5rem] sm:[--index:5rem]"
    >
      {visible(items).map((item, i) => {
        const actions = resolveFaqActions(item.actions);
        return (
          <li key={item.q} className="relative">
            {/* The wash is a background colour under a white margin (from
                sm), so it fades in and out with the answer. */}
            <details className="group peer open:bg-brand-soft sm:bg-[linear-gradient(to_right,var(--color-card)_var(--index),transparent_var(--index))] motion-safe:transition-colors motion-safe:duration-300 supports-[interpolate-size:allow-keywords]:details-content:h-0 supports-[interpolate-size:allow-keywords]:details-content:overflow-clip supports-[interpolate-size:allow-keywords]:open:details-content:h-auto supports-[interpolate-size:allow-keywords]:motion-safe:[interpolate-size:allow-keywords] supports-[interpolate-size:allow-keywords]:motion-safe:details-content:transition-[height,content-visibility] supports-[interpolate-size:allow-keywords]:motion-safe:details-content:transition-discrete supports-[interpolate-size:allow-keywords]:motion-safe:details-content:duration-300 supports-[interpolate-size:allow-keywords]:motion-safe:details-content:ease-out">
              {/* Focused, the row rises above the spine so its ring stays whole. */}
              <summary className="group/summary flex cursor-pointer list-none items-start py-5 pr-4 transition-colors group-not-open:hover:bg-subtle focus-visible:relative focus-visible:z-1 focus-visible:-outline-offset-6 sm:pr-6 [&::-webkit-details-marker]:hidden">
                {/* The index number is decoration: the list gives the count and order. */}
                <span
                  aria-hidden="true"
                  className="w-(--index) shrink-0 pl-4 text-2xl/7 font-label tracking-heading text-brand/55 tabular-nums transition-colors group-open:text-accent-bright group-not-open:group-hover/summary:text-brand sm:pl-5 sm:text-3xl/7"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1 pr-3 text-base/7 font-label text-pretty text-title sm:pr-4 sm:pl-5 sm:text-lg/7">
                  <KeepHyphensTogether text={item.q} />
                  {item.pending ? <PendingBadge note={item.note} /> : null}
                </span>
                {/* h-7: the circle centres on the question's first line. A
                    plus whose upright folds away into a minus; an inline SVG
                    (currentColor strokes) so it survives forced colours. */}
                <span aria-hidden="true" className="flex h-7 shrink-0 items-center">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-soft text-secondary ring-brand-soft-strong transition group-open:bg-brand group-open:text-on-brand group-hover/summary:ring-4 forced-colors:border">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      className="size-4"
                    >
                      <path d="M3 8h10" />
                      <path
                        d="M8 3v10"
                        className="origin-center [transform-box:fill-box] group-open:scale-y-0 group-open:opacity-0 motion-safe:transition motion-safe:duration-300"
                      />
                    </svg>
                  </span>
                </span>
              </summary>
              {/* Phones: the row's whole width, under the number. From sm: in
                  line with the question, past the spine. */}
              <div className="px-4 pb-6 sm:pr-6 sm:pl-[calc(var(--index)+1.25rem)]">
                <p className="max-w-prose text-base text-pretty text-body">
                  <KeepHyphensTogether text={item.a} />
                </p>
                {actions.length > 0 ? (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
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
                            <Icon name={action.icon} className="size-5 shrink-0" />
                          ) : null}
                          {action.label}
                        </ButtonLink>
                      ),
                    )}
                  </div>
                ) : null}
              </div>
            </details>
            {/* After the <details>, not in it: a closed details hides
                everything but its summary. The spine and the open question's
                rail (from sm), which draws down as the answer opens. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-(--index) hidden w-px bg-line sm:block"
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-(--index) hidden w-1 origin-top -translate-x-1/2 scale-y-0 bg-linear-to-b from-gradient-start to-gradient-decor-end peer-open:scale-y-100 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out sm:block"
            />
          </li>
        );
      })}
    </ol>
  );
}
