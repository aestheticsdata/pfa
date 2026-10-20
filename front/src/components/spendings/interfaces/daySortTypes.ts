import type { DAY_SORT_FIELD } from "@components/spendings/config/constants";

export type DaySortField = (typeof DAY_SORT_FIELD)[keyof typeof DAY_SORT_FIELD];
