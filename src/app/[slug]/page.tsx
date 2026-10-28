import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getProduct, PRODUCT_SLUGS, visible, type Product } from "@/lib/content";
import { pageOpenGraph } from "@/lib/metadata";
import { Breadcrumbs } from "@/components/product/Breadcrumbs";
import { ProductHero } from "@/components/product/ProductHero";
import { FeatureGrid } from "@/components/product/FeatureGrid";
import { DemoVideos, hasDemoVideos } from "@/components/product/DemoVideos";
import { TryKaEzy, hasTryIt } from "@/components/product/kaezy/TryKaEzy";
import { PhotoGallery } from "@/components/product/PhotoGallery";
import { Steps } from "@/components/product/Steps";
import { Pricing } from "@/components/product/Pricing";
import { KeyFacts, hasKeyFacts } from "@/components/product/KeyFacts";
import { ProductVideos, productVideos } from "@/components/product/ProductVideos";
import { ProductFaq, hasFaq } from "@/components/product/ProductFaq";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import type { BandTone } from "@/components/product/tones";
import { KAEZY_BANNER_ID, KaEzyBanner } from "@/components/promo/KaEzyBanner";

// One static page per product: /ka-ezy/, /agrishop/, /ezycredits/,
// /produce-market/. Any other slug is a 404 (required for static export).
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return {};

  const url = `/${product.slug}/`;
  return {
    title: product.seo.title,
    description: product.seo.description,
    alternates: { canonical: url },
    // The share image comes from [slug]/opengraph-image.tsx, not from here.
    openGraph: pageOpenGraph({
      url,
      title: product.seo.title,
      description: product.seo.description,
    }),
  };
}

/**
 * The bands below the hero, in page order, skipping any the product has no
 * content for. Built as a list so white and tinted bands always alternate,
 * whichever optional sections a product has.
 */
function bands(product: Product): ((tone: BandTone) => ReactNode)[] {
  const list: ((tone: BandTone) => ReactNode)[] = [];
  const add = (show: boolean, render: (tone: BandTone) => ReactNode) => {
    if (show) list.push(render);
  };

  // Ka-Ezy: right after its banner (demo video, try, pay, download), the
  // try-and-hire section the banner links to, then a video of each feature.
  // The try section's plan picker replaces the price cards.
  const tryIt = hasTryIt(product);
  add(tryIt, (tone) => <TryKaEzy key="try-it" product={product} tone={tone} />);
  add(hasDemoVideos(product), (tone) => (
    <DemoVideos key="demo-videos" product={product} tone={tone} />
  ));
  add(visible(product.features.items).length > 0, (tone) => (
    <FeatureGrid key="features" product={product} tone={tone} />
  ));
  // Real photos of the service at work (Agrishop: delivery).
  add(!!product.gallery, (tone) => <PhotoGallery key="gallery" product={product} tone={tone} />);
  // On the other service pages, the Ka-Ezy banner after "what it does".
  add(product.slug !== "ka-ezy", () => (
    <KaEzyBanner key="kaezy-banner" id="kaezy-banner" position={`${product.slug}-page`} page={product.slug} />
  ));
  // How to get started, beside a real photo from the field when there is one.
  add(true, (tone) => <Steps key="steps" product={product} tone={tone} />);
  add(!tryIt && !!product.pricing && visible(product.pricing.tiers).length > 0, (tone) => (
    <Pricing key="pricing" product={product} tone={tone} />
  ));
  add(hasKeyFacts(product), (tone) => <KeyFacts key="key-facts" product={product} tone={tone} />);
  add(productVideos(product).length > 0, (tone) => (
    <ProductVideos key="videos" product={product} tone={tone} />
  ));
  add(hasFaq(product), (tone) => <ProductFaq key="faq" product={product} tone={tone} />);
  add(true, (tone) => <RelatedProducts key="related" product={product} tone={tone} />);
  return list;
}

export default async function ProductPage({ params }: PageProps<"/[slug]">) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) notFound();

  return (
    <>
      <Breadcrumbs name={product.name} path={`/${product.slug}/`} accent={product.accent} />
      <ProductHero product={product} />
      {/* On the Ka-Ezy page the banner comes straight after the hero: the demo
          video plays in it, beside Try, Pay and Download. */}
      {product.slug === "ka-ezy" ? <KaEzyBanner id={KAEZY_BANNER_ID} position="ka-ezy-page" page="ka-ezy" /> : null}
      {/* The hero is white, so the first band is tinted. */}
      {bands(product).map((render, i) => render(i % 2 === 0 ? "subtle" : "canvas"))}
    </>
  );
}
