import { fill, formatAcres, type Profile, type TryIt } from "./personalise";
import type { PlanResult } from "./store";

type PlanCopy = TryIt["plan"];

/** "2026-11-03" -> a local date (no time zone shift). */
function parseDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** "Week of 3 Nov" */
function weekOf(start: Date, weeks: number): string {
  const day = new Date(start);
  day.setDate(day.getDate() + weeks * 7);
  return `Week of ${day.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
}

export function todayPlus(days: number): string {
  const day = new Date();
  day.setDate(day.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}`;
}

/**
 * The sample costed plan, as Ka-Ezy lays it out in the app: each stage on its
 * week from the planting date, costs scaled to the land size, chosen services
 * added, then the expected harvest, income and profit.
 */
export function buildPlan({
  copy,
  crop,
  profile,
  acres,
  startDate,
  variety,
  services,
}: {
  copy: PlanCopy;
  crop: PlanCopy["crops"][number];
  profile: Profile;
  acres: number;
  startDate: string;
  variety: string;
  services: string[];
}): PlanResult {
  const start = parseDate(startDate);
  const rows = crop.stages.map((stage) => ({
    date: weekOf(start, stage.week),
    label: stage.label,
    cost: Math.round(stage.perAcreUgx * acres),
  }));
  for (const option of copy.serviceOptions) {
    if (!services.includes(option.key)) continue;
    const cost = (option.flatUgx ?? 0) + (option.perAcreUgx ?? 0) * acres;
    rows.push({ date: "Season", label: option.label, cost: Math.round(cost) });
  }
  const total = rows.reduce((sum, row) => sum + row.cost, 0);
  const amount = Math.round(crop.harvest.perAcre * acres * 10) / 10;
  const income = Math.round(crop.harvest.perAcre * acres * crop.harvest.priceUgx);
  return {
    title: fill(copy.title, { ...profile, valueChain: crop.crop, acres: formatAcres(acres) }),
    startDate,
    variety,
    rows,
    total,
    harvest: { amount, unit: crop.harvest.unit, income },
    profit: income - total,
  };
}
