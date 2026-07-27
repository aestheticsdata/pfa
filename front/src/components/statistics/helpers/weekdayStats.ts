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
  /** Low end of the typical range — 10th percentile of that weekday's realized days. */
  p10: number;
  /** High end of the typical range — 90th percentile of the same series. */
  p90: number;
}

/** The typical-range whisker spans the middle 80 % of a weekday's realized days. */
const TYPICAL_LOW_P = 0.1;
const TYPICAL_HIGH_P = 0.9;

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
 * Linear-interpolated percentile of an ascending-sorted series; `p` is a 0–1
 * fraction, clamped. Returns 0 for an empty series. It backs the weekday
 * "typical range" whisker (COS-182): unlike a raw min/max, a single outlier day
 * can no longer stretch the range — and with it the whole chart's scale.
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const position = (sorted.length - 1) * Math.max(0, Math.min(1, p));
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

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
 * of `year`, plus each weekday's typical range and its absolute extremes, from the
 * shared /daily-stats series (COS-45, COS-48, COS-127). Zero-spend days count toward
 * the average: the sparse `days` only carries spending days, so the denominator is
 * each weekday's real occurrence count (not `days.length`). The p10/p90 typical
 * range (COS-182) is drawn from that same full population, so the whisker describes
 * exactly what the bar averages; `min`/`max` keep their narrower meaning — the
 * extremes among the days that actually had spending, shown in the tooltip only.
 * Future-dated spendings (current year) are excluded, matching the heatmap.
 */
export function weekdayAverages(days: DailyStat[], year: number, now: Date): WeekdayStat[] {
  const { realizedDays, lastRealizedIso } = realizedWindow(year, now);

  const occurrences = new Array<number>(7).fill(0);
  for (let doy = 1; doy <= realizedDays; doy++) {
    occurrences[mondayDow(new Date(year, 0, doy))] += 1;
  }

  const sumAmount = new Array<number>(7).fill(0);
  const sumTx = new Array<number>(7).fill(0);
  const spendingTotals: number[][] = Array.from({ length: 7 }, () => []);
  for (const day of days) {
    if (day.date.slice(0, 10) > lastRealizedIso) {
      continue; // future-dated spending
    }
    const w = mondayDow(parseISO(day.date));
    sumAmount[w] += day.total;
    sumTx[w] += day.count;
    spendingTotals[w].push(day.total);
  }

  return occurrences.map((occ, w) => {
    const spending = spendingTotals[w].sort((a, b) => a - b);
    // The realized days *without* spending belong to the distribution just as they
    // belong to the average's denominator. They are all 0, so prepending them to the
    // sorted spending totals yields the full ascending series without a second sort.
    const zeroDays = Math.max(0, occ - spending.length);
    const series = [...new Array<number>(zeroDays).fill(0), ...spending];
    return {
      avgAmount: occ > 0 ? sumAmount[w] / occ : 0,
      avgTx: occ > 0 ? sumTx[w] / occ : 0,
      min: spending[0] ?? 0,
      max: spending[spending.length - 1] ?? 0,
      p10: percentile(series, TYPICAL_LOW_P),
      p90: percentile(series, TYPICAL_HIGH_P),
    };
  });
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
