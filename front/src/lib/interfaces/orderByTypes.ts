import type { SORT_DIR } from "@lib/orderBy";

export type SortDir = (typeof SORT_DIR)[keyof typeof SORT_DIR];

/** One sort criterion: the value an item is compared on. */
export type SortKey<T> = (item: T) => string | number;
