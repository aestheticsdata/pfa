import { getWeekDays, getWeekRange } from "@components/datePickerWrapper/helpers";
import { formatIsoDate } from "@helpers/dateRoute";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import type { SelectorStore } from "@lib/interfaces/selectorStoreTypes";

export interface DatePickerWrapperStoreProps {
  from: Date | null;
  to: Date | null;
  range: Date[] | null;
  selectedDateIso: string | null;
  // Cross-tree "scroll the Spendings timeline to this day" request (COS-38). Set
  // by the NavBar "Today" button and by a fresh spending creation; read
  // and consumed (reset to null) by SpendingView once the matching card mounts.
  scrollToDayIso: string | null;
  // The spending picked from the search modal (PFA-188): its row is brought into
  // view inside its day card and spotlighted, then the row clears it once the
  // animation ends.
  spotlightSpendingId: string | null;
  setWeek: (date: Date) => void;
  setFrom: (from: Date) => void;
  setTo: (from: Date) => void;
  setRange: (from: Date[]) => void;
  setScrollToDayIso: (dateIso: string | null) => void;
  setSpotlightSpendingId: (spendingId: string | null) => void;
}

// This store is intentionally NOT persisted. The selected week is carried by the
// `?date=` URL param (see Spendings), so it already survives reloads —
// and the picker is only shown on Spendings. Persisting `selectedDateIso` in
// localStorage leaked a stale day across sessions, which made the NavBar
// "Spendings" link reopen a past week instead of today (COS-73). "Today" must be
// resolved fresh, client-side, on each new visit.
const useStore: SelectorStore<DatePickerWrapperStoreProps> = create<DatePickerWrapperStoreProps>()(
  devtools((set) => ({
    from: null,
    to: null,
    range: null,
    selectedDateIso: null,
    scrollToDayIso: null,
    spotlightSpendingId: null,
    /**
     * Single entry point for "select the week containing this day" — the only
     * writer of from/to/range/selectedDateIso (COS-99). It replaces the four
     * setters the picker used to fire in a row (four notifications, so four
     * renders of every consumer, none of which uses a selector) and, above all,
     * it is idempotent:
     *  - same week, same day  → nothing is written at all;
     *  - same week, other day → only `selectedDateIso` moves, so `range` KEEPS
     *    its identity and effects keyed on it don't re-run (COS-97);
     *  - another week         → the whole period is replaced, once.
     * That is what makes the two mounted DatePickerWrappers harmless: a second
     * caller asking for the week already loaded is a no-op, not a re-write.
     * The week is identified by its calendar bounds rather than by getTime:
     * getWeekRange carries over the time of day of its argument on
     * month-truncated weeks, so the same week reached from `new Date()` and from
     * a `?date=` param would otherwise compare as two different weeks.
     */
    setWeek: (date: Date) =>
      set((state) => {
        const weekRange = getWeekRange(date);
        const selectedDateIso = formatIsoDate(date);
        const isSameWeek =
          state.from !== null &&
          state.to !== null &&
          formatIsoDate(state.from) === formatIsoDate(weekRange.from) &&
          formatIsoDate(state.to) === formatIsoDate(weekRange.to);

        if (isSameWeek) {
          return state.selectedDateIso === selectedDateIso ? state : { selectedDateIso };
        }
        return {
          from: weekRange.from,
          to: weekRange.to,
          range: getWeekDays(weekRange.from, date),
          selectedDateIso,
        };
      }),
    // Each setter hands the store back unchanged when the value is already there, so zustand
    // notifies nobody — what immer's `produce` gave for free before PFA-236.
    setFrom: (from: Date) => set((state) => (state.from === from ? state : { from })),
    setTo: (to: Date) => set((state) => (state.to === to ? state : { to })),
    setRange: (range: Date[]) => set((state) => (state.range === range ? state : { range })),
    setScrollToDayIso: (dateIso: string | null) =>
      set((state) => (state.scrollToDayIso === dateIso ? state : { scrollToDayIso: dateIso })),
    setSpotlightSpendingId: (spendingId: string | null) =>
      set((state) => (state.spotlightSpendingId === spendingId ? state : { spotlightSpendingId: spendingId })),
  })),
);

export default useStore;
