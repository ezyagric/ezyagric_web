import Image from "next/image";
import type { ImageData, Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import type { BandTone } from "./tones";

type Layout = { grid: string; items: { box: string; sizes: string }[] };

// Each photo's box and `sizes` by the number of photos. Landscape photos go
// first and last, portrait ones between. Full class strings so Tailwind can
// find them.
const LAYOUTS: Record<2 | 4, Layout> = {
  // Two: stacked on phones (3:2, then 4:5). From sm one row, the landscape
  // photo at 7/12 and 3:2, the portrait one as tall as it.
  2: {
    grid: "sm:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]",
    items: [
      { box: "aspect-[3/2]", sizes: "(min-width: 1024px) 640px, (min-width: 640px) 58vw, calc(100vw - 32px)" },
      { box: "aspect-[4/5] sm:aspect-auto", sizes: "(min-width: 1024px) 460px, (min-width: 640px) 42vw, calc(100vw - 32px)" },
    ],
  },
  // Four, a brick bento: on phones the landscape photos span both columns
  // (3:2 and 16:9) with the two portrait ones side by side at 4:5 between
  // them. From sm three columns: wide-narrow, then narrow-wide, every row
  // 2:1 tall on its wide photo.
  4: {
    grid: "grid-cols-2 sm:grid-cols-3",
    items: [
      { box: "col-span-2 aspect-[3/2] sm:aspect-[2/1]", sizes: "(min-width: 1024px) 730px, (min-width: 640px) 66vw, calc(100vw - 32px)" },
      { box: "aspect-[4/5] sm:aspect-auto", sizes: "(min-width: 1024px) 360px, (min-width: 640px) 33vw, 50vw" },
      { box: "aspect-[4/5] sm:aspect-auto", sizes: "(min-width: 1024px) 360px, (min-width: 640px) 33vw, 50vw" },
      { box: "col-span-2 aspect-video sm:aspect-[2/1]", sizes: "(min-width: 1024px) 730px, (min-width: 640px) 66vw, calc(100vw - 32px)" },
    ],
  },
};

/**
 * Real photos of the service at work, in their own band after "what it
 * does" (Agrishop: its delivery bikes and team, and orders handed over).
 * Two or four photos; each is cropped round its `focus` where its box has
 * another shape.
 */
export function PhotoGallery({ product, tone }: { product: Product; tone: BandTone }) {
  const { gallery } = product;
  if (!gallery) return null;
  const layout = LAYOUTS[gallery.images.length === 4 ? 4 : 2];

  return (
    <Section id="gallery" tone={tone} labelledBy="gallery-title">
      <SectionHeader id="gallery-title" eyebrow={gallery.eyebrow} title={gallery.title} intro={gallery.intro} />
      <div className={`grid gap-4 lg:gap-6 ${layout.grid}`}>
        {gallery.images.map((image, i) => (
          <Photo key={image.src} image={image} {...layout.items[i]} />
        ))}
      </div>
    </Section>
  );
}

function Photo({ image, box, sizes }: { image: ImageData; box: string; sizes: string }) {
  return (
    <div className={`relative overflow-hidden rounded-media shadow-card ${box}`}>
      {/* Lazy-loaded: below the fold. */}
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={sizes}
        className="object-cover"
        style={image.focus ? { objectPosition: image.focus } : undefined}
      />
    </div>
  );
}
