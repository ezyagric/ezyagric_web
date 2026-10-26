"use client";

import { GA_ENABLED, OPEN_CONSENT_EVENT } from "./config";

/**
 * Reopens the analytics consent banner so visitors can change their choice.
 * Renders nothing when no GA ID is configured (there is nothing to consent to).
 */
export function CookieSettingsButton({
  className = "",
  children = "Cookie settings",
}: {
  className?: string;
  children?: string;
}) {
  if (!GA_ENABLED) return null;
  return (
    <button
      type="button"
      className={`cursor-pointer ${className}`}
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_EVENT))}
    >
      {children}
    </button>
  );
}
