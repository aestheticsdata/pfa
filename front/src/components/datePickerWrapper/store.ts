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
  setFrom: (from: Date) => void;
  setTo: (from: Date) => void;
  setRange: (from: Date[]) => void;
  setSelectedDateIso: (dateIso: string | null) => void;
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
    setSelectedDateIso: (dateIso: string | null) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.selectedDateIso = dateIso;
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
