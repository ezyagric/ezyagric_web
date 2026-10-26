import { SHOW_PENDING } from "@/lib/env";
import type { Claim } from "@/lib/content";

/**
 * Marks copy that the EzyAgric team still has to confirm. Only rendered in
 * preview/staging builds; the note says what needs confirming.
 */
export function PendingBadge({ note }: { note?: string }) {
  if (!SHOW_PENDING) return null;
  return (
    <span
      className="ml-1.5 inline-flex cursor-help items-center gap-1 rounded-full border border-dashed border-amber-700 bg-amber-50 px-2 py-0.5 align-middle text-[11px] font-bold tracking-wide text-amber-700 uppercase"
      title={note ?? "Waiting for confirmation from the EzyAgric team"}
    >
      To confirm
      {note ? <span className="sr-only">: {note}</span> : null}
    </span>
  );
}

/** Renders a claim's text, with a badge if pending. Hidden in production when pending. */
export function ClaimText({ claim }: { claim: Claim }) {
  if (claim.pending && !SHOW_PENDING) return null;
  return (
    <>
      {claim.text}
      {claim.pending ? <PendingBadge note={claim.note} /> : null}
    </>
  );
}
