import Link from "next/link";
import { ArrowDown, ArrowRight, PenLine } from "lucide-react";
import { getBusiness, visible } from "@/lib/content";
import { HeadlineText } from "@/components/home/parts";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ClaimText } from "@/components/ui/Pending";
import { PromiseDot, PromiseSeal, PromiseStamp } from "./PromiseMarks";

const LINK =
  "group mt-5 inline-flex min-h-11 items-center gap-2 rounded-control font-label text-link underline underline-offset-4 hover:decoration-2";

/**
 * The record book's front matter, between the white cover and the
 * chapters: one white sheet on a navy blotter ruled like ledger paper,
 * holding EzyAgric Business's two promises.
 * - Promise A (privacy and security), sealed with a blue wax seal: how we
 *   keep it, as numbered lines (A.1, A.2, ...), and a link to the policy.
 * - Promise B (no heavy upfront investment), stamped "Already built": a
 *   "build it yourself" estimate struck through line by line and corrected
 *   in pen, ending in a double-ruled total (Heavy, struck; Light), and a
 *   link to pricing.
 * The two clauses stack on phones (a double rule and an "&" plate between
 * them) and sit side by side from lg. Below the sheet, a key to the lock and
 * feather marks that recur further down the page. Pending lines show only
 * in preview, and the numbering follows what is shown.
 */
export function BusinessPromises() {
  const { name, promises: p } = getBusiness();
  const points = visible(p.privacy.points);
  const rows = visible(p.investment.rows);
  const listClass = "mt-2 border-y border-line";

  return (
    <Section
      id="promises"
      tone="inverse"
      labelledBy="promises-title"
      className="bg-[repeating-linear-gradient(to_bottom,transparent_0_2.25rem,color-mix(in_srgb,var(--color-on-inverse)_6%,transparent)_2.25rem_calc(2.25rem_+_1px))]"
    >
      <SectionHeader id="promises-title" invert wide eyebrow={p.eyebrow} title={p.title} intro={p.intro} />
      {/* The white sheet brings back the dark focus ring (the band's rule
          turns rings white on navy). No overflow clip: the seal rises above
          the sheet's top edge. */}
      <div className="grid rounded-media bg-card text-body shadow-raised ring-1 ring-on-inverse/10 [&_:focus-visible]:outline-focus lg:grid-cols-2">
        <article id="promise-privacy" aria-labelledby="promise-privacy-title" className="scroll-mt-36 p-5 sm:p-8 lg:p-10">
          {/* The seal sits beside the label, so the title keeps the full width. */}
          <div className="flex items-start justify-between gap-4">
            <p className="text-sm text-label-style text-label">{p.privacy.label}</p>
            <PromiseSeal className="-mt-12 size-16 shrink-0 -rotate-12 sm:-mt-14 sm:size-20 lg:-mt-16 lg:size-24" />
          </div>
          <h3
            id="promise-privacy-title"
            className="mt-2 text-3xl/[1.1] font-heading tracking-heading text-balance text-heading sm:text-4xl/[1.1]"
          >
            <HeadlineText text={p.privacy.title} className="text-accent-bright" />
          </h3>
          <p className="mt-4 text-lg text-pretty text-body">{p.privacy.lead}</p>
          <p className="mt-6 text-sm text-label-style text-muted">{p.privacy.listLabel}</p>
          {/* role="list": Safari drops the list role from unstyled lists. */}
          <ul role="list" className={`${listClass} divide-y divide-line`}>
            {points.map((point, i) => (
              <li key={point.label} className="flex gap-3 py-3 text-base text-pretty text-body">
                <span aria-hidden="true" className="w-9 shrink-0 pt-0.5 text-sm font-label tabular-nums text-brand">
                  A.{i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm text-label-style text-label">
                    {point.label}
                    <span className="sr-only">: </span>
                  </span>
                  <ClaimText claim={point} keepHyphens />
                </span>
              </li>
            ))}
          </ul>
          <Link
            prefetch={false}
            href={p.privacy.link.href}
            data-track="business_promise_click"
            data-track-promise="privacy"
            data-track-action="policy"
            data-track-position="business-promises"
            className={LINK}
          >
            {p.privacy.link.label}
            <ArrowRight aria-hidden="true" className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </article>

        <article
          id="promise-investment"
          aria-labelledby="promise-investment-title"
          className="relative scroll-mt-36 border-t-4 border-double border-brand-soft-strong p-5 pt-10 sm:p-8 sm:pt-12 lg:border-t-0 lg:border-l-4 lg:p-10"
        >
          {/* "&" on the double rule, like the wiring sheet's "or" plate. */}
          <span
            aria-hidden="true"
            className="absolute -top-0.5 left-1/2 flex size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-inverse text-xl font-heading text-on-inverse ring-4 ring-card forced-colors:border lg:top-1/2 lg:-left-0.5"
          >
            &amp;
          </span>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="text-sm text-label-style text-label">{p.investment.label}</p>
            <PromiseStamp kind="investment" size="md" decorative className="-rotate-6">
              {p.investment.stamp}
            </PromiseStamp>
          </div>
          <h3
            id="promise-investment-title"
            className="mt-2 text-3xl/[1.1] font-heading tracking-heading text-balance text-heading sm:text-4xl/[1.1]"
          >
            <HeadlineText text={p.investment.title} className="text-accent-bright" />
          </h3>
          <p className="mt-4 text-lg text-pretty text-body">{p.investment.lead}</p>
          <p className="mt-6 text-sm text-label-style text-muted">{p.investment.listLabel}</p>
          {/* role="list": Safari drops the list role from unstyled lists. */}
          <ul role="list" className={`${listClass} divide-y divide-dashed divide-line`}>
            {rows.map((row) => (
              <li key={row.instead} className="py-3">
                <p className="text-base text-pretty text-muted line-through decoration-accent-bright decoration-2">
                  <span className="sr-only">Instead of: </span>
                  {row.instead}
                </p>
                <p className="mt-1 flex gap-2 text-base font-label text-pretty text-title">
                  <PenLine aria-hidden="true" className="mt-1 size-4 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="sr-only">With {name}: </span>
                    <ClaimText claim={{ text: row.ezyagric, pending: row.pending, note: row.note }} keepHyphens />
                  </span>
                </p>
              </li>
            ))}
          </ul>
          <dl className="mt-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-1 rounded-card bg-subtle px-5 py-4">
            <dt className="text-sm text-label-style text-label">{p.investment.total.label}</dt>
            <dd className="flex items-baseline gap-3">
              <span className="sr-only">{`${p.investment.total.value}, not ${p.investment.total.struck.toLowerCase()}`}</span>
              <span aria-hidden="true" className="text-2xl/none font-heading text-muted line-through decoration-accent-bright decoration-2">
                {p.investment.total.struck}
              </span>
              {/* Large text, so accent-bright passes (3.7:1). */}
              <span aria-hidden="true" className="text-4xl/none font-heading tracking-heading text-accent-bright sm:text-5xl/none">
                {p.investment.total.value}
              </span>
            </dd>
          </dl>
          <p className="mt-3 text-sm text-pretty text-muted">{p.investment.footnote}</p>
          <a
            href={p.investment.link.href}
            data-track="business_promise_click"
            data-track-promise="investment"
            data-track-action="pricing"
            data-track-position="business-promises"
            className={LINK}
          >
            {p.investment.link.label}
            <ArrowDown aria-hidden="true" className="size-4 motion-safe:transition-transform motion-safe:group-hover:translate-y-0.5" />
          </a>
        </article>
      </div>

      <p className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-label text-on-inverse sm:mt-10">
        <span className="w-full sm:w-auto">{p.key.label}</span>
        <span className="inline-flex items-center gap-2">
          <PromiseDot kind="privacy" onDark className="" />
          {p.key.privacy}
        </span>
        <span className="inline-flex items-center gap-2">
          <PromiseDot kind="investment" onDark className="" />
          {p.key.investment}
        </span>
      </p>
    </Section>
  );
}
