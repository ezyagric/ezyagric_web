import Image from "next/image";
import type { Product } from "@/lib/content";
import { Section } from "@/components/ui/Container";
import type { BandTone } from "./tones";

/**
 * A real photo from the EzyAgric photo library (Ugandan farmers, agents and
 * gardens) with its caption beside it from md up. Portrait photos are kept
 * narrower so they never fill a whole screen. Lazy-loaded: it is always
 * well below the fold.
 */
export function ProductPhoto({ product, tone }: { product: Product; tone: BandTone }) {
  const photo = product.photo;
  if (!photo) return null;

  const { image, caption } = photo;
  const portrait = image.height > image.width;

  return (
    <Section id="in-the-field" tone={tone}>
      <figure className="grid items-center gap-6 md:grid-cols-2 md:gap-12">
        <div className={portrait ? "mx-auto w-full max-w-sm md:mr-0" : "w-full"}>
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            sizes={
              portrait
                ? "(min-width: 640px) 384px, calc(100vw - 32px)"
                : "(min-width: 1152px) 528px, (min-width: 768px) calc(50vw - 72px), calc(100vw - 32px)"
            }
            className="h-auto w-full rounded-lg"
          />
        </div>
        <figcaption className="max-w-md">
          {/* A short green accent rule (decorative). */}
          <span aria-hidden="true" className="mb-4 block h-1 w-12 rounded-full bg-leaf-500" />
          <span className="block text-2xl leading-snug font-semibold text-balance text-ink sm:text-3xl">
            {caption}
          </span>
        </figcaption>
      </figure>
    </Section>
  );
}
