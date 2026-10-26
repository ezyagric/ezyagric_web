import path from "node:path";
import { PRODUCT_SLUGS, getProduct } from "@/lib/content";
import {
  OG_ARTWORK,
  OG_CONTENT_TYPE,
  OG_SIZE,
  type OgArtwork,
  renderOgImage,
} from "@/components/seo/OgImage";

// Share image for each product page (/ka-ezy/, /agrishop/, ...).
// Static export needs every slug listed up front; each image is drawn at
// build time and written to out/<slug>/opengraph-image.

export const dynamic = "force-static";
export const alt = "An EzyAgric product: its name and what it does in the EzyAgric App";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export function generateStaticParams() {
  return PRODUCT_SLUGS.map((slug) => ({ slug }));
}

function isArtwork(name: string): name is OgArtwork {
  return name in OG_ARTWORK;
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return new Response("Not found", { status: 404 });

  // Same artwork as the product page hero, from its PNG original
  // (e.g. /images/products/agrishop.webp -> assets-src/app/agrishop.png).
  // Products without artwork (EzyCredits) get their icon in a circle.
  const heroImage = product.hero.image ?? product.card.image;
  const name = heroImage ? path.basename(heroImage.src, path.extname(heroImage.src)) : "";

  return renderOgImage({
    // "Agrishop · Inputs and services" -> "Inputs and services"
    eyebrow: product.hero.eyebrow.split("·").at(-1)?.trim() ?? product.hero.eyebrow,
    productName: product.name,
    headline: product.hero.headline,
    accent: product.accent,
    artwork: isArtwork(name) ? name : undefined,
  });
}
