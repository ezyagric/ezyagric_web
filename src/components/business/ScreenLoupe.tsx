import Image from "next/image";
import { ZoomIn } from "lucide-react";
import type { LoupeData } from "@/lib/content";

/**
 * A magnified detail of a module's screen, overlapping the screen's corner
 * like a lens: a caption strip with a zoom glyph, then the detail. The
 * dashed frame on the screen (ScreenWindow's region) shows where it comes
 * from. Decoration: the screen's alt already describes it.
 */
export function ScreenLoupe({ loupe, ring, className = "" }: { loupe: LoupeData; ring: string; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`overflow-hidden rounded-card bg-card shadow-raised ring-4 forced-colors:border ${ring} ${className}`}
    >
      <p className="flex items-center gap-2 border-b border-line bg-subtle px-3 py-1.5 text-sm font-label text-pretty text-title">
        <ZoomIn className="size-3.5 shrink-0 text-secondary" />
        {loupe.caption}
      </p>
      <Image
        src={loupe.src}
        alt=""
        width={loupe.width}
        height={loupe.height}
        sizes="(min-width: 1152px) 375px, (min-width: 1024px) calc(34vw - 18px), (min-width: 768px) calc(75vw - 60px), (min-width: 640px) calc(75vw - 84px), calc(88vw - 63px)"
        className="h-auto w-full"
      />
    </div>
  );
}
