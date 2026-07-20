import { z } from "zod";

const numberLikeSchema = z.preprocess(
  (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
  z.coerce.number().finite(),
);

const statisticsMonthEntrySchema = z.record(z.string(), z.union([z.string(), z.number()]));

export const StatisticsResponseSchema = z.object({
  colors: z.record(z.string(), z.string()),
  data: z.record(z.string(), z.array(statisticsMonthEntrySchema)),
});

export type StatisticsResponse = z.infer<typeof StatisticsResponseSchema>;

export const ChartsCategorySchema = z.object({
  category: z.string().nullable(),
  categoryColor: z.string().nullable(),
  value: z.preprocess(
    (value) => (typeof value === "number" || typeof value === "string" ? value : NaN),
    z.coerce.number().finite(),
  ),
});

export type ChartsCategory = z.infer<typeof ChartsCategorySchema>;

// Per-category totals for the current period and the one it is compared against
// (GET /category-trends). Feeds the dashboard's monthly "Répartition par
// catégorie" trend column + "Catégorie en hausse" insight (COS-41); the delta %
// and its hausse/baisse/stable/nouv. styling are derived on the front.
// `previousValue` is null when the category is new to the comparison window.
export const CategoryTrendPointSchema = z.object({
  category: z.string().nullable(),
  categoryColor: z.string().nullable(),
  value: numberLikeSchema,
  previousValue: numberLikeSchema.nullable(),
});

export type CategoryTrendPoint = z.infer<typeof CategoryTrendPointSchema>;

export const CategoryTrendsResponseSchema = z.object({
  trends: z.array(CategoryTrendPointSchema),
  // Total spent across every category in the comparison window (incl. ones
  // absent from the current window). Drives the Dépenses "moyenne / jour vs sem.
  // dernière" delta (COS-35); unused by the dashboard monthly breakdown.
  previousTotal: numberLikeSchema,
});

export type CategoryTrendsResponse = z.infer<typeof CategoryTrendsResponseSchema>;

// Per-day spending totals for a year (COS-45) — GET /daily-stats. Sparse: one
// entry per day that has at least one spending. Feeds the daily heatmap and the
// day-of-week averages (COS-48).
export const DailyStatSchema = z.object({
  date: z.string(),
  total: numberLikeSchema,
  count: numberLikeSchema,
});

export type DailyStat = z.infer<typeof DailyStatSchema>;

export const DailyStatsResponseSchema = z.object({
  days: z.array(DailyStatSchema),
});

export type DailyStatsResponse = z.infer<typeof DailyStatsResponseSchema>;

// Biggest single one-off (non-exceptional) expense of a year (COS-46) — GET
// /biggest-regular-expense. `expense` is null when the user has no spending that
// year. Backs the "courante" row of the "Plus grosse dépense" KPI card.
export const BiggestRegularExpenseSchema = z.object({
  label: z.string(),
  amount: numberLikeSchema,
  date: z.string(),
  categoryName: z.string().nullable(),
  categoryColor: z.string().nullable(),
});

export type BiggestRegularExpense = z.infer<typeof BiggestRegularExpenseSchema>;

export const BiggestRegularExpenseResponseSchema = z.object({
  expense: BiggestRegularExpenseSchema.nullable(),
});

export type BiggestRegularExpenseResponse = z.infer<typeof BiggestRegularExpenseResponseSchema>;

// Busiest calendar week-range of a month by transaction count (COS-139) — GET
// /busiest-week. "Week" = the month's calendar-aligned Sun→Sat slices, truncated
// at the month edges (not a rolling window). `from`/`to` are null when the month
// has no spending. Backs the dashboard's 4th ribbon insight.
export const BusiestWeekResponseSchema = z.object({
  count: numberLikeSchema,
  from: z.string().nullable(),
  to: z.string().nullable(),
});

export type BusiestWeekResponse = z.infer<typeof BusiestWeekResponseSchema>;

// Totals of the three months before the displayed month (COS-40) — GET
// /spending-pace. Newest→oldest (M-1, M-2, M-3); `month` is the month's first day
// (YYYY-MM-DD). Feeds the dashboard's "Sur le rythme" insight, which turns these
// into daily rates and compares them to the current month's pace.
export const MonthlyTotalSchema = z.object({
  month: z.string(),
  total: numberLikeSchema,
});

export type MonthlyTotal = z.infer<typeof MonthlyTotalSchema>;

export const SpendingPaceResponseSchema = z.object({
  months: z.array(MonthlyTotalSchema),
});

export type SpendingPaceResponse = z.infer<typeof SpendingPaceResponseSchema>;
