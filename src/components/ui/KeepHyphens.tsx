/**
 * Text with its hyphenated words kept whole: "Ka-Ezy", "off-takers" or
 * "part-time" would otherwise break at the hyphen when a line wraps. Works
 * in server and client components (no hooks, no data).
 */
export function KeepHyphensTogether({ text }: { text: string }) {
  // split() with a capturing group puts the hyphenated words at odd indexes.
  return text.split(/(\S+-\S+)/).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className="whitespace-nowrap">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
