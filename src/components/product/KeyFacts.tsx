import { isVisible, visible, type Product } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";
import { Container, Section } from "@/components/ui/Container";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";
import { SectionTitle } from "./SectionTitle";
import type { BandTone } from "./tones";

/** True when the page has a key facts box or a lender line to show. */
export function hasKeyFacts(product: Product): boolean {
  return isVisible(product.keyFacts) || isVisible(product.lenderLine);
}

/**
 * Credit key facts (EzyCredits Pay Later) in a box like a lender's key
 * facts statement: the guide's card style with a bar of the product colour
 * along the top so it stands out, and the lender line as small print.
 * Pending rows show in preview with a badge and drop out in production.
 */
export function KeyFacts({ product, tone }: { product: Product; tone: BandTone }) {
  const { keyFacts, lenderLine } = product;
  const accent = ACCENTS[product.accent];

  const smallPrint =
    lenderLine && isVisible(lenderLine) ? (
      <p className="mt-4 max-w-3xl text-sm font-caption text-pretty text-muted">
        <ClaimText claim={lenderLine} />
      </p>
    ) : null;

  if (!keyFacts || !isVisible(keyFacts)) {
    return smallPrint ? (
      <div className={tone === "subtle" ? "bg-subtle py-10" : "bg-canvas py-10"}>
        <Container>{smallPrint}</Container>
      </div>
    ) : null;
  }

  return (
    <Section id="key-facts" tone={tone} labelledBy="key-facts-title">
      <SectionTitle
        id="key-facts-title"
        title={keyFacts.title}
        intro={keyFacts.intro}
        badge={keyFacts.pending ? <PendingBadge note={keyFacts.note} /> : null}
      />

      <div className="relative max-w-3xl overflow-hidden rounded-card border border-line bg-card pt-1.5">
        <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />
        <dl className="divide-y divide-line">
          {visible(keyFacts.items).map((item) => (
            <div
              key={item.label}
              className="grid gap-1 px-5 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6 sm:px-6"
            >
              <dt className="font-heading text-title">{item.label}</dt>
              <dd className="text-body">
                {item.value ?? <span className="font-label text-muted">To be confirmed</span>}
                {item.pending ? <PendingBadge note={item.note} /> : null}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {smallPrint}
    </Section>
  );
}
