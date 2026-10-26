// Brand Guide v1.0: the logo and the tagline "Endless farming possibilities"
// are one unit, so the site only uses the full lockup (mark + wordmark +
// tagline), never the wordmark on its own.
//
// - "color" on white or the near-white tint; "white" (reversed) on navy,
//   blue, green, the brand gradient and photos.
// - At least 140px wide on screen (h-11 = 142px).
// - Clear space of half the mark's height on every side. The mark is about
//   64% of the lockup's height, so leave about a third of the logo's height
//   around it (14px at h-11, 16px at h-12).
const SOURCES = {
  color: "/images/brand/ezyagric-logo.svg",
  white: "/images/brand/ezyagric-logo-white.svg",
} as const;

export function Logo({
  variant = "color",
  className = "h-11 w-auto",
  loading = "eager",
}: {
  variant?: keyof typeof SOURCES;
  className?: string;
  /** "lazy" for logos far down the page, so they are not preloaded. */
  loading?: "eager" | "lazy";
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      src={SOURCES[variant]}
      alt="EzyAgric: Endless farming possibilities"
      width={964}
      height={299}
      loading={loading}
      className={className}
    />
  );
}
