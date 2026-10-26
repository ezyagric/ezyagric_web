import Image from "next/image";
import { getSite, isVisible, visible } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ClaimText, PendingBadge } from "@/components/ui/Pending";

/**
 * Partner logos grouped as in the Business Profile (commercial, financial,
 * funding and strategic). Every logo sits in the same white tile so logos of
 * very different shapes line up; images are lazy-loaded below the fold.
 */
export function Partners() {
  const { partners } = getSite();
  const groups = partners.groups
    .map((g) => ({ ...g, items: visible(g.items) }))
    .filter((g) => g.items.length > 0);
  if (groups.length === 0) return null;

  return (
    <Section id="partners" tone="surface" labelledBy="partners-title">
      <SectionHeader id="partners-title" title={partners.title} intro={partners.intro} align="center">
        {partners.notice && isVisible(partners.notice) ? (
          <p className="mt-3 text-base text-muted">
            <ClaimText claim={partners.notice} />
          </p>
        ) : null}
      </SectionHeader>

      <div className="space-y-10">
        {groups.map((group) => (
          <div key={group.title}>
            <h3 className="mb-4 text-center text-sm font-semibold tracking-[0.14em] text-muted uppercase">
              {group.title}
            </h3>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {group.items.map(({ name, logo, pending, note }) => (
                <li
                  key={name}
                  className="flex h-24 flex-col items-center justify-center gap-1 rounded-lg border border-line bg-white px-4 py-3"
                >
                  <Image
                    src={logo.src}
                    alt={logo.alt}
                    width={logo.width}
                    height={logo.height}
                    sizes="160px"
                    className="max-h-14 w-auto max-w-full object-contain"
                  />
                  {pending ? <PendingBadge note={note} /> : null}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
