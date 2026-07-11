import parseISO from "date-fns/parseISO";

import { elapsedMonths } from "@components/statistics/helpers/statisticsData";
import type { ExceptionalItem } from "@src/schemas/exceptionals";

export interface ExceptionalStats {
  total: number;
  count: number;
  biggest: { label: string; amount: number; date: Date } | null;
  average: number;
  spanMonths: number;
}

/**
 * Aggregate stats for the exceptionals cards.
 *
 * The monthly average is smoothed over the months actually elapsed: the current
 * year counts only its elapsed months (not a full 12), reusing `elapsedMonths`
 * so the "Moyenne / mois" figure stays aligned with the Statistiques page. For
 * "all years" (`year == null`), the divisor is the sum of the elapsed months of
 * every year the data spans, floored at 1 to avoid a division by zero.
 */
export const computeExceptionalStats = (
  items: ExceptionalItem[],
  year: number | null,
  now: Date,
): ExceptionalStats => {
  let total = 0;
  let biggest: { label: string; amount: number; date: Date } | null = null;
  const years = new Set<number>();
  for (const item of items) {
    const amount = Number(item.amount);
    total += amount;
    const date = parseISO(item.date);
    years.add(date.getFullYear());
    if (!biggest || amount > biggest.amount) {
      biggest = { label: item.label, amount, date };
    }
  }

  const months =
    year != null
      ? elapsedMonths(year, now)
      : Math.max(
          1,
          Array.from(years).reduce((sum, y) => sum + elapsedMonths(y, now), 0),
        );

  return {
    total,
    count: items.length,
    biggest,
    average: total / months,
    spanMonths: months,
  };
};
