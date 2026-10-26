import { getProducts, getSite } from "@/lib/content";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/seo/OgImage";

// Site-wide share image, used by every page without its own
// (product pages have app/[slug]/opengraph-image.tsx).
// Drawn once at build time; static export writes it to out/opengraph-image.

export const dynamic = "force-static";
export const alt = "EzyAgric: Ka-Ezy, Agrishop, EzyCredits and Produce Market in one farming app";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const site = getSite();
  const products = getProducts();
  // First sentence of the hero subline: "One app to plan, buy, pay and sell."
  const tagline = site.hero.subline.match(/^[^.!?]+[.!?]/)?.[0] ?? site.hero.subline;

  return renderOgImage({
    eyebrow: site.hero.eyebrow,
    headline: site.slogan,
    subline: tagline,
    accent: "brand",
    // Ka-Ezy, as in the home page hero (site.hero.mascot).
    artwork: "ka-ezy-full",
    chips: products.map((p) => p.name),
  });
}
