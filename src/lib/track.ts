// Analytics events. Links and buttons declare events with data-track="name"
// (plus data-track-<param>="value"); src/components/analytics/ picks those up.
// Code that needs to send an event directly (e.g. the video player) calls track().
//
// Events only reach Google Analytics after the visitor accepts cookies;
// before that, or when no GA ID is configured, track() does nothing.

type Params = Record<string, string | number>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export function track(event: string, params: Params = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event, params);
}
