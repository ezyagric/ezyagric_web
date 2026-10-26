import { getSite, visible, type Accent } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { IconCircle } from "@/components/ui/IconCircle";
import { PendingBadge } from "@/components/ui/Pending";
import { Highlight } from "./parts";

// Icon circles take turns in the three brand colours.
// Blue and green alternate (the logo blue and Dark Navy look too alike side by side).
const CIRCLES: Accent[] = ["blue", "green"];

/** The free farm-management tools that sit alongside the four products. */
export function AlsoInApp() {
  const { alsoInApp } = getSite();

  return (
    <Section id="also-in-the-app" labelledBy="also-in-the-app-title">
      <SectionHeader id="also-in-the-app-title" title={alsoInApp.title} intro={alsoInApp.intro} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {visible(alsoInApp.items).map((item, i) => (
          <li key={item.title} className="rounded-lg border border-line bg-white p-5 sm:p-6">
            <IconCircle name={item.icon ?? "sprout"} color={CIRCLES[i % CIRCLES.length]} />
            <h3 className="mt-4 text-lg font-bold text-ink">
              {item.title}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </h3>
            <p className="mt-1 text-base text-pretty text-ink">
              <Highlight text={item.text} />
            </p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
