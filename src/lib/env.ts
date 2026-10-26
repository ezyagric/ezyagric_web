// Build-time settings. A static export bakes these in, so staging and
// production are separate builds (see README "Environments").

export type SiteEnv = "preview" | "staging" | "production";

const raw = process.env.NEXT_PUBLIC_SITE_ENV;

export const SITE_ENV: SiteEnv =
  raw === "production" || raw === "staging" ? raw : "preview";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezyagric.com"
).replace(/\/$/, "");

/**
 * The Ka-Ezy guest demo endpoint for "Try Ka-Ezy" (README, "Ka-Ezy on the
 * website"), normally the same-origin path "/api/kaezy-demo" that nginx
 * proxies to the Ka-Ezy backend. Empty: the chat uses its sample answers.
 */
export const KAEZY_DEMO_API = (process.env.NEXT_PUBLIC_KAEZY_DEMO_API ?? "").trim();

/** Production hides claims still waiting for team confirmation. */
export const SHOW_PENDING = SITE_ENV !== "production";
