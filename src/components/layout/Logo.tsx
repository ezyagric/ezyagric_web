/** EzyAgric wordmark (logo without the tagline). */
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static SVG, no optimisation needed
    <img
      src="/images/brand/ezyagric-wordmark.svg"
      alt="EzyAgric"
      width={963}
      height={200}
      className={className}
    />
  );
}
