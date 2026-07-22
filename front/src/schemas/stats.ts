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
// (GET /category-trends). Feeds the dashboard's monthly "Breakdown by
// category" trend column + "Rising category" insight (COS-41); the delta %
// and its up/down/stable/new styling are derived on the front.
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
  // absent from the current window). Drives the Spendings "Average / day vs last
  // week" delta (COS-35); unused by the dashboard monthly breakdown.
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

// Dominant spending category per weekday for a year (COS-127) — GET
// /weekday-categories. `weekdays` is length 7, index 0 = Monday … 6 = Sunday;
// each entry's name/color is null when that weekday has no categorized spending.
// Backs the day-of-week widget's hover tooltip.
export const WeekdayCategorySchema = z.object({
  name: z.string().nullable(),
  color: z.string().nullable(),
});

export type WeekdayCategory = z.infer<typeof WeekdayCategorySchema>;

export const WeekdayCategoriesResponseSchema = z.object({
  weekdays: z.array(WeekdayCategorySchema),
});

export type WeekdayCategoriesResponse = z.infer<typeof WeekdayCategoriesResponseSchema>;

// Biggest single one-off (non-exceptional) expense of a year (COS-46) — GET
// /biggest-regular-expense. `expense` is null when the user has no spending that
// year. Backs the "regular" row of the "Biggest expense" KPI card.
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
// (YYYY-MM-DD). Feeds the dashboard's "On pace" insight, which turns these
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

// Time distribution of the spendings matching a search term (COS-160) — GET
// /search-timeline. Sparse: only buckets with at least one match come back (the
// widget fills the gaps), each keyed by its start day (the day itself, or the
// Sunday of the Sun→Sat week). Backs the Statistics search-timeline widget.
export const SearchTimelineBucketSchema = z.object({
  date: z.string(),
  total: numberLikeSchema,
  count: numberLikeSchema,
});

export type SearchTimelineBucket = z.infer<typeof SearchTimelineBucketSchema>;

export const SearchTimelineResponseSchema = z.object({
  buckets: z.array(SearchTimelineBucketSchema),
  summary: z.object({
    total: numberLikeSchema,
    count: numberLikeSchema,
    firstDate: z.string().nullable(),
    lastDate: z.string().nullable(),
  }),
});

export type SearchTimelineResponse = z.infer<typeof SearchTimelineResponseSchema>;
