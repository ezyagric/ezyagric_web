import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/content";
import { SITE_URL } from "@/lib/env";

// Written to out/sitemap.xml at build time. URLs end in "/" to match
// trailingSlash: true, so search engines see the canonical address.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = ["/", ...getProducts().map((p) => `/${p.slug}/`), "/ezyagric-business/", "/privacy-policy/", "/terms-and-conditions/"];
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }));
}
