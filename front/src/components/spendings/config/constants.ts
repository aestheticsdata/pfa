export const QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  staleTime: 60 * 60 * 1000, // 1 hour
};

export const QUERY_KEYS = {
  SPENDINGS_BY_MONTH: "spendingsByMonth",
  RECURRINGS: "recurrings",
  INITIAL_AMOUNT: "initialAmount",
  DASHBOARD: "dashboard",
  DAILY_PROJECTION: "dailyProjection",
  MONTHLY_INCOME: "monthlyIncome",
  CATEGORY_TRENDS: "categoryTrends",
  BUSIEST_WEEK: "busiestWeek",
  WEEKLY_STATS: "weeklyStats",
  DAILY_STATS: "dailyStats",
  BIGGEST_REGULAR_EXPENSE: "biggestRegularExpense",
  CATEGORIES: "categories",
  CATEGORY_STATS: "categoryStats",
  EXCEPTIONALS: "exceptionals",
  EXCEPTIONAL_YEARS: "exceptionalYears",
  SPENDINGS_SEARCH: "spendingsSearch",
  SPENDINGS_YEARS: "spendingsYears",
};

// Whole-history search (COS-114): minimum query length before the modal hits the
// backend, kept in sync with the server-side guard.
export const SEARCH_MIN_LENGTH = 2;

export const DATE_FORMAT = "yyyy-MM-dd";

// Period-type discriminators (formerly in the removed spendingDashboard tree).
export const MONTHLY = "PERIOD_TYPE_MONTHLY";
export const WEEKLY = "PERIOD_TYPE_WEEKLY";
