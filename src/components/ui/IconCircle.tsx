import type { Accent, IconName } from "@/lib/content";
import { Icon } from "./Icon";

// Brand guide: "Icons sit in a solid circle — blue, green or navy — with a
// white glyph, or as an outline circle on light backgrounds."
const FILLS: Record<Accent | "outline", string> = {
  brand: "bg-brand text-on-brand",
  accent: "bg-accent-bright text-on-accent",
  deep: "bg-inverse text-on-inverse",
  outline: "border-2 border-secondary text-secondary",
};

const SIZES = {
  /** Inside small chips (the home hero's EzyAgric Business slide). */
  xs: { box: "size-6", icon: "size-3.5" },
  sm: { box: "size-9", icon: "size-[18px]" },
  md: { box: "size-12", icon: "size-6" },
  lg: { box: "size-16", icon: "size-8" },
} as const;

export function IconCircle({
  name,
  color = "brand",
  size = "md",
  className = "",
}: {
  name: IconName;
  color?: Accent | "outline";
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${s.box} ${FILLS[color]} ${className}`}
    >
      <Icon name={name} className={s.icon} />
    </span>
  );
}
