import type { Accent, IconName } from "@/lib/content";
import { IconCircle } from "@/components/ui/IconCircle";

/**
 * A small illustrative notification on a module's screen ("New order
 * received · From a merchant · just now"), like the toasts the home page
 * once showed beside the portal. No figures; decoration only (the chapter's
 * text says what the module does). The caller sets its display and place.
 */
export function StatusChip({
  status,
  accent,
  className = "",
}: {
  status: { icon: IconName; title: string; text: string };
  accent: Accent;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={`w-max max-w-[16rem] items-center gap-3 rounded-card bg-card py-2 pr-4 pl-2 shadow-raised ring-1 ring-line forced-colors:border ${className}`}
    >
      <IconCircle name={status.icon} color={accent} size="sm" />
      <span>
        <span className="block text-sm font-heading text-title">{status.title}</span>
        <span className="block text-sm text-muted">{status.text}</span>
      </span>
    </div>
  );
}
