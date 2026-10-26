// Shared by the consent banner (client) and the server components that
// decide whether to show a "Cookie settings" control. No "use client" here,
// so both sides can import it.

/** GA4 measurement ID ("G-XXXXXXX"). Empty means no analytics at all. */
export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? "").trim();

export const GA_ENABLED = GA_ID !== "";

/** Window event the "Cookie settings" buttons fire to reopen the banner. */
export const OPEN_CONSENT_EVENT = "ezyagric:open-cookie-settings";

/** localStorage key holding "granted" or "denied". */
export const CONSENT_STORAGE_KEY = "ezyagric-analytics-consent";
