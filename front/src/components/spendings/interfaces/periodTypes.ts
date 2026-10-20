import type { MONTHLY, WEEKLY } from "@components/spendings/config/constants";

// Anything holding one of the two discriminators is typed with this rather than
// a bare `string`, so a typo can no longer silently fall through to the weekly
// branch (COS-107).
export type PeriodType = typeof MONTHLY | typeof WEEKLY;
