import { getWeekDays, getWeekRange } from "@components/datePickerWrapper/helpers";
import { formatIsoDate } from "@helpers/dateRoute";
import produce from "immer";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface DatePickerWrapperStoreProps {
  from: Date | null;
  to: Date | null;
  range: Date[] | null;
  selectedDateIso: string | null;
  // Cross-tree "scroll the Spendings timeline to this day" request (COS-38). Set
  // by the NavBar "Today" button and by a fresh spending creation; read
  // and consumed (reset to null) by SpendingView once the matching card mounts.
  scrollToDayIso: string | null;
  setWeek: (date: Date) => void;
  setFrom: (from: Date) => void;
  setTo: (from: Date) => void;
  setRange: (from: Date[]) => void;
  setScrollToDayIso: (dateIso: string | null) => void;
}

// This store is intentionally NOT persisted. The selected week is carried by the
// `?date=` URL param (see SpendingPageClient), so it already survives reloads —
// and the picker is only shown on Spendings. Persisting `selectedDateIso` in
// localStorage leaked a stale day across sessions, which made the NavBar
// "Spendings" link reopen a past week instead of today (COS-73). "Today" must be
// resolved fresh, client-side, on each new visit.
const useStore = create<DatePickerWrapperStoreProps>()(
  devtools((set) => ({
    from: null,
    to: null,
    range: null,
    selectedDateIso: null,
    scrollToDayIso: null,
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
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          const weekRange = getWeekRange(date);
          const isSameWeek =
            draft.from !== null &&
            draft.to !== null &&
            formatIsoDate(draft.from) === formatIsoDate(weekRange.from) &&
            formatIsoDate(draft.to) === formatIsoDate(weekRange.to);

          if (!isSameWeek) {
            draft.from = weekRange.from;
            draft.to = weekRange.to;
            draft.range = getWeekDays(weekRange.from, date);
          }
          draft.selectedDateIso = formatIsoDate(date);
        }),
      ),
    setFrom: (from: Date) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.from = from;
        }),
      ),
    setTo: (to: Date) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.to = to;
        }),
      ),
    setRange: (range: Date[]) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.range = range;
        }),
      ),
    setScrollToDayIso: (dateIso: string | null) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.scrollToDayIso = dateIso;
        }),
      ),
  })),
);

export default useStore;
