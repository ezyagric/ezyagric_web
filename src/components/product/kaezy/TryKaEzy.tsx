import { isVisible, visible, type Product } from "@/lib/content";
import { KAEZY_DEMO_API, SHOW_PENDING } from "@/lib/env";
import { Section, SectionHeader } from "@/components/ui/Container";
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
 * "Ask Ka-Ezy, then hire it": "Your farm", the Ka-Ezy window (Farm Expert,
 * Farm Plan, Farm Records, Garden Mapping) and past conversations, then
 * "Hire Ka-Ezy" below. All redrawn from the app in the website's theme. It
 * replaces the plain price cards on the page, since the plans are here.
 */
export function TryKaEzy({ product, tone }: { product: Product; tone: BandTone }) {
  const tryIt = product.tryIt;
  if (!tryIt) return null;

  return (
    <Section id="try-ka-ezy" tone={tone} labelledBy="try-ka-ezy-title">
      <SectionHeader id="try-ka-ezy-title" eyebrow={tryIt.eyebrow} title={tryIt.title} intro={tryIt.intro}>
        {tryIt.pending ? (
          <p className="mt-3">
            <PendingBadge note={tryIt.note} />
          </p>
        ) : null}
      </SectionHeader>

      <noscript>
        <p className="mb-6 rounded-card border border-line bg-card p-4 text-base text-body">
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
        <div className="mx-auto mt-8 max-w-4xl">
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
