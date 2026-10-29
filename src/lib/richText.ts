// Links inside content copy: [words](target). Pure (no data, no hooks), so the
// content validator, server components and client components can all use it.
//
// A target is a page on this site ("/agrishop/", "/ezyagric-business/#connect",
// "/#contact-us"), an https address, or a channel resolved per build in
// components/ui/RichText.tsx: whatsapp, call, portal (Partner login) or
// get-app (Google Play). ==marks== go round a whole link, never inside it:
// "==[private and secure](/ezyagric-business/#promise-privacy)==".

/** [label](target): labels hold no brackets; targets no spaces or brackets. */
export const LINK = /\[([^[\]\n]+)\]\(([^()\s]+)\)/g;

export const LINK_CHANNELS = ["whatsapp", "call", "portal", "get-app"] as const;

export type TextPiece = string | { label: string; target: string };

/** "Shop on [Agrishop](/agrishop/) today" -> ["Shop on ", { label, target }, " today"] */
export function splitLinks(text: string): TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  for (const match of text.matchAll(LINK)) {
    const at = match.index ?? 0;
    if (at > last) pieces.push(text.slice(last, at));
    pieces.push({ label: match[1], target: match[2] });
    last = at + match[0].length;
  }
  if (last < text.length) pieces.push(text.slice(last));
  return pieces;
}

/** Copy as plain text (share images, captions): links become their words and ==marks== go. */
export function plainText(text: string): string {
  return text.replace(LINK, "$1").replace(/==/g, "");
}

const INTERNAL = /^\/[a-z0-9/-]*(#[a-z0-9-]+)?$/;

/** What is wrong with the links in one string, given the site's pages ("/", "/agrishop/", ...). */
export function linkProblems(text: string, pages: readonly string[]): string[] {
  const problems: string[] = [];
  const links = [...text.matchAll(LINK)];
  if (links.length > 2) problems.push(`${links.length} links in one passage (two at most)`);
  for (const [, label, target] of links) {
    if (label.includes("=")) problems.push(`"${label}": put ==marks== round the whole link, not inside it`);
    const known =
      (LINK_CHANNELS as readonly string[]).includes(target) ||
      /^https:\/\/[^\s=]+$/.test(target) ||
      (INTERNAL.test(target) && pages.includes(target.split("#")[0]));
    if (!known) {
      problems.push(`"${target}" is not a page of this site, an https address or one of ${LINK_CHANNELS.join(", ")}`);
    }
  }
  if (text.replace(LINK, "").includes("](")) problems.push("a mistyped link: write [words](target)");
  return problems;
}
