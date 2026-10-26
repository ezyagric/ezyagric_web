import type { Product } from "@/lib/content";
import { PlayBadge } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ProductMark } from "@/components/ui/ProductMark";

/**
 * Closing band on the signature blue-to-green gradient (white text passes
 * across it): one line and the Play badge.
 */
export function ProductCtaBand({ product }: { product: Product }) {
  return (
    <section
      aria-labelledby="get-the-app-title"
      // The global focus outline is brand blue, which is hard to see on the
      // gradient; switch it to white here.
      className="brand-gradient text-white [&_:focus-visible]:outline-white"
    >
      <Container className="flex flex-col gap-6 py-12 sm:py-16 md:flex-row md:items-center md:justify-between md:gap-10">
        <div className="flex items-center gap-5">
          <div className="hidden rounded-lg bg-white p-1 sm:block">
            <ProductMark product={product} />
          </div>
          <div>
            <h2
              id="get-the-app-title"
              className="text-3xl font-bold tracking-tight text-balance text-white sm:text-4xl"
            >
              {product.cta.label}
            </h2>
            <p className="mt-2 max-w-xl text-lg text-pretty text-white">{product.card.summary}</p>
          </div>
        </div>
        <div className="shrink-0">
          <PlayBadge campaign={product.cta.campaign} medium="cta-band" />
        </div>
      </Container>
    </section>
  );
}
