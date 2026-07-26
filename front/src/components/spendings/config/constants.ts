// Whole-history search (COS-114): minimum query length before the modal hits the
// backend, kept in sync with the server-side guard.
export const SEARCH_MIN_LENGTH = 2;

// Debounce applied to search-as-you-type fields (the Dashboard search modal,
// the Statistics search timeline) before the query hits the backend.
export const SEARCH_DEBOUNCE_MS = 250;

export const DATE_FORMAT = "yyyy-MM-dd";

// Period-type discriminators (formerly in the removed spendingDashboard tree).
export const MONTHLY = "PERIOD_TYPE_MONTHLY";
export const WEEKLY = "PERIOD_TYPE_WEEKLY";

// Anything holding one of the two discriminators is typed with this rather than
// a bare `string`, so a typo can no longer silently fall through to the weekly
// branch (COS-107).
export type PeriodType = typeof MONTHLY | typeof WEEKLY;
