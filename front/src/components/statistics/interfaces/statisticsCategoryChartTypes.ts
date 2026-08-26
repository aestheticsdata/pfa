/**
 * One selected category's monthly series — built by StatisticsView, rendered as
 * a group of bars by StatisticsCategoryChart.
 */
export interface CategorySeries {
  name: string;
  color: string;
  /** 12-slot Jan→Dec monthly spend for this category. */
  monthly: number[];
  /** Same series for the compare year — drawn as the dimmed bar beside each bar. */
  compareMonthly: number[];
}
