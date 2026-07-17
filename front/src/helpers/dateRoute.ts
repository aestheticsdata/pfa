import formatISO from "date-fns/formatISO";

export const DATE_QUERY_PARAM = "date";
// The Dépenses (weekly) page carries the selected week as a ?date= query param.
export const SPENDINGS_PATH = "/spendings";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const getTodayIsoDate = (): string => formatISO(new Date(), { representation: "date" });

export const isValidIsoDate = (value?: string): value is string => {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const buildSpendingsPath = (date = getTodayIsoDate()): string => `${SPENDINGS_PATH}?${DATE_QUERY_PARAM}=${date}`;

// The Dashboard carries its viewed month as a ?month=YYYY-MM query param (COS-118).
// Absent = current month (resolved client-side, COS-73), keeping /dashboard clean.
export const MONTH_QUERY_PARAM = "month";
export const DASHBOARD_PATH = "/dashboard";

const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export const isValidMonthParam = (value?: string): value is string => !!value && MONTH_PATTERN.test(value);

/** A month as "YYYY-MM" on the local calendar (matches date-fns startOfMonth). */
export const formatMonthParam = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

/** Parse a validated "YYYY-MM" to the first day of that month (local). */
export const parseMonthParam = (value: string): Date => {
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
};

export const buildDashboardPath = (month?: string): string =>
  month ? `${DASHBOARD_PATH}?${MONTH_QUERY_PARAM}=${month}` : DASHBOARD_PATH;
