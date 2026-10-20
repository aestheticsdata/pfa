import { SEARCH_MIN_LENGTH } from "@components/spendings/config/constants";
import { spendingSearchQuery } from "@components/spendings/services/queries";
import useRequestHelper from "@helpers/useRequestHelper";
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";

/**
 * Whole-history spending search (COS-114), keyset-paginated. Hits
 * `GET /spendings/search` once the (trimmed) query reaches the minimum length OR
 * a year filter is set, then follows `nextCursor` page by page as the caller asks
 * for more. `keepPreviousData` avoids the list flashing empty between keystrokes.
 * Debouncing is the caller's job.
 */
const useSpendingSearch = (query: string, year: number | null) => {
  const { privateRequest } = useRequestHelper();
  const trimmed = query.trim();
  const enabled = trimmed.length >= SEARCH_MIN_LENGTH || year !== null;

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, error } = useInfiniteQuery({
    ...spendingSearchQuery(privateRequest, { query: trimmed, year }),
    enabled,
    placeholderData: keepPreviousData,
  });

  const results = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? results.length;

  return {
    results,
    total,
    isSearching: enabled && isPending,
    isFetchingNextPage,
    hasNextPage: !!hasNextPage,
    fetchNextPage,
    hasQuery: enabled,
    error,
  };
};

export default useSpendingSearch;
