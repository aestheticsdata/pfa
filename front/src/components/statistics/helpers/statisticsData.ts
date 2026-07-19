import { CATEGORY_FALLBACK } from "@components/categories/helpers/categoryColors";

import type { StatisticsResponse } from "@src/schemas/stats";

/** French month abbreviations, matching the labels the /statistics API returns. */
export const MONTHS_FR = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

type StatData = StatisticsResponse["data"];
type Row = StatData[string][number];

const toNumber = (value: string | number | undefined): number =>
  typeof value === "number" ? value : Number(value) || 0;

const rowTotal = (row: Row): number =>
  Object.entries(row).reduce(
    (sum, [key, value]) => (key === "month" ? sum : sum + toNumber(value as string | number)),
    0,
  );

const rowsForYear = (data: StatData | undefined, year: number): Row[] => data?.[String(year)] ?? [];

/** 12-slot array (Jan→Dec) of the total spend per month for `year`. */
export const monthlyTotals = (data: StatData | undefined, year: number): number[] => {
  const totals = Array<number>(12).fill(0);
  rowsForYear(data, year).forEach((row, i) => {
    const idx = MONTHS_FR.indexOf(String(row.month));
    totals[idx >= 0 ? idx : i] = rowTotal(row);
  });
  return totals;
};

export const yearTotal = (data: StatData | undefined, year: number): number =>
  monthlyTotals(data, year).reduce((a, b) => a + b, 0);

/**
 * 12-slot mask (Jan→Dec) of which months `year` has any data for. `/statistics`
 * only emits a row for a month once it has a spending, so this tells a real
 * zero-spend month apart from a no-data one — the projection chain needs the
 * distinction to know whether a reference month actually exists.
 */
export const monthlyPresence = (data: StatData | undefined, year: number): boolean[] => {
  const present = Array<boolean>(12).fill(false);
  rowsForYear(data, year).forEach((row, i) => {
    const idx = MONTHS_FR.indexOf(String(row.month));
    present[idx >= 0 ? idx : i] = true;
  });
  return present;
};

/**
 * Turns a sparse 12-slot monthly income series (null where the user has no
 * dashboard row) into a continuous one by carrying the last known value forward
 * and back-filling the leading gap — income is assumed to persist until changed.
 * Returns null when there is no income at all, so the caller draws no line
 * (COS-50 budget line).
 */
export const filledMonthlyIncome = (income: (number | null)[]): number[] | null => {
  if (!income.some((v) => v !== null)) return null;
  const out: (number | null)[] = income.slice(0, 12);
  while (out.length < 12) out.push(null);

  let carry: number | null = null;
  for (let i = 0; i < 12; i += 1) {
    if (out[i] !== null) carry = out[i];
    else out[i] = carry;
  }
  // Back-fill any leading months before the first known value.
  carry = null;
  for (let i = 11; i >= 0; i -= 1) {
    if (out[i] !== null) carry = out[i];
    else out[i] = carry;
  }
  return out as number[];
};

/** Round up to a "nice" axis ceiling (1, 1.5, 2, 3, 4, 5, 7.5, 10 × 10ⁿ). */
export const niceCeil = (value: number): number => {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const steps = [1, 1.5, 2, 3, 4, 5, 7.5, 10];
  const normalized = value / magnitude;
  const step = steps.find((s) => s >= normalized) ?? 10;
  return step * magnitude;
};

/** Index of the largest value (0 on empty input / first on ties). */
export const maxIndex = (values: number[]): number =>
  values.reduce((best, value, i) => (value > values[best] ? i : best), 0);

/** Running-sum series, same length as the input. */
export const cumulative = (values: number[]): number[] => {
  const out: number[] = [];
  values.reduce((acc, value) => {
    const next = acc + value;
    out.push(next);
    return next;
  }, 0);
  return out;
};

export interface CategoryTotal {
  name: string;
  value: number;
  color: string;
}

/** Total per category for `year`, sorted descending. */
export const perCategoryTotals = (
  data: StatData | undefined,
  colors: Record<string, string>,
  year: number,
): CategoryTotal[] => {
  const totals = new Map<string, number>();
  rowsForYear(data, year).forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (key === "month") return;
      totals.set(key, (totals.get(key) ?? 0) + toNumber(value as string | number));
    });
  });
  return Array.from(totals.entries())
    .map(([name, value]) => ({ name, value, color: colors[name] ?? CATEGORY_FALLBACK }))
    .sort((a, b) => b.value - a.value);
};

/** 12-slot monthly series for a single category in `year`. */
export const categoryMonthly = (data: StatData | undefined, year: number, name: string): number[] => {
  const out = Array<number>(12).fill(0);
  rowsForYear(data, year).forEach((row, i) => {
    const idx = MONTHS_FR.indexOf(String(row.month));
    out[idx >= 0 ? idx : i] = toNumber(row[name] as string | number);
  });
  return out;
};

/**
 * Months to divide by for a monthly average: elapsed months for the current
 * year, the full 12 for a past year, 1 as a floor.
 */
export const elapsedMonths = (year: number, now: Date): number => {
  const currentYear = now.getFullYear();
  if (year < currentYear) return 12;
  if (year > currentYear) return 1;
  return now.getMonth() + 1;
};
