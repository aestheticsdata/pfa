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

// A row of a Spendings day card: a plain spending, or a group of lines bought on
// one receipt (PFA-189).
export const DAY_ENTRY_KIND = {
  spending: "spending",
  group: "group",
} as const;

// The spending modal's two shapes: one spending, or a group of lines sharing
// one receipt (PFA-189).
export const SPENDING_MODAL_MODE = {
  single: "single",
  group: "group",
} as const;

// Look of a day-card row's inline confirmation: red for a delete, neutral for
// a reversible change such as ungrouping (PFA-190).
export const ROW_CONFIRM_TONE = {
  danger: "danger",
  neutral: "neutral",
} as const;

// The action a group row is asking to confirm inline (PFA-190).
export const GROUP_ROW_ACTION = {
  delete: "delete",
  ungroup: "ungroup",
} as const;

// How far a total is over its budget (COS-34, COS-36): `overspendLevel` produces it, the
// day cards, weekly ceiling and weekday bars colour by it.
export const OVERSPEND_LEVEL = {
  normal: "normal",
  warn: "warn",
  danger: "danger",
} as const;

// The columns a day card can sort its rows on (useDaySort).
export const DAY_SORT_FIELD = {
  label: "label",
  category: "category",
  amount: "amount",
} as const;

// The batch dialogs opened from a day card's selection bar (PFA-189, PFA-197).
export const BATCH_MODAL = {
  merge: "merge",
  share: "share",
} as const;

// The receipt-lines modal (PFA-214): checking what the OCR just read, reading
// the saved lines, or editing them.
export const RECEIPT_LINES_MODE = {
  review: "review",
  detail: "detail",
  edit: "edit",
} as const;
