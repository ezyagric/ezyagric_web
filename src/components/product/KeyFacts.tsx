import { isVisible, visible, type Accent, type Claim, type Product } from "@/lib/content";
import { Highlight } from "@/components/home/parts";
import { ACCENTS } from "@/components/ui/accents";
import { Container, Section } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { SectionTitle } from "./SectionTitle";
import type { BandTone } from "./tones";

// A soft tint of the product's colour behind the lender line. Full class
// strings so Tailwind can find them. Dark Navy has no tint of its own: the
// stronger blue one, as on the home page's product cards.
const TINTS: Record<Accent, string> = {
  brand: "bg-brand-soft",
  accent: "bg-accent-soft",
  deep: "bg-brand-soft-strong",
};

// The last fact stretches across what is left of its row (two columns from
// sm, three from lg), so the grid never ends on an empty cell. From lg, by
// the number of facts modulo three: 0 fills the row, 1 or 2 leave a gap.
const LAST_IN_THREES = ["lg:col-span-1", "lg:col-span-3", "lg:col-span-2"];

/** True when the page has a key facts box or a lender line to show. */
export function hasKeyFacts(product: Product): boolean {
  const { keyFacts, lenderLine } = product;
  const facts = isVisible(keyFacts) && visible(keyFacts?.items ?? []).length > 0;
  return facts || isVisible(lenderLine);
}

/**
 * Credit key facts (EzyCredits Pay Later), set out like a lender's key facts
 * statement: one card with a bar of the product colour along the top, the
 * facts in a grid of cells divided by hairlines (one column on phones, two
 * from sm, three from lg) and the lender line as the statement's footer.
 * Each cell's large faint number is decoration. Pending facts show in
 * preview with a badge and drop out in production; while the whole box is
 * pending, production shows only the lender line (once that is confirmed).
 */
export function KeyFacts({ product, tone }: { product: Product; tone: BandTone }) {
  const { keyFacts, lenderLine } = product;
  const items = keyFacts && isVisible(keyFacts) ? visible(keyFacts.items) : [];
  const lender = lenderLine && isVisible(lenderLine) ? lenderLine : null;

  if (!keyFacts || items.length === 0) {
    return lender ? (
      <div className={tone === "subtle" ? "bg-subtle py-10" : "bg-canvas py-10"}>
        <Container>
          <LenderLine claim={lender} accent={product.accent} className="max-w-3xl" />
        </Container>
      </div>
    ) : null;
  }

  const last = items.length - 1;
  const lastSpan = `${items.length % 2 === 1 ? "sm:col-span-2" : ""} ${LAST_IN_THREES[items.length % 3]}`;

  return (
    <Section id="key-facts" tone={tone} labelledBy="key-facts-title">
      <SectionTitle
        id="key-facts-title"
        title={keyFacts.title}
        intro={keyFacts.intro}
        badge={keyFacts.pending ? <PendingBadge note={keyFacts.note} /> : null}
        wide
      />

      <div className="overflow-hidden rounded-card border border-line bg-card shadow-card">
        <span aria-hidden="true" className={`block h-1.5 ${ACCENTS[product.accent].bar}`} />
        {/* gap-px over the line colour: the hairlines between the cells. */}
        <dl className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={item.label}
              className={`relative isolate overflow-hidden bg-card px-5 py-4 sm:px-6 ${i === last ? lastSpan : ""}`}
            >
              <dt className="pr-12 text-sm text-label-style text-label">
                <span
                  aria-hidden="true"
                  className="absolute top-3 right-4 -z-10 text-3xl leading-none font-heading tracking-heading text-brand/10 tabular-nums select-none"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {item.label}
              </dt>
              <dd className="mt-1 text-base text-pretty text-body">
                {item.value ? (
                  <Highlight text={item.value} />
                ) : (
                  <span className="font-label text-muted">To be confirmed</span>
                )}
                {item.pending ? <PendingBadge note={item.note} /> : null}
              </dd>
            </div>
          ))}
        </dl>
        {lender ? (
          <LenderLine
            claim={lender}
            accent={product.accent}
            className={`border-t border-line px-5 py-3 sm:px-6 ${TINTS[product.accent]}`}
          />
        ) : null}
      </div>
    </Section>
  );
}

/**
 * Who provides the credit, as small print (the guide's light caption
 * weight) beside a shield in the product's colour. pt-2 sets the first line
 * level with the middle of the shield.
 */
function LenderLine({
  claim,
  accent,
  className = "",
}: {
  claim: Claim;
  accent: Accent;
  className?: string;
}) {
  return (
    <p className={`flex items-start gap-3 ${className}`}>
      <IconCircle name="shield-check" color={accent} size="sm" />
      <span className="min-w-0 pt-2 text-sm font-caption text-pretty text-muted">
        <ClaimText claim={claim} />
      </span>
    </p>
  );
}
