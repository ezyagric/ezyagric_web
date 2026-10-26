import { visible, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { SectionTitle } from "./SectionTitle";
import { TONES, type BandTone } from "./tones";

// Full class names so Tailwind can find them.
const TIER_COLUMNS: Record<number, string> = {
  1: "",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

/**
 * Price cards (Ka-Ezy). `pricing.pending` only adds a badge: the published
 * price is confirmed, and the note says which details still need checking.
 */
export function Pricing({ product, tone }: { product: Product; tone: BandTone }) {
  const pricing = product.pricing;
  if (!pricing) return null;

  const accent = ACCENTS[product.accent];
  const colours = TONES[product.accent];
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

      <ul className={`grid max-w-4xl gap-5 ${TIER_COLUMNS[tiers.length] ?? TIER_COLUMNS[3]}`}>
        {tiers.map((tier) => (
          <li
            key={tier.name}
            className={`relative flex flex-col overflow-hidden rounded-2xl bg-white p-6 pt-8 sm:p-8 sm:pt-10 ${
              tier.highlight ? `shadow-lg ${colours.highlight}` : "border border-line shadow-sm"
            }`}
          >
            {/* Ribbon along the top of the highlighted tier. */}
            {tier.highlight ? (
              <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-2 ${accent.bar}`} />
            ) : null}
            <h3 className="text-lg font-extrabold text-ink">
              {tier.name}
              {tier.pending ? <PendingBadge note={tier.note} /> : null}
            </h3>
            <p
              className={`mt-2 text-4xl font-extrabold tracking-tight sm:text-5xl ${tier.highlight ? accent.text : "text-ink"}`}
            >
              {tier.price}
            </p>
            <p className="mt-4 text-base text-pretty text-muted">{tier.text}</p>
          </li>
        ))}
      </ul>

      {notes.length > 0 ? (
        <ul className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {notes.map((note) => (
            <li key={note.text} className="flex items-start gap-2.5 text-base text-ink">
              <Icon name="check-circle" className={`mt-0.5 size-5 shrink-0 ${accent.text}`} />
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
