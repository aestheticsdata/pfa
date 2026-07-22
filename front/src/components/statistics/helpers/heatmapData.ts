import format from "date-fns/format";
import getDay from "date-fns/getDay";
import getDayOfYear from "date-fns/getDayOfYear";

import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";
import type { Locale } from "date-fns";

/**
 * The single source of truth for heat-map intensity levels: the `empty`/`future`
 * grid states, the spend bands `lvl-0`…`lvl-4`, and the `lvl-neg` exceptional day.
 * Keys drive counts and styling maps; values are the CSS band identifiers.
 */
export const LEVEL = {
  EMPTY: "empty",
  FUTURE: "future",
  ZERO: "lvl-0",
  ONE: "lvl-1",
  TWO: "lvl-2",
  THREE: "lvl-3",
  FOUR: "lvl-4",
  NEG: "lvl-neg",
} as const;

export type HeatmapLevel = (typeof LEVEL)[keyof typeof LEVEL];
export type FilledLevel = Exclude<HeatmapLevel, typeof LEVEL.EMPTY | typeof LEVEL.FUTURE>;

/** Spend bands in ascending order, indexed by the 0–4 band number (`lvl-neg` excluded). */
export const SPEND_BANDS = [LEVEL.ZERO, LEVEL.ONE, LEVEL.TWO, LEVEL.THREE, LEVEL.FOUR] as const;

export interface HeatmapCellExceptional {
  label: string;
  /** Exceptional purchase amount in euros. */
  amount: number;
}

export interface HeatmapCell {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  /** The day's regular spend total in euros; 0 when the day has no spending. */
  amount: number;
  /** Colour band for the day (lvl-neg on an exceptional day). */
  level: FilledLevel;
  /** Exceptional purchases on this day, biggest first; empty when none. */
  exceptionals: HeatmapCellExceptional[];
}

export interface HeatmapModel {
  /** [dow 0=Mon..6=Sun][week 0..weeks-1]; "empty" = out-of-year padding, "future" = not yet reached. */
  rows: HeatmapLevel[][];
  /** Per-slot tooltip meta, same [dow][week] indexing as `rows`; null for empty/future slots. */
  cells: (HeatmapCell | null)[][];
  /** Number of week-columns this year actually spans (52–54, so the grid matches the calendar). */
  weeks: number;
  counts: Record<FilledLevel, number>;
  /** Longest run of consecutive realized "sober" days (lvl-0 / lvl-1). */
  streak: number;
  /** Heaviest non-exceptional daily total in euros — colour-scale top + legend. */
  scaleMax: number;
  /** The single heaviest non-exceptional day, or null when there is no spending. */
  busiest: { amount: number; date: string } | null;
  /** Realized exceptional purchase labels, biggest first (for the "Exceptional peaks" subtext). */
  exceptionalLabels: string[];
  /** Day-of-year of the last realized day (today, or Dec 31 for a past year). */
  realizedDays: number;
}

const emptyCounts = (): Record<FilledLevel, number> => ({
  [LEVEL.ZERO]: 0,
  [LEVEL.ONE]: 0,
  [LEVEL.TWO]: 0,
  [LEVEL.THREE]: 0,
  [LEVEL.FOUR]: 0,
  [LEVEL.NEG]: 0,
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
    return LEVEL.ZERO;
  }
  const band = Math.min(4, Math.max(1, Math.ceil((amount / max) * 4)));
  return SPEND_BANDS[band];
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

  const exceptionalsByDate = new Map<string, HeatmapCellExceptional[]>();
  for (const item of exceptionals) {
    const iso = item.date.slice(0, 10);
    const list = exceptionalsByDate.get(iso) ?? [];
    list.push({ label: item.label, amount: Number(item.amount) });
    exceptionalsByDate.set(iso, list);
  }
  for (const list of exceptionalsByDate.values()) {
    list.sort((a, b) => b.amount - a.amount);
  }

  // Colour scale + busiest day: the heaviest realized, non-exceptional day.
  // Future-dated spendings are ignored (they render as "future" cells), and
  // exceptional days are shown separately (lvl-neg) — "busiest" excludes exceptionals.
  let scaleMax = 0;
  let busiest: { amount: number; date: string } | null = null;
  for (const [date, total] of totalByDate) {
    if (date > lastRealizedIso || exceptionalsByDate.has(date)) {
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
  const rows: HeatmapLevel[][] = Array.from({ length: 7 }, () => Array<HeatmapLevel>(weeks).fill(LEVEL.EMPTY));
  const cells: (HeatmapCell | null)[][] = Array.from({ length: 7 }, () => Array<HeatmapCell | null>(weeks).fill(null));
  const realizedLevels: FilledLevel[] = []; // chronological, for counts + streak

  for (let doy = 1; doy <= daysInYear; doy++) {
    const date = new Date(year, 0, doy); // day-of-year → date (JS rolls the month over)
    const col = Math.floor((doy - 1 + firstOffset) / 7);
    const row = mondayDow(date);

    if (doy > realizedDays) {
      rows[row][col] = LEVEL.FUTURE;
      continue;
    }

    const iso = isoOf(date);
    const dayExceptionals = exceptionalsByDate.get(iso) ?? [];
    const amount = totalByDate.get(iso) ?? 0;
    const level: FilledLevel = dayExceptionals.length > 0 ? LEVEL.NEG : bandFor(amount, scaleMax);
    realizedLevels.push(level);
    rows[row][col] = level;
    cells[row][col] = { date: iso, amount, level, exceptionals: dayExceptionals };
  }

  const counts = emptyCounts();
  let run = 0;
  let best = 0;
  for (const level of realizedLevels) {
    counts[level] += 1;
    if (level === LEVEL.ZERO || level === LEVEL.ONE) {
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

  return { rows, cells, weeks, counts, streak: best, scaleMax, busiest, exceptionalLabels, realizedDays };
};

/** Month labels positioned at the grid column of each month's first day. */
export const monthColumns = (year: number, locale: Locale): { name: string; col: number }[] => {
  const firstOffset = mondayDow(new Date(year, 0, 1));
  return Array.from({ length: 12 }, (_, month) => {
    const doy = getDayOfYear(new Date(year, month, 1));
    const col = Math.floor((doy - 1 + firstOffset) / 7);
    // +2: grid track 1 is the 16px dow-label column, so week 0 lives in track 2.
    return { name: format(new Date(year, month, 1), "MMM", { locale }), col: col + 2 };
  });
};
