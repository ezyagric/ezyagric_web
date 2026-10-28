import { getBusiness } from "@/lib/content";
import { plainText } from "@/components/home/parts";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/components/seo/OgImage";

// Share image for /ezyagric-business/: the name, the hero headline and the
// four modules as tags, beside the EzyProduce dashboard on a laptop and
// tablet. Drawn once at build time.

export const dynamic = "force-static";
export const alt =
  "EzyAgric Business: EzySupplier, EzyProduce, EzyCredits and EzyServices for agribusiness enterprises, in a web portal or through APIs";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  const business = getBusiness();
  return renderOgImage({
    eyebrow: "For agribusiness enterprises",
    productName: business.name,
    headline: plainText(business.hero.headline),
    accent: "brand",
    artwork: "web-portal",
    chips: business.modules.items.map((module) => module.name),
  });
}
