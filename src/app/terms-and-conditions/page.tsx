import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { getLegal } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";

const TITLE = "Terms and conditions | EzyAgric";
const DESCRIPTION =
  "The terms on which Akorion Company Limited, trading as EzyAgric, provides the EzyAgric mobile app, Ka-Ezy and its other Services.";

// A file-based share image only applies to its own route segment, and this
// page's openGraph replaces the inherited one, so point at the site's share
// image (src/app/opengraph-image.tsx) explicitly.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms-and-conditions/" },
  openGraph: {
    ...pageOpenGraph({ url: "/terms-and-conditions/", title: TITLE, description: DESCRIPTION }),
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

export default function TermsPage() {
  return <LegalDocument doc={getLegal("terms-and-conditions")} path="/terms-and-conditions/" />;
}
