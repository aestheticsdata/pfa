import getDay from "date-fns/getDay";
import getDayOfYear from "date-fns/getDayOfYear";
import parseISO from "date-fns/parseISO";

import type { DailyStat } from "@src/schemas/stats";

/** Daily averages shared by the per-weekday and the overall (header) figures. */
export interface DailyAverage {
  /** Average spend per realized day (0 when none). */
  avgAmount: number;
  /** Average number of transactions per realized day. */
  avgTx: number;
}

export interface WeekdayStat extends DailyAverage {
  /** Lowest single-day total among that weekday's spending days (0 when none). */
  min: number;
  /** Highest single-day total among that weekday's spending days (0 when none). */
  max: number;
}

/** Monday-based day of week: 0 = Monday … 6 = Sunday (date-fns getDay is 0=Sunday). */
const mondayDow = (date: Date): number => (getDay(date) + 6) % 7;

/** Local calendar date as YYYY-MM-DD, built from Y/M/D parts (no timezone shift). */
const isoOf = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

const mean = (values: number[]): number => (values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0);

/**
 * Elapsed (non-future) window of a year: how many days are realized and the ISO
 * date of the last one. The current year stops at `now`; past years span the full
 * year. Shared by the weekday and overall averages so both use one definition of
 * "realized" and exclude the same future-dated spendings.
 */
function realizedWindow(year: number, now: Date): { realizedDays: number; lastRealizedIso: string } {
  const isCurrentYear = year === now.getFullYear();
  const realizedDays = isCurrentYear ? getDayOfYear(now) : getDayOfYear(new Date(year, 11, 31));
  return { realizedDays, lastRealizedIso: isoOf(new Date(year, 0, realizedDays)) };
}

/**
 * Average spend + transaction count per weekday (Mon..Sun) over the realized part
 * of `year`, plus each weekday's min/max single-day total, from the shared
 * /daily-stats series (COS-45, COS-48, COS-127). Zero-spend days count toward the
 * average: the sparse `days` only carries spending days, so the denominator is
 * each weekday's real occurrence count (not `days.length`). The min/max range,
 * however, spans only the days that actually had spending (the "range"
 * whisker). Future-dated spendings (current year) are excluded, matching the heatmap.
 */
export function weekdayAverages(days: DailyStat[], year: number, now: Date): WeekdayStat[] {
  const { realizedDays, lastRealizedIso } = realizedWindow(year, now);

  const occurrences = new Array<number>(7).fill(0);
  for (let doy = 1; doy <= realizedDays; doy++) {
    occurrences[mondayDow(new Date(year, 0, doy))] += 1;
  }

  const sumAmount = new Array<number>(7).fill(0);
  const sumTx = new Array<number>(7).fill(0);
  const minAmount = new Array<number>(7).fill(Number.POSITIVE_INFINITY);
  const maxAmount = new Array<number>(7).fill(0);
  for (const day of days) {
    if (day.date.slice(0, 10) > lastRealizedIso) {
      continue; // future-dated spending
    }
    const w = mondayDow(parseISO(day.date));
    sumAmount[w] += day.total;
    sumTx[w] += day.count;
    if (day.total < minAmount[w]) {
      minAmount[w] = day.total;
    }
    if (day.total > maxAmount[w]) {
      maxAmount[w] = day.total;
    }
  }

  return occurrences.map((occ, w) => ({
    avgAmount: occ > 0 ? sumAmount[w] / occ : 0,
    avgTx: occ > 0 ? sumTx[w] / occ : 0,
    min: Number.isFinite(minAmount[w]) ? minAmount[w] : 0,
    max: maxAmount[w],
  }));
}

/**
 * Overall daily averages over the realized part of the year — total spend and
 * transaction count ÷ elapsed days. Properly weighted (≈ the mean of the seven
 * weekday means), it backs the widget's header subtitle (COS-127).
 */
export function overallDailyAverage(days: DailyStat[], year: number, now: Date): DailyAverage {
  const { realizedDays, lastRealizedIso } = realizedWindow(year, now);
  if (realizedDays <= 0) {
    return { avgAmount: 0, avgTx: 0 };
  }

  let sumAmount = 0;
  let sumTx = 0;
  for (const day of days) {
    if (day.date.slice(0, 10) > lastRealizedIso) {
      continue; // future-dated spending
    }
    sumAmount += day.total;
    sumTx += day.count;
  }

  return { avgAmount: sumAmount / realizedDays, avgTx: sumTx / realizedDays };
}

export interface WeekdayInsights {
  /** Weekday (0 = Mon) with the highest average spend — the "Peak"; null when no weekday has spending. */
  peakDow: number | null;
  /** Weekday with the lowest positive average spend — the "Low"; null when no weekday has spending. */
  troughDow: number | null;
  /** Weekend (Sat+Sun) vs weekday (Mon–Fri) daily-average, as a signed %; null when weekdays have no spending. */
  weekendDeltaPct: number | null;
}

/**
 * Header-chip insights derived from the weekday averages (COS-127): the priciest
 * and cheapest weekdays and how weekend days compare to the working week. Only
 * weekdays that actually had spending are ranked, so an all-zero weekday is never
 * flagged as the "Low". All from the same real averages, no extra source.
 */
export function weekdayInsights(stats: WeekdayStat[]): WeekdayInsights {
  let peakDow: number | null = null;
  let troughDow: number | null = null;
  let peakAmount = Number.NEGATIVE_INFINITY;
  let troughAmount = Number.POSITIVE_INFINITY;
  for (let w = 0; w < 7; w++) {
    const amount = stats[w].avgAmount;
    if (amount <= 0) {
      continue; // rank only weekdays with spending
    }
    if (amount > peakAmount) {
      peakAmount = amount;
      peakDow = w;
    }
    if (amount < troughAmount) {
      troughAmount = amount;
      troughDow = w;
    }
  }

  const weekdayMean = mean([0, 1, 2, 3, 4].map((w) => stats[w].avgAmount));
  const weekendMean = mean([5, 6].map((w) => stats[w].avgAmount));
  const weekendDeltaPct = weekdayMean > 0 ? (weekendMean / weekdayMean - 1) * 100 : null;

  return { peakDow, troughDow, weekendDeltaPct };
}
