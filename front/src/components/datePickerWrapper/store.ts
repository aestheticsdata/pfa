import { create } from "zustand";
import produce from "immer";
import { devtools, persist } from "zustand/middleware";

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

const useStore = create<DatePickerWrapperStoreProps>()(
  devtools(
    persist(
      (set) => ({
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
      }),
      {
        name: "date-picker-preferences",
        partialize: (state) => ({ selectedDateIso: state.selectedDateIso }),
      }
    )
  )
);

export default useStore;
