import { visible, type Product } from "@/lib/content";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { SectionTitle } from "./SectionTitle";
import type { BandTone } from "./tones";

// Full class names so Tailwind can find them. One column on phones, two
// from sm, and the whole row from lg.
const TIER_COLUMNS: Record<number, string> = {
  1: "max-w-md",
  2: "max-w-4xl sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

/**
 * "UGX 4,750 / month" → amount "UGX 4,750" and unit "/ month", so the
 * amount can be large and the unit small. Display text only: a price
 * without " / " (e.g. "Free") is all amount.
 */
function splitPrice(price: string): { amount: string; unit?: string } {
  const at = price.indexOf(" / ");
  return at > 0 ? { amount: price.slice(0, at), unit: price.slice(at + 1) } : { amount: price };
}

/**
 * Price cards (Ka-Ezy). Prices are offers, so they are the green highlight
 * (guide: green highlights product names, prices and offers), with any
 * saving as a small green pill. `pricing.pending` only adds a badge: the
 * published price is confirmed, and the note says which details still need
 * checking.
 */
export function Pricing({ product, tone }: { product: Product; tone: BandTone }) {
  const pricing = product.pricing;
  if (!pricing) return null;

  const tiers = visible(pricing.tiers);
  const notes = visible(pricing.notes);

  return (
    <Section id="pricing" tone={tone} labelledBy="pricing-title">
      <SectionTitle
        id="pricing-title"
        title={pricing.title}
        intro={pricing.intro}
        badge={pricing.pending ? <PendingBadge note={pricing.note} /> : null}
      />

      <ul className={`grid gap-5 ${TIER_COLUMNS[tiers.length] ?? TIER_COLUMNS[4]}`}>
        {tiers.map((tier) => {
          const { amount, unit } = splitPrice(tier.price);
          return (
            <li
              key={tier.name}
              className={`relative flex flex-col overflow-hidden rounded-card bg-card p-6 pt-8 ${
                tier.highlight ? "ring-2 ring-accent-bright" : "border border-line"
              }`}
            >
              {/* Signature blue-green ribbon along the top of the highlighted tier. */}
              {tier.highlight ? (
                <span aria-hidden="true" className="gradient-brand absolute inset-x-0 top-0 h-2" />
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-heading text-title">
                  {tier.name}
                  {tier.pending ? <PendingBadge note={tier.note} /> : null}
                </h3>
                {tier.badge ? (
                  <span className="rounded-pill bg-accent px-2.5 py-0.5 text-sm font-label text-on-primary">
                    {tier.badge}
                  </span>
                ) : null}
              </div>
              {/* One text run, so it reads as "UGX 4,750 / month". */}
              <p className="mt-3 text-accent-bright">
                <span className="text-3xl font-heading tracking-heading sm:text-4xl lg:text-3xl">
                  {amount}
                </span>
                {unit ? (
                  <>
                    {" "}
                    <span className="text-base font-label text-accent">{unit}</span>
                  </>
                ) : null}
              </p>
              <p className="mt-3 text-base text-pretty text-muted">{tier.text}</p>
            </li>
          );
        })}
      </ul>

      {notes.length > 0 ? (
        <ul className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.text} className="flex items-start gap-2.5 text-base text-body">
              <Icon name="check-circle" className="mt-0.5 size-5 shrink-0 text-accent-bright" />
              <span>
                <ClaimText claim={note} />
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}
