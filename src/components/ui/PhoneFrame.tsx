import Image from "next/image";
import type { ImageData } from "@/lib/content";

/**
 * A simple phone outline (bg-inverse) around an app screenshot. The corner radii
 * are the device's geometry, not theme values, so they stay arbitrary. `preload` (Next 16's
 * replacement for the deprecated `priority`) is for the hero image only.
 */
export function PhoneFrame({
  image,
  preload = false,
  className = "w-64",
  sizes = "(min-width: 640px) 288px, 256px",
}: {
  image: ImageData;
  preload?: boolean;
  className?: string;
  sizes?: string;
}) {
  return (
    <div
      className={`relative rounded-[2.5rem] bg-inverse p-2.5 shadow-device ring-1 ring-inverse/10 ${className}`}
    >
      <div className="overflow-hidden rounded-[2rem] bg-card">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          preload={preload}
          sizes={sizes}
          className="h-auto w-full"
        />
      </div>
    </div>
  );
}
