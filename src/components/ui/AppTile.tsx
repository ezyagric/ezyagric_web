import Image from "next/image";
import type { Product } from "@/lib/content";
import { ACCENTS } from "./accents";
import { Icon } from "./Icon";

/**
 * A product's artwork as an app icon, as on the home page's service cards:
 * a white tile (the artwork is drawn on white), with a 4px margin that keeps
 * it clear of the round corners on small tiles. EzyCredits has no artwork:
 * its icon, white on its accent. Size and elevation come from `className`.
 */
export function AppTile({
  product,
  sizes,
  className,
}: {
  product: Product;
  /** The tile's rendered widths, for the image's `sizes`. */
  sizes: string;
  className: string;
}) {
  const image = product.card.image;

  if (image) {
    return (
      <span className={`block shrink-0 overflow-hidden rounded-tile bg-card p-1 ${className}`}>
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes={sizes}
          className="size-full object-contain"
        />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-tile ${ACCENTS[product.accent].icon} ${className}`}
    >
      <Icon name={product.icon} className="size-1/2" />
    </span>
  );
}
