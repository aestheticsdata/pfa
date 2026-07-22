"use client";

import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { EmptyState } from "@components/shared/EmptyState";
import { FilterChip } from "@components/shared/FilterChip";
import { DATE_FORMAT, SEARCH_DEBOUNCE_MS } from "@components/spendings/config/constants";
import { groupSpendingsByMonth } from "@components/spendings/search/groupByMonth";
import SpendingSearchResultRow from "@components/spendings/search/SpendingSearchResultRow";
import { spendingSearchParsers, spendingSearchUrlOptions } from "@components/spendings/search/searchParams";
import useDebouncedValue from "@components/spendings/search/useDebouncedValue";
import useSpendingSearch from "@components/spendings/services/useSpendingSearch";
import useSpendingYears from "@components/spendings/services/useSpendingYears";
import { Dialog, DialogContent, DialogTitle } from "@components/ui/dialog";
import { buildSpendingsPath } from "@helpers/dateRoute";
import useDateLocale from "@i18n/useDateLocale";
import useTranslations from "@i18n/useTranslations";
import format from "date-fns/format";
import parseISO from "date-fns/parseISO";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useQueryStates } from "nuqs";
import { useEffect, useLayoutEffect, useRef } from "react";

import type { SpendingItem } from "@components/spendings/types";

// Scroll offset of the results list, stashed when the user leaves for a spending
// so browser Back can restore the list where they were. Module-level so it
// survives the modal unmounting during SPA navigation; lost on hard refresh
// (fine — the TanStack Query page cache is gone then too).
let savedScroll: { q: string; year: number | null; top: number } | null = null;

/**
 * Whole-history spending search palette (COS-114). Its state — open flag, query,
 * year — lives in the URL (nuqs), so browser Back reopens it where the user left
 * off. A debounced query (optionally scoped to a year) hits the backend, results
 * are grouped by month (newest-first) and paged in on scroll. Picking a result
 * navigates to the Spendings page on the week that contains it.
 */
const SpendingSearchModal = () => {
  const spendingSearch = useTranslations("spendingSearch");
  const dateLocale = useDateLocale();
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

  const groups = groupSpendingsByMonth(results, dateLocale);

  // A single placeholder message (or null when there are rows) so the scroll area
  // keeps its fixed height and the modal never resizes as the query starts empty,
  // matches, or stops matching (COS-119).
  const resolveEmptyMessage = (): string | null => {
    if (error) return spendingSearch.error;
    if (!hasQuery) return spendingSearch.hint;
    if (results.length === 0) return isSearching ? spendingSearch.loading : spendingSearch.noResults;
    return null;
  };
  const emptyMessage = resolveEmptyMessage();

  // Picking a result jumps to the Spendings page on the week that contains it (and
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
        className="gap-0 overflow-hidden border-line bg-surface-elev p-0 sm:max-w-[700px]"
      >
        <DialogTitle className="sr-only">{spendingSearch.title}</DialogTitle>

        {/* Keep the DS dialog's own top-right close (absolute top-4, centre at 30px)
            and mirror the p-0 modal header pattern (SpendingModal): py-4.5 + a
            text-base row so the content centres at that same 30px, pr-14 clears the
            close. No overriding the DS close. */}
        <div className="flex items-center gap-2.5 border-b border-line-soft py-4.5 pl-5.5 pr-14">
          <Search className="size-4 shrink-0 text-ink-4" />
          <input
            type="search"
            autoFocus
            value={q}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={spendingSearch.placeholder}
            className="min-w-0 flex-1 bg-transparent p-0 text-base text-ink outline-none placeholder:text-ink-4"
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
          className="h-[min(72vh,590px)] overflow-y-auto"
        >
          {emptyMessage !== null ? (
            <div className="flex h-full items-center justify-center px-6">
              <EmptyState className="text-base">{emptyMessage}</EmptyState>
            </div>
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
