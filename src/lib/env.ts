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
 * website"; docs/backend-tickets.md BT-01 and BT-02), normally the
 * same-origin path "/api/kaezy-demo" that nginx proxies to the Ka-Ezy
 * backend. Empty: the chat uses its sample answers.
 */
export const KAEZY_DEMO_API = (process.env.NEXT_PUBLIC_KAEZY_DEMO_API ?? "").trim();

/**
 * The EzyAgric Partner API, for "Try Ka-Ezy" signed in: the visitor signs in
 * with an organisation's code and their phone (or a sign-in link) and gets
 * the real Ka-Ezy (components/product/kaezy/partner.ts). Normally
 * "https://kaezy-api.ezyagric.com/partner"; it must also be allowed in the
 * Content-Security-Policy's connect-src (nginx/nginx.conf). Empty: no
 * sign-in.
 */
export const PARTNER_API = (process.env.NEXT_PUBLIC_PARTNER_API ?? "").trim().replace(/\/$/, "");

/**
 * The organisation a visitor with no organisation code joins when they sign
 * in from the website (EzyAgric's own, e.g. "ezyorg531207"). The sign-in
 * card then asks only for a name and phone; the code field is behind "I have
 * an organisation code". Empty: every visitor must type a code.
 */
export const PARTNER_DEFAULT_ORG = (process.env.NEXT_PUBLIC_PARTNER_DEFAULT_ORG ?? "").trim();

/**
 * The live count behind the home page's first impact number
 * (docs/backend-tickets.md BT-10), normally the same-origin path
 * "/api/impact" that nginx proxies to EzyCRM's read-only count. Empty: the
 * number shows as typed in content/site.yaml.
 */
export const IMPACT_API = (process.env.NEXT_PUBLIC_IMPACT_API ?? "").trim();

/** Production hides claims still waiting for team confirmation. */
export const SHOW_PENDING = SITE_ENV !== "production";
