import { SHOW_PENDING } from "@/lib/env";
import type { Claim } from "@/lib/content";
import { KeepHyphensTogether } from "./KeepHyphens";

/**
 * Marks copy that the EzyAgric team still has to confirm. Only rendered in
 * preview/staging builds; the note says what needs confirming.
 */
export function PendingBadge({ note }: { note?: string }) {
  if (!SHOW_PENDING) return null;
  return (
    <span
      className="ml-1.5 inline-flex cursor-help items-center gap-1 rounded-pill border border-dashed border-review bg-review-soft px-2 py-0.5 align-middle text-[11px] font-heading tracking-wide text-review uppercase"
      title={note ?? "Waiting for confirmation from the EzyAgric team"}
    >
      To confirm
      {note ? <span className="sr-only">: {note}</span> : null}
    </span>
  );
}

/**
 * Renders a claim's text, with a badge if pending. Hidden in production when
 * pending. keepHyphens keeps words like "Ka-Ezy" whole when the line wraps.
 */
export function ClaimText({ claim, keepHyphens = false }: { claim: Claim; keepHyphens?: boolean }) {
  if (claim.pending && !SHOW_PENDING) return null;
  return (
    <>
      {keepHyphens ? <KeepHyphensTogether text={claim.text} /> : claim.text}
      {claim.pending ? <PendingBadge note={claim.note} /> : null}
    </>
  );
}
