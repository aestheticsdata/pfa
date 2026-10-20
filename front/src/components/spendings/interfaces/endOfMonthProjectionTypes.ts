/** Where the projection stands in the month: today's day number and the month's length (PFA-246). */
export interface MonthPosition {
  today: number;
  daysInMonth: number;
}

/** One month's amounts day by day, index i = day (i+1). */
export type DailyAmounts = readonly number[];

export interface MonthProjection {
  /** The month's projected end-of-month total, or null when there is none to show. */
  total: number | null;
  /**
   * What each category still has coming before the month is out, keyed by
   * `categoryKey` — a category with nothing more expected is absent rather than
   * zero. Empty whenever there is no projection to make.
   */
  remainders: Map<string | null, number>;
}
