/**
 * One year of regular spending for the projection chain (COS-27, COS-47, COS-50): per-month totals
 * and which months actually have data.
 */
export interface YearMonthly {
  /** 12-slot (Jan→Dec) regular monthly totals. */
  totals: number[];
  /** 12-slot presence mask: true where the year has ≥1 spending that month. */
  present: boolean[];
}

/** The three years the chain reads: the projected one and the two before it (PFA-246). */
export interface YearMonthlyHistory {
  current: YearMonthly;
  lastYear: YearMonthly;
  twoYearsAgo: YearMonthly;
}
