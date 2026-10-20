import type { WeekdayStat } from "@components/statistics/interfaces/weekdayStatsTypes";

/** Where the plot's vertical references sit on the shared scale (fractions 0→1). */
export interface GuidesProps {
  /** Budget-threshold positions on the shared scale; null when no ceiling is set. */
  budgetFrac: number | null;
  dangerFrac: number | null;
  /** The year's average daily spend, on the same scale. */
  avgFrac: number;
}

/** The figures that place every mark of the day-of-week plot on one euro scale (PFA-249). */
export interface DayOfWeekScale extends GuidesProps {
  /** Per-weekday budget (the weekly ceiling over 7 days), or null without a ceiling. */
  dayBudget: number | null;
  /** The red threshold, `OVERSPEND_DANGER_RATIO` × the day budget. */
  dangerBudget: number | null;
  scaleMax: number;
  /** How the average-line label anchors on its line, so it never leaves the plot. */
  avgLabelAlign: string;
}

/** The inputs of the plot scale: both years' weekday stats and the weekly ceiling. */
export interface DayOfWeekScaleInput {
  stats: WeekdayStat[];
  compareStats: WeekdayStat[] | null;
  overallAvg: number;
  weeklyCeiling: number | null;
}
