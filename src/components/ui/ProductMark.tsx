import Image from "next/image";
import type { Product } from "@/lib/content";
import { ACCENTS } from "./accents";
import { Icon } from "./Icon";

/**
 * A product's artwork from the app when it has one (Ka-Ezy, Agrishop,
 * Produce Market), on a card tile (bg-card, border-line). Otherwise
 * (EzyCredits) its icon in the guide's icon style, like IconCircle: a white
 * glyph in a solid circle of the product's accent (inverse for EzyCredits),
 * here the same size as the artwork tiles.
 */
export function ProductMark({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-14" : "size-24";
  const image = product.card.image;

  if (image) {
    return (
      // The artwork is drawn on white, so the tile uses the card colour (white).
      <div className={`${box} shrink-0 overflow-hidden rounded-card border border-line bg-card`}>
        <Image
          src={image.src}
          alt=""
          width={image.width}
          height={image.height}
          sizes={size === "sm" ? "56px" : "96px"}
          className="size-full object-contain"
        />
      </div>
    );
  }
  return (
    <div
      className={`${box} flex shrink-0 items-center justify-center rounded-full ${ACCENTS[product.accent].icon}`}
    >
      <Icon name={product.icon} className={size === "sm" ? "size-7" : "size-11"} />
    </div>
  );
}
