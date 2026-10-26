import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Product } from "@/lib/content";
import { SITE_URL } from "@/lib/env";
import { Container } from "@/components/ui/Container";

/**
 * Home › Product, plus the same trail as BreadcrumbList structured data so
 * search results can show it. On the canvas colour, like the hero below
 * it, so the two read as one block.
 */
export function Breadcrumbs({ product }: { product: Product }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.name,
        item: `${SITE_URL}/${product.slug}/`,
      },
    ],
  };

  return (
    <>
      <nav aria-label="Breadcrumb" className="bg-canvas">
        <Container>
          <ol className="flex flex-wrap items-center gap-x-1.5 text-sm">
            <li className="flex items-center gap-1.5">
              <Link prefetch={false}
                href="/"
                className="-mx-2 inline-flex min-h-12 items-center rounded-control px-2 font-label text-muted underline-offset-4 hover:text-link hover:underline"
              >
                Home
              </Link>
              <ChevronRight aria-hidden="true" className="size-4 text-muted" />
            </li>
            <li>
              <span aria-current="page" className="font-heading text-body">
                {product.name}
              </span>
            </li>
          </ol>
        </Container>
      </nav>
      <script
        type="application/ld+json"
        // Escape "<" so content can never close the script tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
