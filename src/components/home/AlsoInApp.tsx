import { getSite, visible } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { PendingBadge } from "@/components/ui/Pending";

/** The free farm-management tools that sit alongside the four products. */
export function AlsoInApp() {
  const { alsoInApp } = getSite();

  return (
    <Section id="also-in-the-app" labelledBy="also-in-the-app-title">
      <SectionHeader id="also-in-the-app-title" title={alsoInApp.title} intro={alsoInApp.intro} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {visible(alsoInApp.items).map((item) => (
          <li key={item.title} className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
            <span className="flex size-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name={item.icon ?? "sprout"} className="size-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-ink">
              {item.title}
              {item.pending ? <PendingBadge note={item.note} /> : null}
            </h3>
            <p className="mt-1 text-base text-pretty text-muted">{item.text}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
