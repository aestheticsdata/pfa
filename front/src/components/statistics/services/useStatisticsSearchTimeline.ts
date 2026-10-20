import { SEARCH_MIN_LENGTH } from "@components/spendings/config/constants";
import { SEARCH_TIMELINE_RANGES, searchTimelineWindow } from "@components/statistics/helpers/searchTimelineData";
import { searchTimelineQuery } from "@components/statistics/services/queries";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { SearchTimelineRange } from "@components/statistics/interfaces/searchTimelineTypes";

/**
 * Aggregated time distribution of the spendings matching a term (COS-160) —
 * GET /search-timeline, behind the Statistics search-timeline widget. The
 * window ends today (resolved client-side, COS-73) and spans the given range
 * preset; the request only fires once the trimmed term reaches the shared
 * minimum length. `keepPreviousData` keeps the previous chart on screen
 * between keystrokes / range hops; failures surface inline in the widget
 * instead of the error boundary (opts out of the global throwOnError).
 */
const useStatisticsSearchTimeline = (query: string, range: SearchTimelineRange) => {
  const { privateRequest } = useRequestHelper();
  // One "today" per mount: a stable window (and query key) for the session.
  const [today] = useState(() => new Date());
  const trimmed = query.trim();
  const enabled = trimmed.length >= SEARCH_MIN_LENGTH;
  const { bucket } = SEARCH_TIMELINE_RANGES[range];
  const { from, to } = searchTimelineWindow(range, today);

  const { data, isPending, error } = useQuery({
    ...searchTimelineQuery(privateRequest, { query: trimmed, from, to, bucket }),
    enabled,
    placeholderData: keepPreviousData,
  });

  return {
    timeline: data,
    isSearching: enabled && isPending,
    error,
    hasQuery: enabled,
    from,
    to,
    bucket,
  };
};

export default useStatisticsSearchTimeline;
