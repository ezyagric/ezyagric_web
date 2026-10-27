import { getSite, isVisible, visible, type FaqAction, type IconName } from "@/lib/content";
import { telUrl, whatsappUrl } from "@/lib/links";
import { GET_THE_APP_ID, kaezyPayHref, kaezyTryHref } from "@/components/promo/KaEzyBanner";

export type ResolvedFaqAction = { kind: FaqAction["kind"]; label: string; href: string; icon?: IconName };

const ICONS: Partial<Record<FaqAction["kind"], IconName>> = {
  "try-kaezy": "bot",
  "pay-kaezy": "wallet",
  "get-app": "smartphone",
  whatsapp: "message-circle",
  call: "phone",
};

/**
 * Where a FAQ button goes on this build. The Ka-Ezy links follow the banner's
 * targets (the demo and plans when shown, else the Ka-Ezy page); "get-app"
 * jumps to the store badges in the footer (every page has them). An action
 * whose target is hidden (an unconfirmed WhatsApp number or phone) is dropped.
 */
export function resolveFaqActions(actions: FaqAction[]): ResolvedFaqAction[] {
  const { contact } = getSite();
  const phone = visible(contact.phones)[0];
  return actions.flatMap((action) => {
    const href =
      action.kind === "try-kaezy" ? kaezyTryHref()
      : action.kind === "pay-kaezy" ? kaezyPayHref()
      : action.kind === "get-app" ? `#${GET_THE_APP_ID}`
      : action.kind === "whatsapp" ? (isVisible(contact.whatsapp) ? whatsappUrl(contact.whatsapp.number, contact.whatsapp.message) : null)
      : action.kind === "call" ? (phone ? telUrl(phone.number) : null)
      : (action.href ?? null);
    return href ? [{ kind: action.kind, label: action.label, href, icon: ICONS[action.kind] }] : [];
  });
}
