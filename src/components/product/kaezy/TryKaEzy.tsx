import { isVisible, visible, type Product } from "@/lib/content";
import { KAEZY_DEMO_API, SHOW_PENDING } from "@/lib/env";
import { Section, SectionHeader } from "@/components/ui/Container";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";
import { PendingBadge } from "@/components/ui/Pending";
import { StoreBadges } from "@/components/ui/StoreBadges";
import type { BandTone } from "../tones";
import { HireKaEzy, type HirePlan } from "./HireKaEzy";
import { KaEzyDemo } from "./KaEzyDemo";

const HIRE_ID = "hire-ka-ezy";

/** The pricing tiers that can be bought (they have months and a monthly price). */
function hirePlans(product: Product): HirePlan[] {
  return visible(product.pricing?.tiers ?? []).flatMap((tier) =>
    tier.months && tier.monthlyUgx
      ? [
          {
            name: tier.name,
            months: tier.months,
            monthlyUgx: tier.monthlyUgx,
            badge: tier.badge,
            highlight: tier.highlight,
          },
        ]
      : [],
  );
}

/** True when the product has a try-and-hire section to show on this build. */
export function hasTryIt(product: Product): boolean {
  return !!product.tryIt && isVisible(product.tryIt) && hirePlans(product).length > 0;
}

/**
 * "Ask Ka-Ezy, then hire it": "Your farm" and past conversations beside the
 * Ka-Ezy window (Farm Expert with its photo check, Garden Mapping, Farm Plan,
 * Farm Records), then "Hire Ka-Ezy" below. All redrawn from the app in the
 * website's theme. It replaces the plain price cards on the page, since the
 * plans are here.
 */
export function TryKaEzy({ product, tone }: { product: Product; tone: BandTone }) {
  const tryIt = product.tryIt;
  if (!tryIt) return null;

  return (
    <Section id="try-ka-ezy" tone={tone} labelledBy="try-ka-ezy-title">
      {/* The intro is a child (same look as SectionHeader's own intro), so the
          "To confirm" badge ends its last line instead of taking a line of its own.
          Full width: it runs on to the right edge of the Ka-Ezy window below
          (no text-pretty, which would pull the first line in short). */}
      <SectionHeader id="try-ka-ezy-title" eyebrow={tryIt.eyebrow} title={tryIt.title} full>
        <p className="mt-3 text-lg text-muted">
          <KeepHyphensTogether text={tryIt.intro} />
          {tryIt.pending ? <PendingBadge note={tryIt.note} /> : null}
        </p>
      </SectionHeader>

      {/* The last thing in the section when it shows, so no margin below. */}
      <noscript>
        <p className="rounded-card border border-line bg-card p-4 text-base text-body">
          Turn on JavaScript to try Ka-Ezy here, or get the EzyAgric App to use it on your phone.
        </p>
      </noscript>

      {/* Without JavaScript only the note above shows: the demo and plan forms need scripts. */}
      <div className="noscript:hidden">
        <KaEzyDemo
          copy={tryIt}
          tagline={product.appTagline}
          avatar="/images/products/ka-ezy-avatar.webp"
          hireHref={`#${HIRE_ID}`}
          // Live Ka-Ezy answers once the guest demo endpoint is configured.
          endpoint={KAEZY_DEMO_API}
        />
        {/* Full width, a grid gap below the demo (the demo's own gap), so it
            reads as the demo's last row and its navy column lines up with
            "Your farm" above. */}
        <div className="mt-6 lg:mt-8">
          <HireKaEzy
            id={HIRE_ID}
            hire={tryIt.hire}
            plans={hirePlans(product)}
            // No secure web payment API yet: simulate it in preview builds,
            // send visitors to the app on the live site.
            payMode={SHOW_PENDING ? "demo" : "app"}
            storeBadges={<StoreBadges campaign={product.cta.campaign} medium="hire-ka-ezy" size="md" />}
          />
        </div>
      </div>
    </Section>
  );
}
