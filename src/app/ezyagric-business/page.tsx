import type { Metadata } from "next";
import { getBusiness } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";
import { BusinessAccess } from "@/components/business/BusinessAccess";
import { BusinessFaq } from "@/components/business/BusinessFaq";
import { BusinessHero } from "@/components/business/BusinessHero";
import { BusinessModules } from "@/components/business/BusinessModules";
import { BusinessPricing } from "@/components/business/BusinessPricing";
import { BusinessPromises } from "@/components/business/BusinessPromises";
import { Breadcrumbs } from "@/components/product/Breadcrumbs";
import { KaEzyBanner } from "@/components/promo/KaEzyBanner";

// EzyAgric Business (content/business.yaml): the four services for
// agribusiness enterprises, as a web portal or APIs. A static segment, so
// it wins over [slug].

const PATH = "/ezyagric-business/";

export function generateMetadata(): Metadata {
  const { seo } = getBusiness();
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical: PATH },
    // The share image comes from ./opengraph-image.tsx.
    openGraph: pageOpenGraph({ url: PATH, title: seo.title, description: seo.description }),
  };
}

export default function BusinessPage() {
  const { name, kaezyBanner } = getBusiness();
  return (
    <>
      <Breadcrumbs name={name} path={PATH} accent="brand" />
      <BusinessHero />
      {/* The two promises on navy, the record book's front matter straight
          after the white cover; the chapters then start tinted and the bands
          alternate. */}
      <BusinessPromises />
      <BusinessModules tone="subtle" />
      {/* Straight after EzyServices (Ka-Ezy for your farmers), whose chapter
          links down to it: what the enterprise's farmers get. No page prop,
          so Try opens the Ka-Ezy page, as on the other service pages. */}
      <KaEzyBanner id="kaezy-banner" position="ezyagric-business-page" intro={kaezyBanner?.intro} />
      <BusinessAccess tone="canvas" />
      <BusinessPricing tone="subtle" />
      <BusinessFaq tone="canvas" />
    </>
  );
}
