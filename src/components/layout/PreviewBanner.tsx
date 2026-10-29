import { hasPendingContent } from "@/lib/content";
import { SHOW_PENDING, SITE_ENV } from "@/lib/env";

/**
 * Shown on preview/staging builds only, so reviewers know what the badges
 * mean, and only while some content still waits for confirmation: with
 * nothing pending there are no badges to explain (the EzyAgric team
 * confirmed everything on 29 Oct 2026). Mark an item `pending: true` again
 * and the banner comes back.
 */
export function PreviewBanner() {
  if (!SHOW_PENDING || !hasPendingContent()) return null;
  return (
    <div className="bg-review-soft text-center text-sm text-review">
      <p className="mx-auto max-w-6xl px-4 py-2">
        <strong className="font-heading capitalize">{SITE_ENV} build.</strong> Items marked{" "}
        <span className="rounded-pill border border-dashed border-review px-1.5 text-[11px] font-heading uppercase">
          To confirm
        </span>{" "}
        are waiting for the EzyAgric team and are hidden on the live site. Hover or tap a badge
        to see what&apos;s needed.
      </p>
    </div>
  );
}
