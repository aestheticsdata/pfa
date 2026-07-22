import { SEARCH_TIMELINE_RANGE_VALUES } from "@components/statistics/helpers/searchTimelineData";
import { parseAsString, parseAsStringLiteral } from "nuqs";

/**
 * URL-state for the Statistics search-timeline widget (COS-160): the searched
 * term and the range preset, so reloading or coming back to /statistics
 * restores the exploration. Param names are deliberately distinct from the
 * Dashboard search modal's (?q= / ?year=) — two different features must never
 * read each other's state.
 */
export const searchTimelineParsers = {
  term: parseAsString.withDefault(""),
  range: parseAsStringLiteral(SEARCH_TIMELINE_RANGE_VALUES).withDefault("year"),
};

// Typing must not spam history; each param drops at its default so an untouched
// widget leaves a clean /statistics URL.
export const searchTimelineUrlOptions = { history: "replace", clearOnDefault: true } as const;
