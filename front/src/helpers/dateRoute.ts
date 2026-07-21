import formatISO from "date-fns/formatISO";
import startOfMonth from "date-fns/startOfMonth";
import { createParser } from "nuqs";

export const DATE_QUERY_PARAM = "date";
// The Dépenses (weekly) page carries the selected week as a ?date= query param.
export const SPENDINGS_PATH = "/spendings";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** A Date as an ISO calendar day ("YYYY-MM-DD") on the local calendar. */
export const formatIsoDate = (date: Date): string => formatISO(date, { representation: "date" });

export const getTodayIsoDate = (): string => formatIsoDate(new Date());

export const isValidIsoDate = (value?: string): value is string => {
  if (!value || !ISO_DATE_PATTERN.test(value)) {
    return false;
  }

  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

export const buildSpendingsPath = (date = getTodayIsoDate()): string => `${SPENDINGS_PATH}?${DATE_QUERY_PARAM}=${date}`;

/**
 * nuqs parser for the Dépenses `?date=` param: a validated ISO calendar day
 * ("YYYY-MM-DD") kept as a LOCAL string — the whole app treats the selected week
 * as this string, never a Date. Deliberately NOT nuqs' built-in `parseAsIsoDate`,
 * which decodes to `new Date("YYYY-MM-DD")` (UTC midnight) and would reintroduce
 * the west-of-UTC off-by-one-day bug (COS-73). An invalid value parses to null so
 * the page falls back to today, matching the former isValidIsoDate guard.
 */
export const parseAsSpendingsDate = createParser({
  parse: (value) => (isValidIsoDate(value) ? value : null),
  serialize: (value) => value,
});

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

/**
 * The ?month= value for viewing `target`'s month: `null` when it resolves to the
 * current month (so /dashboard stays clean), otherwise "YYYY-MM". Shared by the
 * MonthSelector arrow steppers and the direct month picker (COS-120).
 */
export const resolveMonthParam = (target: Date, currentMonthStart: Date): string | null => {
  const start = startOfMonth(target);
  return start.getTime() === currentMonthStart.getTime() ? null : formatMonthParam(start);
};
