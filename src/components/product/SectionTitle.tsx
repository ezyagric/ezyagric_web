import type { ReactNode } from "react";

/**
 * Same look as ui/Container's SectionHeader, but the h2 can hold a node
 * (a "To confirm" badge) right next to the title text.
 */
export function SectionTitle({
  id,
  title,
  intro,
  badge,
}: {
  id: string;
  title: string;
  intro?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-10 max-w-2xl">
      <h2
        id={id}
        className="text-3xl font-extrabold tracking-tight text-balance text-ink sm:text-4xl"
      >
        {title}
        {badge}
      </h2>
      {intro ? <p className="mt-3 text-lg text-pretty text-muted">{intro}</p> : null}
    </div>
  );
}
