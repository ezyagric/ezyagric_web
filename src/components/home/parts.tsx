import { Check } from "lucide-react";
import { getProducts } from "@/lib/content";
import { plainText, splitLinks } from "@/lib/richText";
import { InlineLink } from "@/components/ui/RichText";

// Small pieces shared by the home sections.

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Product names (from content/products) and UGX prices, as one capturing group. */
function pattern(): RegExp {
  const names = getProducts().map((p) => escapeRegExp(p.name));
  return new RegExp(`\\b(${[...names, String.raw`UGX\s?\d[\d,]*\d`].join("|")})`);
}

/** Copy without its ==marker== signs and [links](...) (for share images and captions). */
export { plainText };

/** Product names and prices in green within one run of copy. */
function Names({ text, className }: { text: string; className: string }) {
  // split() with a capturing group puts the matches at odd indexes.
  const parts = text.split(pattern());
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          // nowrap: "Ka-Ezy" would otherwise break at its hyphen.
          <span key={i} className={`whitespace-nowrap ${className}`}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/**
 * One run of copy with its [words](target) links (components/ui/RichText):
 * the rest gets green product names and prices; inside a link the names
 * only stay whole, in the link's colour.
 */
function Run({ text, className }: { text: string; className: string }) {
  return (
    <>
      {splitLinks(text).map((piece, i) =>
        typeof piece === "string" ? (
          <Names key={i} text={piece} className={className} />
        ) : (
          <InlineLink key={i} target={piece.target}>
            <Names text={piece.label} className="" />
          </InlineLink>
        ),
      )}
    </>
  );
}

/**
 * A headline with product names and any ==key words== in green, without the
 * highlighter stroke: at headline size the colour carries it, as with the
 * home hero's "Ezy" and "Smart". For large text only (text-accent-bright).
 */
export function HeadlineText({ text, className }: { text: string; className: string }) {
  const runs = text.split(/==([^=]+)==/);
  return (
    <>
      {runs.map((run, i) =>
        i % 2 === 1 ? (
          <span key={i} className={className}>
            {run}
          </span>
        ) : (
          <Names key={i} text={run} className={className} />
        ),
      )}
    </>
  );
}

/**
 * Brand guide: "Vibrant Green highlights product names, prices and offers."
 * Renders the copy with product names and UGX prices in green, and any
 * ==key phrase== in the copy with a soft green highlighter stroke behind its
 * lower half (it wraps across lines cleanly). text-accent by default (5.1:1,
 * safe at body size); pass text-accent-bright only for large text. The copy
 * may carry [words](target) links, also inside a mark
 * ("==[private and secure](/ezyagric-business/#promise-privacy)==").
 */
export function Highlight({
  text,
  className = "font-heading text-accent",
}: {
  text: string;
  className?: string;
}) {
  // Odd indexes are the ==marked== phrases.
  const runs = text.split(/==([^=]+)==/);
  return (
    <>
      {runs.map((run, i) =>
        i % 2 === 1 ? (
          <mark
            key={i}
            // Short phrases stay on one line ("agro-inputs" would break at its hyphen).
            className={`bg-transparent bg-[linear-gradient(transparent_55%,var(--color-accent-soft-strong)_55%)] [box-decoration-break:clone] font-label text-title ${
              plainText(run).length <= 24 ? "whitespace-nowrap" : ""
            }`}
          >
            <Run text={run} className={className} />
          </mark>
        ) : (
          <Run key={i} text={run} className={className} />
        ),
      )}
    </>
  );
}

/** A white tick in a solid green circle (the guide's icon style), for lists. */
export function CheckDot() {
  return (
    <span
      aria-hidden="true"
      className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-accent-bright text-on-primary"
    >
      <Check className="size-3.5" strokeWidth={3} />
    </span>
  );
}
