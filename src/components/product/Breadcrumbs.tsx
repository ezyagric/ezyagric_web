import Link from "next/link";
import { ChevronRight, House } from "lucide-react";
import type { Accent } from "@/lib/content";
import { SITE_URL } from "@/lib/env";
import { ACCENTS } from "@/components/ui/accents";
import { Container } from "@/components/ui/Container";

/**
 * Home › page as one slim pill, like the header's menu: Home on the tinted
 * track, the current page (a product, or EzyAgric Business) on a white
 * segment with its colour dot. The same trail goes out as BreadcrumbList structured data so
 * search results can show it. On the canvas colour, like the hero below
 * it, so the two read as one block.
 */
export function Breadcrumbs({ name, path, accent }: { name: string; path: string; accent: Accent }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name,
        item: `${SITE_URL}${path}`,
      },
    ],
  };

  return (
    <>
      {/* pb-1.5 keeps Home's 44px tap area inside the nav. */}
      <nav aria-label="Breadcrumb" className="bg-canvas pt-3 pb-1.5 sm:pt-4">
        <Container>
          <ol className="flex w-fit max-w-full items-center gap-1 rounded-pill border border-line bg-subtle p-0.5 text-sm">
            <li className="flex shrink-0 items-center gap-1">
              {/* A 28px pill; an invisible strip (before:) stretches its tap area to 44px. */}
              <Link
                prefetch={false}
                href="/"
                className="relative inline-flex h-7 items-center gap-1.5 rounded-pill px-3 font-label text-muted transition-colors before:absolute before:inset-x-0 before:-inset-y-2 hover:bg-card hover:text-link"
              >
                <House aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
                Home
              </Link>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
            </li>
            <li className="min-w-0">
              <span
                aria-current="page"
                className="flex h-7 items-center gap-2 rounded-pill bg-card px-3 font-heading text-title shadow-card"
              >
                <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${ACCENTS[accent].bar}`} />
                <span className="truncate">{name}</span>
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
