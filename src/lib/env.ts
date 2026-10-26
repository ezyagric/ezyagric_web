// Build-time settings. A static export bakes these in, so staging and
// production are separate builds (see README "Environments").

export type SiteEnv = "preview" | "staging" | "production";

const raw = process.env.NEXT_PUBLIC_SITE_ENV;

export const SITE_ENV: SiteEnv =
  raw === "production" || raw === "staging" ? raw : "preview";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://ezyagric.com"
).replace(/\/$/, "");

/** Production hides claims still waiting for team confirmation. */
export const SHOW_PENDING = SITE_ENV !== "production";
