import type { ReactNode } from "react";
import { KeepHyphensTogether } from "@/components/ui/KeepHyphens";

/**
 * Same look as ui/Container's SectionHeader, but the h2 can hold a node
 * (a "To confirm" badge) right next to the title text.
 */
export function SectionTitle({
  id,
  title,
  intro,
  badge,
  wide = false,
}: {
  id: string;
  title: string;
  intro?: string;
  badge?: ReactNode;
  /** Room for a title and intro that should each stay on one line on desktop. */
  wide?: boolean;
}) {
  return (
    <div className={`mb-10 ${wide ? "max-w-4xl" : "max-w-2xl"}`}>
      <h2
        id={id}
        className="text-3xl font-heading tracking-heading text-balance text-heading sm:text-4xl"
      >
        <KeepHyphensTogether text={title} />
        {badge}
      </h2>
      {intro ? (
        <p className="mt-3 text-lg text-pretty text-muted">
          <KeepHyphensTogether text={intro} />
        </p>
      ) : null}
    </div>
  );
}
