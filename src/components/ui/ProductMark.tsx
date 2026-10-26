import Image from "next/image";
import type { Product } from "@/lib/content";
import { ACCENTS } from "./accents";
import { Icon } from "./Icon";

/**
 * A product's artwork from the app when it has one (Ka-Ezy, Agrishop,
 * Produce Market); otherwise its icon on an accent-tinted tile (EzyCredits).
 */
export function ProductMark({
  product,
  size = "md",
}: {
  product: Product;
  size?: "sm" | "md";
}) {
  const box = size === "sm" ? "size-14" : "size-24";
  const accent = ACCENTS[product.accent];
  const image = product.card.image;

  if (image) {
    return (
      <div className={`${box} shrink-0 overflow-hidden rounded-2xl ${accent.soft}`}>
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
    <div className={`${box} flex shrink-0 items-center justify-center rounded-2xl ${accent.soft} ${accent.text}`}>
      <Icon name={product.icon} className={size === "sm" ? "size-7" : "size-11"} />
    </div>
  );
}
