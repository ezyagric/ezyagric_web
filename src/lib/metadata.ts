import type { Metadata } from "next";
import { getSite } from "./content";

type OpenGraph = NonNullable<Metadata["openGraph"]>;

/**
 * Open Graph fields shared by every page. Next merges metadata shallowly, so
 * a page that sets `openGraph` replaces the layout's whole object; pages
 * build theirs with pageOpenGraph() to keep these fields. The share image
 * is not set here: it comes from the opengraph-image files in src/app.
 */
export const OPEN_GRAPH_BASE = {
  type: "website",
  siteName: getSite().name,
  locale: "en_UG",
} satisfies OpenGraph;

export function pageOpenGraph(page: {
  url: string;
  title?: string;
  description?: string;
}): OpenGraph {
  return { ...OPEN_GRAPH_BASE, ...page };
}
