import type { ReactNode } from "react";

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

const TONES = {
  white: "bg-white",
  surface: "bg-surface",
  /** Dark Navy band. */
  brand: "bg-brand-900 text-white",
  /** The signature blue-to-green gradient (white text passes across it). */
  gradient: "brand-gradient text-white",
} as const;

/** A full-width page band with consistent vertical rhythm. */
export function Section({
  id,
  tone = "white",
  className = "",
  labelledBy,
  children,
}: {
  id?: string;
  tone?: keyof typeof TONES;
  className?: string;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${TONES[tone]} py-14 sm:py-20 ${className}`}
    >
      <Container>{children}</Container>
    </section>
  );
}

/** Eyebrow + h2 + intro used at the top of most sections. */
export function SectionHeader({
  id,
  eyebrow,
  title,
  intro,
  align = "left",
  invert = false,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  /** White text, for the navy and gradient bands (tinted whites fall
   *  below 4.5:1 on the green end of the gradient). */
  invert?: boolean;
  children?: ReactNode;
}) {
  const centered = align === "center" ? "mx-auto text-center" : "";
  return (
    <div className={`mb-10 max-w-2xl ${centered}`}>
      {eyebrow ? (
        <p
          className={`mb-2 text-sm font-semibold tracking-[0.14em] uppercase ${invert ? "text-white" : "text-brand-700"}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={`text-3xl font-bold tracking-tight text-balance sm:text-4xl ${invert ? "text-white" : "text-brand-700"}`}
      >
        {title}
      </h2>
      {intro ? (
        <p className={`mt-3 text-lg text-pretty ${invert ? "text-white" : "text-muted"}`}>
          {intro}
        </p>
      ) : null}
      {children}
    </div>
  );
}
