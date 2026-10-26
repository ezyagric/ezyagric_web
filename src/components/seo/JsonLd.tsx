import { getSite, visible } from "@/lib/content";
import { SITE_URL } from "@/lib/env";
import { FARMER_APP_ID } from "@/lib/links";

/**
 * Structured data for search engines. A plain <script> (not next/script):
 * JSON-LD is data, not code. "<" is escaped so content can never close the tag.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

/**
 * "Plot 5-7 Coral Crescent, Kololo" + "P.O. Box 6638, Kampala, Uganda"
 * -> PostalAddress. The last line is read as "[P.O. Box n,] town, country";
 * if it has another shape, the lines are kept as one street address.
 */
function postalAddress(lines: string[]) {
  const last = (lines.at(-1) ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const box = last[0]?.match(/^P\.?\s*O\.?\s*Box\s+(\S+)$/i);
  const rest = box ? last.slice(1) : last;
  if (lines.length < 2 || rest.length < 2) {
    return { "@type": "PostalAddress", streetAddress: lines.join(", ") };
  }
  const country = rest.at(-1);
  return {
    "@type": "PostalAddress",
    streetAddress: lines.slice(0, -1).join(", "),
    ...(box ? { postOfficeBoxNumber: box[1] } : {}),
    addressLocality: rest.at(-2),
    addressCountry: country === "Uganda" ? "UG" : country,
  };
}

/** Organization + MobileApplication, rendered once in the root layout. */
export function SiteJsonLd() {
  const site = getSite();
  const phone = visible(site.contact.phones)[0];
  const email = visible(site.contact.emails)[0];
  const orgId = `${SITE_URL}/#organization`;
  // Plain Play URL: structured data should not carry campaign tracking.
  const playUrl = `https://play.google.com/store/apps/details?id=${FARMER_APP_ID}`;

  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": orgId,
            name: site.name,
            legalName: site.legalName,
            url: `${SITE_URL}/`,
            logo: `${SITE_URL}/images/brand/ezyagric-logo.svg`,
            slogan: site.slogan,
            sameAs: site.social.map((s) => s.url),
            address: postalAddress(site.contact.address.lines),
            ...(phone || email
              ? {
                  contactPoint: {
                    "@type": "ContactPoint",
                    contactType: "customer support",
                    ...(phone ? { telephone: phone.number.replace(/\s+/g, "") } : {}),
                    ...(email ? { email: email.address } : {}),
                  },
                }
              : {}),
          },
          {
            "@type": "MobileApplication",
            name: "EzyAgric Farmer",
            operatingSystem: "ANDROID",
            applicationCategory: "BusinessApplication",
            url: playUrl,
            installUrl: playUrl,
            offers: { "@type": "Offer", price: "0", priceCurrency: "UGX" },
            publisher: { "@id": orgId },
          },
        ],
      }}
    />
  );
}
