import { SEARCH_MIN_LENGTH } from "@components/spendings/config/constants";
import { SEARCH_TIMELINE_RANGES, searchTimelineWindow } from "@components/statistics/helpers/searchTimelineData";
import { QUERY_KEYS } from "@lib/query/keys";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { SearchTimelineResponseSchema } from "@src/schemas/stats";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";

import type { SearchTimelineRange } from "@components/statistics/helpers/searchTimelineData";
import type { SearchTimelineResponse } from "@src/schemas/stats";

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

  const getSearchTimeline = async (): Promise<SearchTimelineResponse> => {
    const response = await privateRequest(
      `/search-timeline?q=${encodeURIComponent(trimmed)}&from=${from}&to=${to}&bucket=${bucket}`,
    );
    return SearchTimelineResponseSchema.parse(response.data);
  };

  const { data, isPending, error } = useQuery({
    queryKey: [QUERY_KEYS.SEARCH_TIMELINE, trimmed, range, from, to],
    queryFn: getSearchTimeline,
    enabled,
    retry: false,
    placeholderData: keepPreviousData,
    throwOnError: false,
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
