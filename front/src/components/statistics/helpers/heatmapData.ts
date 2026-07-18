import getDay from "date-fns/getDay";
import getDayOfYear from "date-fns/getDayOfYear";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";

export type HeatmapLevel = "empty" | "future" | "lvl-0" | "lvl-1" | "lvl-2" | "lvl-3" | "lvl-4" | "lvl-neg";
export type FilledLevel = Exclude<HeatmapLevel, "future" | "empty">;

export interface HeatmapModel {
  /** [dow 0=Mon..6=Sun][week 0..weeks-1]; "empty" = out-of-year padding, "future" = not yet reached. */
  rows: HeatmapLevel[][];
  /** Number of week-columns this year actually spans (52–54, so the grid matches the calendar). */
  weeks: number;
  counts: Record<FilledLevel, number>;
  /** Longest run of consecutive realized "sober" days (lvl-0 / lvl-1). */
  streak: number;
  /** Heaviest non-exceptional daily total in euros — colour-scale top + legend. */
  scaleMax: number;
  /** The single heaviest non-exceptional day, or null when there is no spending. */
  busiest: { amount: number; date: string } | null;
  /** Realized exceptional purchase labels, biggest first (for the "pics" subtext). */
  exceptionalLabels: string[];
  /** Day-of-year of the last realized day (today, or Dec 31 for a past year). */
  realizedDays: number;
}

const emptyCounts = (): Record<FilledLevel, number> => ({
  "lvl-0": 0,
  "lvl-1": 0,
  "lvl-2": 0,
  "lvl-3": 0,
  "lvl-4": 0,
  "lvl-neg": 0,
});

/** Monday-based day of week: 0 = Monday … 6 = Sunday (date-fns getDay is 0=Sunday). */
const mondayDow = (date: Date): number => (getDay(date) + 6) % 7;

/** Local calendar date as YYYY-MM-DD, built from Y/M/D parts (no timezone shift). */
const isoOf = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

/**
 * Maps a day's spend to a colour band on a linear [0, max] scale (COS-45):
 * 0 € → lvl-0, then four equal bands up to `max` (the year's heaviest day).
 */
export const bandFor = (amount: number, max: number): FilledLevel => {
  if (amount <= 0 || max <= 0) {
    return "lvl-0";
  }
  const band = Math.min(4, Math.max(1, Math.ceil((amount / max) * 4)));
  return `lvl-${band}` as FilledLevel;
};

/**
 * Builds the daily-heatmap model from the real per-day totals (COS-45). Each
 * calendar day of `year` is placed at [Monday-based dow][weeks-since-Jan-1];
 * exceptional days (from the separate exceptionals feed) override the spend band
 * as `lvl-neg`. Days past today (current year) stay `future`; grid slots outside
 * the year are `empty`.
 */
export const buildHeatmap = (
  year: number,
  now: Date,
  days: DailyStat[],
  exceptionals: ExceptionalItem[],
): HeatmapModel => {
  const isCurrentYear = year === now.getFullYear();
  const realizedDays = isCurrentYear ? getDayOfYear(now) : getDayOfYear(new Date(year, 11, 31));
  const daysInYear = getDayOfYear(new Date(year, 11, 31));
  const lastRealizedIso = isoOf(new Date(year, 0, realizedDays));

  const totalByDate = new Map<string, number>();
  for (const day of days) {
    totalByDate.set(day.date, (totalByDate.get(day.date) ?? 0) + day.total);
  }

  const exceptionalDates = new Set<string>();
  for (const item of exceptionals) {
    exceptionalDates.add(item.date.slice(0, 10));
  }

  // Colour scale + busiest day: the heaviest realized, non-exceptional day.
  // Future-dated spendings are ignored (they render as "future" cells), and
  // exceptional days are shown separately (lvl-neg) — "busiest" is hors exceptionnel.
  let scaleMax = 0;
  let busiest: { amount: number; date: string } | null = null;
  for (const [date, total] of totalByDate) {
    if (date > lastRealizedIso || exceptionalDates.has(date)) {
      continue;
    }
    if (total > scaleMax) {
      scaleMax = total;
      busiest = { amount: total, date };
    }
  }

  // Column = weeks since the Monday of the week containing Jan 1. The grid is
  // sized to the exact number of columns this year spans (52–54).
  const firstOffset = mondayDow(new Date(year, 0, 1));
  const weeks = Math.floor((daysInYear - 1 + firstOffset) / 7) + 1;
  const rows: HeatmapLevel[][] = Array.from({ length: 7 }, () => Array<HeatmapLevel>(weeks).fill("empty"));
  const realizedLevels: FilledLevel[] = []; // chronological, for counts + streak

  for (let doy = 1; doy <= daysInYear; doy++) {
    const date = new Date(year, 0, doy); // day-of-year → date (JS rolls the month over)
    const col = Math.floor((doy - 1 + firstOffset) / 7);
    const row = mondayDow(date);

    if (doy > realizedDays) {
      rows[row][col] = "future";
      continue;
    }

    const iso = isoOf(date);
    const level: FilledLevel = exceptionalDates.has(iso) ? "lvl-neg" : bandFor(totalByDate.get(iso) ?? 0, scaleMax);
    realizedLevels.push(level);
    rows[row][col] = level;
  }

  const counts = emptyCounts();
  let run = 0;
  let best = 0;
  for (const level of realizedLevels) {
    counts[level] += 1;
    if (level === "lvl-0" || level === "lvl-1") {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 0;
    }
  }

  const exceptionalLabels = exceptionals
    .filter((item) => item.date.slice(0, 10) <= lastRealizedIso)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .map((item) => item.label);

  return { rows, weeks, counts, streak: best, scaleMax, busiest, exceptionalLabels, realizedDays };
};

/** Month labels positioned at the grid column of each month's first day. */
export const monthColumns = (year: number): { name: string; col: number }[] => {
  const names = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
  const firstOffset = mondayDow(new Date(year, 0, 1));
  return names.map((name, month) => {
    const doy = getDayOfYear(new Date(year, month, 1));
    const col = Math.floor((doy - 1 + firstOffset) / 7);
    // +2: grid track 1 is the 16px dow-label column, so week 0 lives in track 2.
    return { name, col: col + 2 };
  });
};
