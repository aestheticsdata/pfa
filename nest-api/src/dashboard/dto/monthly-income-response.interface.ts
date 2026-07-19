export interface MonthlyIncomeResponse {
  /** 12-slot Jan→Dec monthly income (dashboard initialAmount); null where the
   *  user has no dashboard row for that month. */
  income: (number | null)[];
}
