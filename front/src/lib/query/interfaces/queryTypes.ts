import type { QUERY_KEYS } from "@lib/query/keys";

/** A query family: the first element every key of that family starts with (PFA-253). */
export type QueryFamily = (typeof QUERY_KEYS)[keyof typeof QUERY_KEYS];
