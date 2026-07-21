import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS, SEARCH_MIN_LENGTH } from "@components/spendings/config/constants";
import useRequestHelper from "@helpers/useRequestHelper";
import { SpendingSearchPageSchema } from "@src/schemas/spendings";
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
  const { user } = useAuth();
  const userID = user?.id;
  const trimmed = query.trim();
  const enabled = !!userID && (trimmed.length >= SEARCH_MIN_LENGTH || year !== null);

  const fetchPage = async ({ pageParam }: { pageParam?: string }) => {
    const yearParam = year !== null ? `&year=${year}` : "";
    const cursorParam = pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : "";
    const response = await privateRequest(
      `/spendings/search?q=${encodeURIComponent(trimmed)}${yearParam}${cursorParam}`,
    );
    return SpendingSearchPageSchema.parse(response.data);
  };

  const { data, isPending, isFetchingNextPage, hasNextPage, fetchNextPage, error } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.SPENDINGS_SEARCH, trimmed, year],
    queryFn: fetchPage,
    enabled,
    retry: false,
    placeholderData: keepPreviousData,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    ...QUERY_OPTIONS,
    // Keep the loaded pages around longer than the default 5 min so returning
    // to the modal (browser Back) after a detour restores the full list, not
    // just the first page (COS-114).
    gcTime: 30 * 60 * 1000,
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
