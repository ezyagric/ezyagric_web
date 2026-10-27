import { todayPlus } from "./plan";
import type { FarmRecord } from "./store";

// Turns "Sold 5 bags of maize for 600,000" into a farm record, for the demo
// (the real Ka-Ezy does this with its language model). Categories are the
// app's record categories, plus seeds, chicks and fingerlings, and pest
// control.

const CATEGORIES: [RegExp, string][] = [
  [/\b(fertili[sz]er|dap|urea|npk|manure|compost|feeds?)\b/i, "Feeds & Fertilizer"],
  [/\b(seeds?|seedlings?|suckers|cuttings|vines)\b/i, "Seeds & Planting"],
  [/\b(spray(ed|ing)?|pesticides?|herbicides?|fungicides?|chemicals?)\b/i, "Pest & Disease Control"],
  [/\b(vet|vaccin\w*|deworm\w*|drugs?|medicines?|treat\w*)\b/i, "Veterinary & Health"],
  [/\b(chicks|fingerlings)\b/i, "Chicks & Fingerlings"],
  [/\b(workers?|labou?r|weed(ed|ing)?|wages?|casuals?)\b/i, "Labour"],
  [/\b(plough(ed|ing)?|harrow\w*|clear(ed|ing)?|land preparation)\b/i, "Land Preparation"],
  [/\b(transport|boda|truck|lorry|delivery|fuel)\b/i, "Transport"],
  [/\b(harvest\w*|shell\w*|thresh\w*|dry(ing)?|bags|storage)\b/i, "Harvest & Post Harvest"],
  [/\b(hoe|panga|wheelbarrow|pump|tools?|equipment)\b/i, "Equipment & Tools"],
  [/\b(hire[ds]? (a )?tractor|tractor hire|rent(ed)?)\b/i, "Equipment Rental"],
];

// Counted things: "5 bags", "20 m of pipe" are quantities, not money.
const COUNTED = /^\s*(?:bags?|sacks?|kgs?|kilos?|tonnes?|tons?|litres?|liters?|crates?|trays?|chicks?|birds?|animals?|cows?|goats?|pigs?|workers?|people|acres?|plants?|seedlings?|days?|weeks?|months?|years?|metres?|meters?|of\b|each\b)/i;
const MONEY_BEFORE = /(?:\bfor|\bat|\bugx|\bush|\bshs?|\bpaid|\bcost|\bcosts|\bprice|\bgot|\bearned|\breceived|\bspent)\W*$/i;

type Amount = { value: number; money: boolean };

/**
 * The numbers in a sentence, in UGX, each marked as clearly money or not:
 * "600,000", "600.000", "UGX 45000", "for 600000", "120k", "1.5m",
 * "1.5 million" and "600 thousand" are money; years (2026), phone numbers
 * and counted things ("5 bags", "20 m of pipe") are not.
 */
function amounts(text: string): Amount[] {
  const found: Amount[] = [];
  const pattern = /(\d{1,3}(?:[,.]\d{3})+|\d+(?:\.\d+)?)\s*(million|mn|thousand|k|m)?\b/gi;
  for (const match of text.matchAll(pattern)) {
    const [whole, digits, rawUnit] = match;
    const before = text.slice(0, match.index);
    const after = text.slice(match.index + whole.length);
    const unit = rawUnit?.toLowerCase();
    // "20m of pipe" is metres.
    if (unit === "m" && /^\s*of\b/i.test(after)) continue;
    const grouped = /^\d{1,3}(?:[,.]\d{3})+$/.test(digits);
    const value = grouped ? Number(digits.replace(/[,.]/g, "")) : Number(digits);
    const scale =
      unit === "million" || unit === "mn" || unit === "m" ? 1_000_000 : unit === "thousand" || unit === "k" ? 1_000 : 1;
    const amount = Math.round(value * scale);
    const isYear = !unit && !grouped && /^(19|20)\d{2}$/.test(digits);
    const isPhone = !unit && !grouped && digits.replace(/\D/g, "").length >= 9;
    if (isYear || isPhone || (!unit && COUNTED.test(after))) continue;
    found.push({ value: amount, money: Boolean(unit) || grouped || MONEY_BEFORE.test(before) });
  }
  return found;
}

/** The money in a sentence: the clearly-money number, or a big plain one; times the count for "each". */
function amountOf(text: string): number {
  const numbers = amounts(text);
  const money = numbers.filter((n) => n.money);
  const pick = (money.length > 0 ? money : numbers.filter((n) => n.value >= 500)).sort((a, b) => b.value - a.value)[0];
  if (!pick) return 0;
  // "10 bags at 120k each" / "per bag": multiply by the count.
  const count = /\b(\d+)\s*(?:bags?|sacks?|kgs?|crates?|trays?|birds?|chicks?|animals?|cows?|goats?|pigs?)\b/i.exec(text);
  return count && /\b(each|per)\b/i.test(text) ? pick.value * Number(count[1]) : pick.value;
}

export function parseRecord(text: string): FarmRecord | null {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length < 4) return null;
  const income = /\b(sold|sell|sale|sales|received|earned|got paid|income)\b/i.test(clean);
  const expense = /\b(bought|buy|paid|pay|spent|spend|hired|cost|rent(ed)?)\b/i.test(clean);
  const amount = amountOf(clean);
  const activity = /\b(planted|sprayed|weeded|harvested|applied|vaccinated|dewormed|ploughed|mapped|fed)\b/i.test(clean);

  const type: FarmRecord["type"] | null =
    income && amount > 0 ? "income" : expense && amount > 0 ? "expense" : activity ? "activity" : null;
  if (!type) return null;
  const category =
    type === "income" ? "Sales" : (CATEGORIES.find(([pattern]) => pattern.test(clean))?.[1] ?? "Other");
  return {
    type,
    category,
    description: clean.charAt(0).toUpperCase() + clean.slice(1),
    amount: type === "activity" ? 0 : amount,
    date: todayPlus(0),
  };
}

export function totals(records: FarmRecord[]) {
  const income = records.filter((r) => r.type === "income").reduce((sum, r) => sum + r.amount, 0);
  const expenses = records.filter((r) => r.type === "expense").reduce((sum, r) => sum + r.amount, 0);
  return { income, expenses, profit: income - expenses };
}
