import { getSite, isVisible, visible, type FaqAction, type IconName } from "@/lib/content";
import { PORTAL_URL, telUrl, whatsappUrl } from "@/lib/links";
import { kaezyPayHref } from "@/components/promo/KaEzyBanner";

/** "try-kaezy" and "get-app" need nothing resolved: FaqList draws them itself. */
export type ResolvedFaqAction =
  | { kind: "try-kaezy" }
  | { kind: "get-app" }
  | { kind: Exclude<FaqAction["kind"], "try-kaezy" | "get-app">; label: string; href: string; icon?: IconName };

const ICONS: Partial<Record<FaqAction["kind"], IconName>> = {
  "pay-kaezy": "wallet",
  whatsapp: "message-circle",
  call: "phone",
};

/**
 * Where a FAQ button goes on this build. "Pay for Ka-Ezy" follows the
 * banner's target (the plans in the demo when shown, else the price cards).
 * "portal" is Partner login. "try-kaezy" and "get-app" are drawn by FaqList as the site's one
 * TryKaEzyButton and the store badges, which find their own targets. An
 * action whose target is hidden (an unconfirmed WhatsApp number or phone)
 * is dropped.
 */
export function resolveFaqActions(actions: FaqAction[]): ResolvedFaqAction[] {
  const { contact } = getSite();
  const phone = visible(contact.phones)[0];
  return actions.flatMap((action): ResolvedFaqAction[] => {
    if (action.kind === "try-kaezy" || action.kind === "get-app") return [{ kind: action.kind }];
    const href =
      action.kind === "pay-kaezy" ? kaezyPayHref()
      : action.kind === "whatsapp" ? (isVisible(contact.whatsapp) ? whatsappUrl(contact.whatsapp.number, contact.whatsapp.message) : null)
      : action.kind === "call" ? (phone ? telUrl(phone.number) : null)
      : action.kind === "portal" ? PORTAL_URL
      : (action.href ?? null);
    // The content schema makes sure these kinds have a label.
    return href ? [{ kind: action.kind, label: action.label ?? "", href, icon: ICONS[action.kind] }] : [];
  });
}
