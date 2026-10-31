import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, FileDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { SITE_URL } from "@/lib/env";
import type { LegalBlock, LegalDoc } from "@/lib/content";
import { mailUrl, telUrl } from "@/lib/links";

const LINK = "font-label text-link underline underline-offset-4";

// Words in the documents that become links. The words stay exactly as Legal
// wrote them; "section 18" and the like stay plain, since many of them mean a
// section of the Act.
const PRIVACY_PATH = "/privacy-policy/";
const TERMS_PATH = "/terms-and-conditions/";
const LINKED = /(ezy@ezyagric\.com|www\.ezyagric\.com|www\.pdpo\.go\.ug|\+256 \d{3} \d{3} \d{3}|EzyAgric App Terms and Conditions|EzyAgric Privacy Policy)/;

function InDocLink({ text, path }: { text: string; path: string }) {
  if (text === "ezy@ezyagric.com") {
    return (
      <a href={mailUrl(text)} data-track="email_click" data-track-position={path} className={LINK}>
        {text}
      </a>
    );
  }
  if (text.startsWith("+256")) {
    return (
      <a href={telUrl(text)} data-track="call_click" data-track-position={path} className={`${LINK} whitespace-nowrap`}>
        {text}
      </a>
    );
  }
  if (text === "www.ezyagric.com") return <a href={SITE_URL} className={LINK}>{text}</a>;
  if (text === "www.pdpo.go.ug") {
    return (
      <a href="https://www.pdpo.go.ug" target="_blank" rel="noopener" className={LINK}>
        {text}
      </a>
    );
  }
  const target = text === "EzyAgric Privacy Policy" ? PRIVACY_PATH : TERMS_PATH;
  // The page's own name stays plain.
  if (target === path) return text;
  return (
    <Link prefetch={false} href={target} className={LINK}>
      {text}
    </Link>
  );
}

/** A document's text: its **bold** and its links. */
function Text({ text, path }: { text: string; path: string }) {
  return text.split(/\*\*(.+?)\*\*/).map((part, i) => {
    const runs = part
      .split(LINKED)
      .map((run, j) => (j % 2 === 1 ? <InDocLink key={j} text={run} path={path} /> : run));
    return i % 2 === 1 ? (
      <strong key={i} className="font-heading text-title">
        {runs}
      </strong>
    ) : (
      <span key={i}>{runs}</span>
    );
  });
}

/** Rows of a table; on phones, each row is a card of labelled cells (the roles keep it a table for screen readers). */
function DocTable({ table, path }: { table: Extract<LegalBlock, { table: unknown }>["table"]; path: string }) {
  const { caption, head, rows } = table;
  return (
    <figure className="mt-4">
      <figcaption className="text-sm font-heading text-title">{caption}</figcaption>
      <table role="table" className="mt-2 w-full border-collapse text-sm max-sm:block">
        <thead role="rowgroup" className="max-sm:sr-only">
          <tr role="row" className="bg-brand-soft text-left">
            {head.map((cell) => (
              <th key={cell} role="columnheader" scope="col" className="border border-line px-3 py-2 align-top font-heading text-title">
                {cell}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup" className="max-sm:block max-sm:space-y-2">
          {rows.map((row, r) => (
            <tr key={r} role="row" className="even:bg-subtle max-sm:block max-sm:rounded-control max-sm:border max-sm:border-line max-sm:p-3 max-sm:even:bg-card">
              {row.map((cell, c) => (
                <td
                  key={c}
                  role="cell"
                  data-label={head[c]}
                  className={`border-line px-3 py-2 align-top sm:border max-sm:block max-sm:p-0 max-sm:not-first:mt-2 max-sm:not-first:before:block max-sm:not-first:before:text-xs max-sm:not-first:before:font-label max-sm:not-first:before:text-muted max-sm:not-first:before:content-[attr(data-label)] ${
                    c === 0 ? "font-label text-title" : ""
                  }`}
                >
                  <Text text={cell} path={path} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Block({ block, path }: { block: LegalBlock; path: string }) {
  if ("table" in block) return <DocTable table={block.table} path={path} />;
  if ("list" in block) {
    return (
      <ul className="mt-2 space-y-1.5 sm:pl-12">
        {block.list.map((item) => (
          <li key={item.label} className="grid grid-cols-[2rem_minmax(0,1fr)]">
            <span className="text-muted">{item.label}</span>
            <span>
              <Text text={item.text} path={path} />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if ("clause" in block) {
    return (
      <p className="mt-3 grid grid-cols-[2.75rem_minmax(0,1fr)] sm:grid-cols-[3rem_minmax(0,1fr)]">
        <span className="font-label text-title tabular-nums">{block.clause}</span>
        <span>
          <Text text={block.text} path={path} />
        </span>
      </p>
    );
  }
  // A clause's closing words, after its list.
  return (
    <p className="mt-2 pl-[2.75rem] sm:pl-12">
      <Text text={block.text} path={path} />
    </p>
  );
}

/**
 * A legal document as Legal issued it (content/legal/*.yaml): its title, its
 * summary, a contents list and its numbered sections, with the PDF to download
 * (the Terms promise a version to "read, download and print"). `children` goes
 * after the document: controls of this website, not part of its text.
 */
export function LegalDocument({ doc, path, children }: { doc: LegalDoc; path: string; children?: ReactNode }) {
  return (
    <div className="bg-subtle py-8 sm:py-14">
      <Container>
        {/* Card: bg-card, 1px border-line, rounded-card. */}
        <article className="mx-auto max-w-3xl rounded-card border border-line bg-card p-5 text-body sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-x-6">
            <Link prefetch={false} href="/" className="inline-flex min-h-12 items-center gap-2 font-label text-link hover:underline">
              <ArrowLeft aria-hidden="true" className="size-5" />
              Home
            </Link>
            <a
              href={doc.pdf.href}
              type="application/pdf"
              className="inline-flex min-h-12 items-center gap-2 font-label text-link hover:underline"
            >
              <FileDown aria-hidden="true" className="size-5" />
              Download PDF version ({doc.pdf.size})
            </a>
          </div>

          <h1 className="mt-4 text-3xl font-heading tracking-heading text-heading sm:text-4xl">{doc.title}</h1>
          <p className="mt-2 text-lg text-body">{doc.subtitle}</p>
          <p className="mt-2 text-sm font-label text-muted">{doc.version}</p>

          <section aria-labelledby="doc-summary" className="mt-6 rounded-card bg-brand-soft p-5 sm:p-6">
            <h2 id="doc-summary" className="text-xl font-heading sm:text-2xl">
              {doc.summary.title}
            </h2>
            <p className="mt-2">{doc.summary.intro}</p>
            <ul className="mt-3 list-disc space-y-2 pl-5 marker:text-accent-bright">
              {doc.summary.points.map((point) => (
                <li key={point}>
                  <Text text={point} path={path} />
                </li>
              ))}
            </ul>
          </section>

          <details className="group mt-4 rounded-card border border-line">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-card px-4 font-label text-title [&::-webkit-details-marker]:hidden">
              Contents ({doc.sections.length} sections)
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <nav aria-label="Contents" className="border-t border-line px-4 py-3">
              <ul className="space-y-1 sm:columns-2 sm:gap-6">
                {doc.sections.map((section, i) => (
                  <li key={section.title} className="break-inside-avoid">
                    <a href={`#section-${i + 1}`} className="inline-block py-1 text-sm text-link hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </details>

          {doc.sections.map((section, i) => (
            <section key={section.title} aria-labelledby={`section-${i + 1}`} className="mt-8">
              <h2 id={`section-${i + 1}`} className="text-xl font-heading sm:text-2xl">
                {section.title}
              </h2>
              {section.blocks.map((block, b) => (
                <Block key={b} block={block} path={path} />
              ))}
            </section>
          ))}

          {children}
        </article>
      </Container>
    </div>
  );
}
