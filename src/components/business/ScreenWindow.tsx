import Image from "next/image";
import { ChevronRight, EyeOff, ZoomIn } from "lucide-react";
import type { Accent, ImageData } from "@/lib/content";
import { ACCENTS } from "@/components/ui/accents";

// The dashed frame round the part of the screen a loupe magnifies, in the
// module's colour. Full class strings so Tailwind finds them.
const FRAME: Record<Accent, string> = {
  brand: "border-brand",
  accent: "border-accent-bright",
  deep: "border-inverse",
};

const SHADOWS = {
  raised: "shadow-raised",
  // Deeper and softer, for the big screens that spill off a chapter's page.
  device: "shadow-[0_24px_48px_-12px_color-mix(in_srgb,var(--color-shade)_35%,transparent)]",
} as const;

/** "60.3% 49.9% 39.2% 39.6%" -> { left, top, width, height }. */
function regionStyle(region: string) {
  const [left, top, width, height] = region.split(" ");
  return { left, top, width, height };
}

/**
 * An EzyAgric Business screen in a plain browser window: a title bar with
 * three dots and the screen's name beside a dot in its module's colour,
 * then the screenshot at its own shape. The screens come with customers'
 * and staff names and phone numbers already blurred out.
 *
 * "sm" is the small window of the home page's four-module glimpse (below sm
 * it drops the dots, so a 122px window still shows the whole name); "md" is
 * a chapter's or the web portal's screen, which can also show a crumb
 * ("EzyAgric Business ›", from sm) and a dashed frame round a region: with a
 * zoom pin, what its loupe magnifies; with an eye pin ("blur"), the blurred
 * customer details (that pin from sm, where the frame is tall enough).
 */
export function ScreenWindow({
  image,
  label,
  accent,
  sizes,
  size = "md",
  crumb,
  region,
  pin = "zoom",
  ring = "ring-line",
  shadow = "raised",
  preload = false,
  className = "",
}: {
  image: ImageData;
  label: string;
  accent: Accent;
  sizes: string;
  size?: "sm" | "md";
  crumb?: string;
  /** "x% y% w% h%" of the screen. */
  region?: string;
  /** The region's pin: a zoom glyph (a loupe's detail) or a crossed-out eye (blurred details). */
  pin?: "zoom" | "blur";
  ring?: string;
  shadow?: keyof typeof SHADOWS;
  preload?: boolean;
  className?: string;
}) {
  const small = size === "sm";
  return (
    <div className={`overflow-hidden rounded-card bg-card ring-1 ${ring} ${SHADOWS[shadow]} ${className}`}>
      <div
        className={`flex items-center border-b border-line bg-subtle ${small ? "gap-2 px-2.5 py-1.5" : "gap-3 px-4 py-2.5"}`}
      >
        <span aria-hidden="true" className={`shrink-0 ${small ? "hidden gap-1 sm:flex" : "flex gap-1.5"}`}>
          {[0, 1, 2].map((dot) => (
            <span key={dot} className={`rounded-full bg-line ${small ? "size-1.5" : "size-2.5"}`} />
          ))}
        </span>
        <span
          className={`flex min-w-0 items-center gap-1.5 font-label text-title ${small ? "text-xs" : "text-sm"}`}
        >
          {crumb && !small ? (
            <>
              <span className="hidden text-muted sm:inline">{crumb}</span>
              <ChevronRight aria-hidden="true" className="hidden size-3.5 shrink-0 text-muted sm:inline" />
            </>
          ) : null}
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${ACCENTS[accent].bar}`} />
          <span className="truncate">{label}</span>
        </span>
      </div>
      <div className="relative">
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          sizes={sizes}
          preload={preload}
          className="h-auto w-full"
        />
        {region ? (
          <span
            aria-hidden="true"
            className={`pointer-events-none absolute rounded-control border-2 border-dashed forced-colors:border-[CanvasText] ${FRAME[accent]}`}
            style={regionStyle(region)}
          >
            <span
              className={`absolute top-1 right-1 size-6 items-center justify-center rounded-full bg-card text-secondary shadow-card ring-1 ring-line ${
                pin === "blur" ? "hidden sm:flex" : "flex"
              }`}
            >
              {pin === "blur" ? <EyeOff className="size-3.5" /> : <ZoomIn className="size-3.5" />}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
