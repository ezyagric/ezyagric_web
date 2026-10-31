import Image from "next/image";
import type { ImageData } from "@/lib/content";

/**
 * A simple phone outline (bg-inverse) around an app screenshot. The corner radii
 * are the device's geometry, not theme values, so they stay arbitrary. `preload` (Next 16's
 * replacement for the deprecated `priority`) is for the hero image only.
 * `size` "sm" keeps the same proportions on a phone about 150px wide.
 */
export function PhoneFrame({
  image,
  preload = false,
  size = "md",
  className = "w-64",
  sizes = "(min-width: 640px) 288px, 256px",
}: {
  image: ImageData;
  preload?: boolean;
  size?: "md" | "sm";
  className?: string;
  sizes?: string;
}) {
  const [outer, inner] =
    size === "sm" ? ["rounded-[1.5rem] p-1.5", "rounded-[1.125rem]"] : ["rounded-[2.5rem] p-2.5", "rounded-[2rem]"];
  return (
    <div
      className={`relative bg-inverse shadow-device ring-1 ring-inverse/10 ${outer} ${className}`}
    >
      <div className={`overflow-hidden bg-card ${inner}`}>
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
