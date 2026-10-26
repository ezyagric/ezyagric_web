import type { MetadataRoute } from "next";
import { SITE_ENV, SITE_URL } from "@/lib/env";

// Written to out/robots.txt at build time. Only the production build may be
// crawled; preview and staging builds ask every crawler to stay out.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  if (SITE_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
