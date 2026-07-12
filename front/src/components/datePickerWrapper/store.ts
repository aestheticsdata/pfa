import { create } from "zustand";
import produce from "immer";
import { devtools } from "zustand/middleware";

export interface DatePickerWrapperStoreProps {
  from: Date | null;
  to: Date | null;
  range: Date[] | null;
  selectedDateIso: string | null;
  setFrom: (from: Date) => void;
  setTo: (from: Date) => void;
  setRange: (from: Date[]) => void;
  setSelectedDateIso: (dateIso: string | null) => void;
}

// This store is intentionally NOT persisted. The selected week is carried by the
// `?date=` URL param (see SpendingPageClient), so it already survives reloads —
// and the picker is only shown on Dépenses. Persisting `selectedDateIso` in
// localStorage leaked a stale day across sessions, which made the NavBar
// "Dépenses" link reopen a past week instead of today (COS-73). "Today" must be
// resolved fresh, client-side, on each new visit.
const useStore = create<DatePickerWrapperStoreProps>()(
  devtools((set) => ({
    from: null,
    to: null,
    range: null,
    selectedDateIso: null,
    setFrom: (from: Date) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.from = from;
        })
      ),
    setTo: (to: Date) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.to = to;
        })
      ),
    setRange: (range: Date[]) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.range = range;
        })
      ),
    setSelectedDateIso: (dateIso: string | null) =>
      set(
        produce((draft: DatePickerWrapperStoreProps) => {
          draft.selectedDateIso = dateIso;
        })
      ),
  }))
);

export default useStore;
