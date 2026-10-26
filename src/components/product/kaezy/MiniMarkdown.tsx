import { Fragment, type ReactNode } from "react";

type List = { kind: "ul"; items: string[] } | { kind: "ol"; items: string[] };
type Block = { kind: "p"; lines: string[] } | { kind: "h"; text: string } | List;

// **bold**, `code`, [text](https://...), ![alt](...) and *italic*.
const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|!?\[[^\]]+\]\([^)\s]+\)|\*[^*\s][^*]*\*)/g;

/** Inline Markdown in one line of text. */
function inline(text: string): ReactNode[] {
  return text
    .split(INLINE)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-heading text-title">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith("`") && part.endsWith("`")) {
        return (
          <code key={i} className="rounded-control bg-card px-1 text-[0.95em]">
            {part.slice(1, -1)}
          </code>
        );
      }
      const link = /^(!?)\[([^\]]+)\]\(([^)\s]+)\)$/.exec(part);
      if (link) {
        const [, image, label, url] = link;
        // Images show as their text; only http(s) links become links.
        if (image || !/^https?:\/\//i.test(url)) return label;
        return (
          <a key={i} href={url} target="_blank" rel="noopener nofollow ugc" className="font-label text-link underline">
            {label}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        );
      }
      if (part.length > 2 && part.startsWith("*") && part.endsWith("*")) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
}

/** Lines -> paragraphs, headings and lists. Tables read as "cell · cell" lines. */
function parse(text: string): Block[] {
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: List | null = null;
  const endParagraph = () => {
    if (paragraph.length > 0) blocks.push({ kind: "p", lines: paragraph });
    paragraph = [];
  };
  const endList = () => {
    if (list) blocks.push(list);
    list = null;
  };

  for (const raw of text.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    // Blank lines, rules (---) and table separator rows (|---|---|) end a block.
    if (!line || /^([-*_])\1{2,}$/.test(line) || /^\|?[\s:|-]+\|[\s:|-]*$/.test(line)) {
      endParagraph();
      endList();
      continue;
    }
    const heading = /^#{1,6}\s+(.*)$/.exec(line);
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (heading) {
      endParagraph();
      endList();
      blocks.push({ kind: "h", text: heading[1] });
    } else if (bullet || numbered) {
      endParagraph();
      const kind = bullet ? "ul" : "ol";
      const item = (bullet ?? numbered)![1];
      if (list && list.kind === kind) {
        list.items.push(item);
      } else {
        endList();
        list = kind === "ul" ? { kind: "ul", items: [item] } : { kind: "ol", items: [item] };
      }
    } else {
      endList();
      const cells = line.startsWith("|") ? line.replace(/^\||\|$/g, "").split("|").map((c) => c.trim()) : null;
      paragraph.push(cells ? cells.join(" · ") : line.replace(/^>\s?/, ""));
    }
  }
  endParagraph();
  endList();
  return blocks;
}

/**
 * The Markdown Ka-Ezy answers use: paragraphs, headings, "-" and "1." lists,
 * **bold**, *italic*, `code`, links and simple tables. It builds React
 * elements, never HTML, so an answer can't inject markup or scripts.
 */
export function MiniMarkdown({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {parse(text).map((block, i) => {
        if (block.kind === "h") {
          return (
            <p key={i} className="font-heading text-title">
              {inline(block.text)}
            </p>
          );
        }
        if (block.kind === "ul" || block.kind === "ol") {
          const List = block.kind;
          return (
            <List
              key={i}
              className={
                List === "ul"
                  ? "list-disc space-y-1 pl-5 marker:text-accent-bright"
                  : "list-decimal space-y-1 pl-5 marker:font-heading marker:text-accent"
              }
            >
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </List>
          );
        }
        return (
          <p key={i}>
            {block.lines.map((line, j) => (
              <Fragment key={j}>
                {j > 0 ? <br /> : null}
                {inline(line)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
