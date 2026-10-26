// Outbound links. Play Store links carry an install referrer so Play Console
// can attribute installs to the page and button that sent them.

export const FARMER_APP_ID = "com.ezyagric.extension.android";
export const AGENT_APP_ID = "com.ezyagric.extension.agent.android";
export const PORTAL_URL = "https://sso.ezyagric.com";

export function playStoreUrl(
  campaign: string,
  medium: string,
  appId: string = FARMER_APP_ID,
): string {
  // The referrer value must be URL-encoded as a whole, or its "&"s would
  // split the Play URL and attribution would be lost.
  const referrer = encodeURIComponent(
    `utm_source=website&utm_medium=${medium}&utm_campaign=${campaign}`,
  );
  return `https://play.google.com/store/apps/details?id=${appId}&referrer=${referrer}`;
}

/** "+256 708 383 845" -> "256708383845" */
export function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function whatsappUrl(phone: string, text?: string): string {
  const base = `https://wa.me/${digitsOnly(phone)}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

export function telUrl(phone: string): string {
  return `tel:+${digitsOnly(phone)}`;
}

export function mailUrl(email: string, subject?: string): string {
  return subject
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}`
    : `mailto:${email}`;
}
