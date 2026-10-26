import { Check } from "lucide-react";
import { getProducts } from "@/lib/content";

// Small pieces shared by the home sections.

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Product names (from content/products) and UGX prices, as one capturing group. */
function pattern(): RegExp {
  const names = getProducts().map((p) => escapeRegExp(p.name));
  return new RegExp(`\\b(${[...names, String.raw`UGX\s?\d[\d,]*\d`].join("|")})`);
}

/**
 * Brand guide: "Vibrant Green highlights product names, prices and offers."
 * Renders the copy unchanged, with product names and UGX prices in green.
 * text-accent by default (5.1:1, safe at body size); pass text-accent-bright
 * only for large text.
 */
export function Highlight({
  text,
  className = "font-heading text-accent",
}: {
  text: string;
  className?: string;
}) {
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
