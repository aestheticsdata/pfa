import getDay from "date-fns/getDay";
import getDayOfYear from "date-fns/getDayOfYear";
import parseISO from "date-fns/parseISO";

import type { DailyStat } from "@src/schemas/stats";

export interface WeekdayStat {
  /** Average spend on that weekday over the year (0 when the weekday never occurred). */
  avgAmount: number;
  /** Average number of transactions on that weekday. */
  avgTx: number;
}

/** Monday-based day of week: 0 = Monday … 6 = Sunday (date-fns getDay is 0=Sunday). */
const mondayDow = (date: Date): number => (getDay(date) + 6) % 7;

/** Local calendar date as YYYY-MM-DD, built from Y/M/D parts (no timezone shift). */
const isoOf = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Average spend + transaction count per weekday (Mon..Sun) over the realized part
 * of `year`, from the shared /daily-stats series (COS-45, COS-48). Zero-spend
 * days count toward the average: the sparse `days` only carries spending days, so
 * the denominator is each weekday's real occurrence count (not `days.length`).
 * Future-dated spendings (current year) are excluded, matching the heatmap.
 */
export function weekdayAverages(days: DailyStat[], year: number, now: Date): WeekdayStat[] {
  const isCurrentYear = year === now.getFullYear();
  const realizedDays = isCurrentYear ? getDayOfYear(now) : getDayOfYear(new Date(year, 11, 31));
  const lastRealizedIso = isoOf(new Date(year, 0, realizedDays));

  const occurrences = new Array<number>(7).fill(0);
  for (let doy = 1; doy <= realizedDays; doy++) {
    occurrences[mondayDow(new Date(year, 0, doy))] += 1;
  }

  const sumAmount = new Array<number>(7).fill(0);
  const sumTx = new Array<number>(7).fill(0);
  for (const day of days) {
    if (day.date.slice(0, 10) > lastRealizedIso) {
      continue; // future-dated spending
    }
    const w = mondayDow(parseISO(day.date));
    sumAmount[w] += day.total;
    sumTx[w] += day.count;
  }

  return occurrences.map((occ, w) => ({
    avgAmount: occ > 0 ? sumAmount[w] / occ : 0,
    avgTx: occ > 0 ? sumTx[w] / occ : 0,
  }));
}
