import type { ReactNode } from "react";
import { KeepHyphensTogether } from "./KeepHyphens";
import { RichText } from "./RichText";

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
  canvas: "bg-canvas",
  subtle: "bg-subtle",
  /** Dark Navy band. */
  inverse: "bg-inverse text-on-inverse",
  /** The signature blue-green gradient (on-inverse text passes across it). */
  gradient: "gradient-brand text-on-inverse",
} as const;

/** A full-width page band with consistent vertical rhythm. */
export function Section({
  id,
  tone = "canvas",
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
  wide = false,
  full = false,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
  align?: "left" | "center";
  /** On-inverse (white) text, for the navy and gradient bands (tinted whites fall
   *  below 4.5:1 on the green end of the gradient). */
  invert?: boolean;
  /** Room for a title and intro that should each stay on one line on desktop. */
  wide?: boolean;
  /** The whole width of the section, so the intro runs to the right edge of what sits below. */
  full?: boolean;
  children?: ReactNode;
}) {
  const centered = align === "center" ? "mx-auto text-center" : "";
  const width = full ? "" : wide ? "max-w-4xl" : "max-w-2xl";
  return (
    <div className={`mb-10 ${width} ${centered}`}>
      {eyebrow ? (
        <p
          className={`mb-2 text-sm text-label-style ${invert ? "text-on-inverse" : "text-label"}`}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={id}
        className={`text-3xl font-heading tracking-heading text-balance sm:text-4xl ${invert ? "text-on-inverse" : "text-heading"}`}
      >
        <KeepHyphensTogether text={title} />
      </h2>
      {intro ? (
        <p className={`mt-3 text-lg text-pretty ${invert ? "text-on-inverse" : "text-muted"}`}>
          <RichText text={intro} />
        </p>
      ) : null}
      {children}
    </div>
  );
}
