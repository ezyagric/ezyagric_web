import type { ReactNode } from "react";
import { getSite, isVisible, visible } from "@/lib/content";
import { PORTAL_URL, playStoreUrl, telUrl, whatsappUrl } from "@/lib/links";
import { splitLinks } from "@/lib/richText";
import { KeepHyphensTogether } from "./KeepHyphens";
import { TextLink } from "./TextLink";

/**
 * Where a [words](target) link in copy goes on this build: pages and https
 * addresses as written; whatsapp, call, portal and get-app from the site's
 * contact details and links. null when the channel is hidden (an unconfirmed
 * WhatsApp number or phone), and the words then stay plain, as FAQ buttons
 * are dropped.
 */
export function inlineHref(target: string): string | null {
  const { contact } = getSite();
  switch (target) {
    case "whatsapp":
      return isVisible(contact.whatsapp) ? whatsappUrl(contact.whatsapp.number, contact.whatsapp.message) : null;
    case "call": {
      const phone = visible(contact.phones)[0];
      return phone ? telUrl(phone.number) : null;
    }
    case "portal":
      return PORTAL_URL;
    case "get-app":
      return playStoreUrl("general", "inline-link");
    default:
      return target;
  }
}

/** One link from copy, its words already rendered (`children`). */
export function InlineLink({ target, children }: { target: string; children: ReactNode }) {
  const href = inlineHref(target);
  return href ? (
    <TextLink href={href} linkTarget={target}>
      {children}
    </TextLink>
  ) : (
    <>{children}</>
  );
}

/**
 * A passage of copy with its [words](target) links, hyphenated words kept
 * whole ("Ka-Ezy" never breaks at its hyphen, in a link or not). For copy
 * without ==marks==; Highlight (components/home/parts) does both.
 */
export function RichText({ text }: { text: string }) {
  return splitLinks(text).map((piece, i) =>
    typeof piece === "string" ? (
      <KeepHyphensTogether key={i} text={piece} />
    ) : (
      <InlineLink key={i} target={piece.target}>
        <KeepHyphensTogether text={piece.label} />
      </InlineLink>
    ),
  );
}
