import type { LEVEL } from "@components/statistics/helpers/heatmapData";
import type { ExceptionalItem } from "@src/schemas/exceptionals";
import type { DailyStat } from "@src/schemas/stats";

/** The two feeds the daily heatmap is drawn from (PFA-246): per-day totals and the exceptionals. */
export interface HeatmapFeeds {
  days: DailyStat[];
  exceptionals: ExceptionalItem[];
}

export type HeatmapLevel = (typeof LEVEL)[keyof typeof LEVEL];

export type FilledLevel = Exclude<HeatmapLevel, typeof LEVEL.EMPTY | typeof LEVEL.FUTURE>;

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
