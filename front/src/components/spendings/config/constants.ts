export const QUERY_OPTIONS = {
  refetchOnWindowFocus: false,
  staleTime: 60 * 60 * 1000, // 1 hour
};

export const QUERY_KEYS = {
  SPENDINGS_BY_MONTH: "spendingsByMonth",
  RECURRINGS: "recurrings",
  INITIAL_AMOUNT: "initialAmount",
  DASHBOARD: "dashboard",
  CHARTS: "charts",
  WEEKLY_STATS: "weeklyStats",
  CATEGORIES: "categories",
  EXCEPTIONALS: "exceptionals",
  EXCEPTIONAL_YEARS: "exceptionalYears",
};

export const DATE_FORMAT = "yyyy-MM-dd";

// Period-type discriminators (formerly in the removed spendingDashboard tree).
export const MONTHLY = "PERIOD_TYPE_MONTHLY";
export const WEEKLY = "PERIOD_TYPE_WEEKLY";
