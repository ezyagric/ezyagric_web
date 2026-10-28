import Image from "next/image";
import { Paperclip } from "lucide-react";
import type { ImageData } from "@/lib/content";

/**
 * A field photo as a print clipped to the page: a white border, a soft
 * shadow and a paperclip across the top edge. The caller sets the size, the
 * tilt and where it shows. In the module chapters (from lg) and on the
 * quotation slip's stub.
 */
export function PhotoPrint({ image, sizes, className = "" }: { image: ImageData; sizes: string; className?: string }) {
  return (
    <div className={`relative rounded-card bg-card p-2 pb-3 shadow-raised ring-1 ring-line forced-colors:border ${className}`}>
      <div className="relative aspect-[4/3] overflow-hidden rounded-control">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          sizes={sizes}
          className="object-cover"
          style={image.focus ? { objectPosition: image.focus } : undefined}
        />
      </div>
      {/* Lucide draws the clip on the diagonal: -45deg stands it upright. */}
      <Paperclip
        aria-hidden="true"
        strokeWidth={2}
        className="absolute -top-5 left-6 size-10 -rotate-45 text-secondary"
      />
    </div>
  );
}
