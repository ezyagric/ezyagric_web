import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { buttonClasses } from "@/components/ui/Button";
import { CookieSettingsButton } from "@/components/analytics/CookieSettingsButton";
import { GA_ENABLED } from "@/components/analytics/config";
import { getLegal } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";

const TITLE = "Privacy policy | EzyAgric";
const DESCRIPTION =
  "How Akorion Company Limited, trading as EzyAgric, collects, uses, shares and protects your personal data.";

// A file-based share image only applies to its own route segment, and this
// page's openGraph replaces the inherited one, so point at the site's share
// image (src/app/opengraph-image.tsx) explicitly.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy-policy/" },
  openGraph: {
    ...pageOpenGraph({ url: "/privacy-policy/", title: TITLE, description: DESCRIPTION }),
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "EzyAgric: Ka-Ezy, Agrishop, EzyCredits and Produce Market in one app for farmers and agribusinesses",
      },
    ],
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument doc={getLegal("privacy-policy")} path="/privacy-policy/">
      {/* A control of this website, not part of the policy's text. */}
      {GA_ENABLED ? (
        <p className="mt-8">
          <CookieSettingsButton className={buttonClasses("secondary")}>Change cookie settings</CookieSettingsButton>
        </p>
      ) : null}
    </LegalDocument>
  );
}
