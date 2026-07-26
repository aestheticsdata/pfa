// Central registry of React Query cache keys (COS-157). Every query key in the
// app starts with one of these entries so cross-module invalidation (spendings
// mutations refreshing dashboard/statistics caches…) never relies on magic
// strings scattered across hooks.
export const QUERY_KEYS = {
  SPENDINGS_BY_MONTH: "spendingsByMonth",
  RECURRINGS: "recurrings",
  RECURRINGS_DRAWN: "recurringsDrawn",
  MONTHLY_STATS: "monthlyStats",
  DASHBOARD: "dashboard",
  DAILY_PROJECTION: "dailyProjection",
  MONTHLY_INCOME: "monthlyIncome",
  CATEGORY_TRENDS: "categoryTrends",
  BUSIEST_WEEK: "busiestWeek",
  SPENDING_PACE: "spendingPace",
  WEEKLY_STATS: "weeklyStats",
  DAILY_STATS: "dailyStats",
  WEEKDAY_CATEGORIES: "weekdayCategories",
  BIGGEST_REGULAR_EXPENSE: "biggestRegularExpense",
  STATISTICS: "statistics",
  CATEGORIES: "categories",
  CATEGORY_STATS: "categoryStats",
  EXCEPTIONALS: "exceptionals",
  EXCEPTIONAL_YEARS: "exceptionalYears",
  REGULAR_MONTHLY_AVERAGE: "regularMonthlyAverage",
  SPENDINGS_SEARCH: "spendingsSearch",
  SEARCH_TIMELINE: "searchTimeline",
  SPENDINGS_YEARS: "spendingsYears",
  LABEL_SUGGESTIONS: "labelSuggestions",
} as const;
