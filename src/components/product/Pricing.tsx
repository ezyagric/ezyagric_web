import { visible, type Accent, type Product } from "@/lib/content";
import { CheckDot, Highlight } from "@/components/home/parts";
import { Section } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PendingBadge } from "@/components/ui/Pending";
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

// Each card's header panel: a soft tint of the product's colour with its icon
// as a large faint watermark, as on the home page's product cards. Dark Navy
// has no tint of its own: the stronger blue one, as there.
const PANELS: Record<Accent, { tint: string; mark: string }> = {
  brand: { tint: "bg-brand-soft", mark: "text-brand/10" },
  accent: { tint: "bg-accent-soft", mark: "text-accent-bright/15" },
  deep: { tint: "bg-brand-soft-strong", mark: "text-inverse/10" },
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
 * Price cards (Ka-Ezy, while the try-and-hire section is not shown). Each
 * card opens on a tinted panel with the plan's name and any saving on a
 * white pill (green keeps its contrast on white); the highlighted plan's
 * panel is the signature gradient and the card has a green ring. Below, on
 * white, the price in green (guide: green highlights product names, prices
 * and offers) and what the plan gives. `pricing.pending` only adds a badge:
 * the published price is confirmed, and the note says which details still
 * need checking.
 */
export function Pricing({ product, tone }: { product: Product; tone: BandTone }) {
  const pricing = product.pricing;
  if (!pricing) return null;

  const tiers = visible(pricing.tiers);
  const notes = visible(pricing.notes);
  const panel = PANELS[product.accent];

  return (
    <Section id="pricing" tone={tone} labelledBy="pricing-title">
      <SectionTitle
        id="pricing-title"
        title={pricing.title}
        intro={pricing.intro}
        badge={pricing.pending ? <PendingBadge note={pricing.note} /> : null}
        wide
      />

      <ul className={`grid gap-4 sm:gap-5 ${TIER_COLUMNS[tiers.length] ?? TIER_COLUMNS[4]}`}>
        {tiers.map((tier) => {
          const { amount, unit } = splitPrice(tier.price);
          return (
            <li
              key={tier.name}
              className={`flex flex-col overflow-hidden rounded-card bg-card shadow-card ${
                tier.highlight ? "ring-2 ring-accent-bright" : "ring-1 ring-line"
              }`}
            >
              <div
                className={`relative isolate flex flex-wrap items-center justify-between gap-2 overflow-hidden px-5 py-4 ${
                  tier.highlight ? "gradient-brand" : panel.tint
                }`}
              >
                <Icon
                  name={product.icon}
                  className={`absolute -right-4 -bottom-6 -z-10 size-24 -rotate-12 ${
                    tier.highlight ? "text-on-inverse/10" : panel.mark
                  }`}
                />
                <h3 className={`text-lg font-heading ${tier.highlight ? "text-on-inverse" : "text-title"}`}>
                  {tier.name}
                  {tier.pending ? <PendingBadge note={tier.note} /> : null}
                </h3>
                {tier.badge ? (
                  <span className="rounded-pill bg-card px-2.5 py-0.5 text-sm font-label text-accent shadow-card">
                    {tier.badge}
                  </span>
                ) : null}
              </div>
              <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
                {/* One text run, so it reads as "UGX 4,750 / month". It stays on
                    one line, so the prices sit level across the cards: a step
                    smaller from lg to xl, where four cards are narrowest. */}
                <p className="text-accent-bright">
                  <span className="text-3xl font-heading tracking-heading lg:text-2xl xl:text-3xl">
                    {amount}
                  </span>
                  {unit ? (
                    <>
                      {" "}
                      <span className="text-base font-label text-accent">{unit}</span>
                    </>
                  ) : null}
                </p>
                <p className="mt-2 text-base text-pretty text-muted">
                  <Highlight text={tier.text} />
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {notes.length > 0 ? (
        <ul className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {notes.map((note) => (
            <li key={note.text} className="flex items-start gap-2.5 text-base text-body">
              <CheckDot />
              <span>
                <Highlight text={note.text} />
                {note.pending ? <PendingBadge note={note.note} /> : null}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </Section>
  );
}
