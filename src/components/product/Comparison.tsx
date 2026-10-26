import { isVisible, type Product } from "@/lib/content";
import { Section, SectionHeader } from "@/components/ui/Container";
import { ClaimText } from "@/components/ui/Pending";
import type { BandTone } from "./tones";

type ComparisonData = NonNullable<Product["comparison"]>;

// Green highlight pill for a column's tagline ("Pay now"). leaf-700 on
// leaf-50 passes 4.5:1.
const TAGLINE =
  "inline-block rounded-full bg-leaf-50 px-3 py-0.5 text-sm font-semibold text-leaf-700";

/**
 * Rows whose every value may be shown. A row with a hidden (pending) value
 * is dropped in production rather than left with an empty cell, which
 * would read as "no" or "nothing".
 */
export function comparisonRows(comparison: ComparisonData) {
  return comparison.rows.filter((row) => row.values.every((value) => isVisible(value)));
}

/**
 * Side-by-side comparison. Phones get one card per column (label: value);
 * from md up it is a real table. Only one of the two is displayed, so
 * screen readers never hear it twice. Guide card style (white, line
 * border, 8px radius, navy titles) with each column's tagline as a green
 * highlight.
 */
export function Comparison({ product, tone }: { product: Product; tone: BandTone }) {
  const comparison = product.comparison;
  if (!comparison) return null;

  const { columns, title, intro } = comparison;
  const rows = comparisonRows(comparison);

  return (
    <Section id="compare" tone={tone} labelledBy="compare-title">
      <SectionHeader id="compare-title" title={title} intro={intro} />

      <ul className="grid gap-4 sm:grid-cols-2 md:hidden">
        {columns.map((column, ci) => (
          <li
            key={column.name}
            className="overflow-hidden rounded-lg border border-line bg-white"
          >
            <div className="border-b border-line bg-surface px-5 py-4">
              <h3 className="text-xl font-bold text-ink">{column.name}</h3>
              <p className="mt-1">
                <span className={TAGLINE}>{column.tagline}</span>
              </p>
            </div>
            <dl className="divide-y divide-line">
              {rows.map((row) => {
                const value = row.values[ci];
                return value ? (
                  <div key={row.label} className="px-5 py-3.5">
                    <dt className="text-sm font-bold text-muted">{row.label}</dt>
                    <dd className="mt-0.5 text-base text-ink">
                      <ClaimText claim={value} />
                    </dd>
                  </div>
                ) : null;
              })}
            </dl>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-lg border border-line bg-white md:block">
        <table className="w-full table-fixed border-collapse text-left">
          <caption className="sr-only">{title}</caption>
          <colgroup>
            <col className="w-1/5" />
            {columns.map((column) => (
              <col key={column.name} />
            ))}
          </colgroup>
          <thead>
            <tr className="border-b border-line bg-surface">
              <td className="p-5" />
              {columns.map((column) => (
                <th key={column.name} scope="col" className="p-5 align-bottom">
                  <span className="block text-xl font-bold text-ink">{column.name}</span>
                  <span className={`mt-1.5 ${TAGLINE}`}>{column.tagline}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row" className="p-5 align-top text-base font-bold text-ink">
                  {row.label}
                </th>
                {columns.map((column, ci) => {
                  const value = row.values[ci];
                  return (
                    <td key={column.name} className="p-5 align-top text-base text-ink">
                      {value ? <ClaimText claim={value} /> : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}
