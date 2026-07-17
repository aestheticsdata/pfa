"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { EmptyState } from "@components/shared/EmptyState";
import { FilterChip } from "@components/shared/FilterChip";
import { DATE_FORMAT } from "@components/spendings/config/constants";
import { groupSpendingsByMonth } from "@components/spendings/search/groupByMonth";
import SpendingSearchResultRow from "@components/spendings/search/SpendingSearchResultRow";
import { spendingSearchParsers, spendingSearchUrlOptions } from "@components/spendings/search/searchParams";
import useDebouncedValue from "@components/spendings/search/useDebouncedValue";
import useSpendingSearch from "@components/spendings/services/useSpendingSearch";
import useSpendingYears from "@components/spendings/services/useSpendingYears";
import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";
import { buildSpendingsPath } from "@helpers/dateRoute";
import spendingSearch from "@text/spendingSearch";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useLayoutEffect, useRef } from "react";

import type { SpendingItem } from "@components/spendings/types";

const SEARCH_DEBOUNCE_MS = 250;

// Scroll offset of the results list, stashed when the user leaves for a spending
// so browser Back can restore the list where they were. Module-level so it
// survives the modal unmounting during SPA navigation; lost on hard refresh
// (fine — the react-query page cache is gone then too).
let savedScroll: { q: string; year: number | null; top: number } | null = null;

/**
 * Whole-history spending search palette (COS-114). Its state — open flag, query,
 * year — lives in the URL (nuqs), so browser Back reopens it where the user left
 * off. A debounced query (optionally scoped to a year) hits the backend, results
 * are grouped by month (newest-first) and paged in on scroll. Picking a result
 * navigates to the Dépenses page on the week that contains it.
 */
const SpendingSearchModal = () => {
  const [{ search, q, year }, setSearchState] = useQueryStates(spendingSearchParsers, spendingSearchUrlOptions);
  const debounced = useDebouncedValue(q, SEARCH_DEBOUNCE_MS);
  const { results, total, isSearching, isFetchingNextPage, hasNextPage, fetchNextPage, hasQuery, error } =
    useSpendingSearch(debounced, year);
  const years = useSpendingYears();
  const { setScrollToDayIso } = useDatePickerWrapperStore();
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const close = () => {
    savedScroll = null;
    setSearchState({ search: null, q: null, year: null });
  };

  const scrollToTop = () => scrollRef.current?.scrollTo({ top: 0 });

  const onQueryChange = (value: string) => {
    setSearchState({ q: value });
    scrollToTop();
  };

  const onYearChange = (value: number | null) => {
    setSearchState({ year: value });
    scrollToTop();
  };

  // Infinite scroll: load the next page as the sentinel nears the bottom of the
  // results (not the viewport — the list scrolls inside the dialog). Re-arms when
  // the page set changes so the sentinel is observed once it exists.
  useEffect(() => {
    const root = scrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel || !hasNextPage) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { root, rootMargin: "160px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, results.length]);

  // Restore the saved scroll offset when reopening (browser Back) onto the same
  // query/year, once the cached rows have rendered.
  useLayoutEffect(() => {
    if (!search || !savedScroll || results.length === 0) {
      return;
    }
    if (savedScroll.q !== q || savedScroll.year !== year) {
      return;
    }
    scrollRef.current?.scrollTo({ top: savedScroll.top });
    savedScroll = null;
  }, [search, q, year, results.length]);

  const groups = groupSpendingsByMonth(results);

  // Picking a result jumps to the Dépenses page on the week that contains it (and
  // asks that page to scroll the day into view). We stash the scroll offset first
  // and leave the URL search state intact, so Back restores the modal + list.
  const goToSpendingWeek = (spending: SpendingItem) => {
    const dateISO = format(parseISO(spending.date), DATE_FORMAT);
    savedScroll = { q, year, top: scrollRef.current?.scrollTop ?? 0 };
    setScrollToDayIso(dateISO);
    router.push(buildSpendingsPath(dateISO));
  };

  return (
    <Dialog
      open={search}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          close();
        }
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-[560px]"
      >
        <DialogTitle className="sr-only">{spendingSearch.title}</DialogTitle>

        <div className="flex items-center gap-2.5 border-b border-line-soft px-4 py-3.5 pr-14">
          <Search className="size-4 shrink-0 text-ink-4" />
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={spendingSearch.placeholder}
            className="min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-4"
          />
          {hasQuery && !isSearching && (
            <span className="shrink-0 text-xs text-ink-4">{spendingSearch.resultsCount(total)}</span>
          )}
        </div>

        {years.length > 0 && (
          <div className="flex gap-2 overflow-x-auto border-b border-line-soft px-4 py-2.5">
            <FilterChip
              active={year === null}
              onClick={() => onYearChange(null)}
              className="rounded-full px-3"
            >
              {spendingSearch.yearsAll}
            </FilterChip>
            {years.map((y) => (
              <FilterChip
                key={y}
                active={year === y}
                onClick={() => onYearChange(y)}
                className="rounded-full px-3"
              >
                {y}
              </FilterChip>
            ))}
          </div>
        )}

        <div
          ref={scrollRef}
          className="max-h-[min(60vh,440px)] overflow-y-auto"
        >
          {error ? (
            <EmptyState className="py-10">{spendingSearch.error}</EmptyState>
          ) : !hasQuery ? (
            <EmptyState className="py-10">{spendingSearch.hint}</EmptyState>
          ) : isSearching && results.length === 0 ? (
            <EmptyState className="py-10">{spendingSearch.loading}</EmptyState>
          ) : results.length === 0 ? (
            <EmptyState className="py-10">{spendingSearch.noResults}</EmptyState>
          ) : (
            <>
              {groups.map((group) => (
                <div key={group.key}>
                  <div className="sticky top-0 z-10 bg-surface-elev px-4 py-1.5 text-xs font-medium text-ink-4">
                    {group.label}
                  </div>
                  {group.items.map((item) => (
                    <SpendingSearchResultRow
                      key={item.ID}
                      spending={item}
                      onSelect={goToSpendingWeek}
                    />
                  ))}
                </div>
              ))}
              <div ref={sentinelRef} />
              {isFetchingNextPage && (
                <div className="px-4 py-3 text-center text-xs text-ink-4">{spendingSearch.loadingMore}</div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SpendingSearchModal;
