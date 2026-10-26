/**
 * The guide's signature wave: a logo-blue to Vibrant Green band along the
 * bottom edge, as on the campaign visuals. Place it last inside a `relative`
 * parent; it sits in front of the artwork, so Ka-Ezy and the phone stand in it
 * (which also hides the flat crop of Ka-Ezy's legs). `id` must be unique per page.
 */
export function Wave({ id, className = "h-16" }: { id: string; className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 1440 120"
      preserveAspectRatio="none"
      className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 block w-full ${className}`}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "var(--color-brand-700)" }} />
          <stop offset="1" style={{ stopColor: "var(--color-leaf-500)" }} />
        </linearGradient>
      </defs>
      <path
        d="M0 70C320 96 560 92 800 60C1040 28 1240 8 1440 24V120H0Z"
        fill={`url(#${id})`}
      />
      <path
        d="M0 96C320 122 560 118 800 86C1040 54 1240 34 1440 50"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.28"
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
