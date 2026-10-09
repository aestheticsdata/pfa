import { createStore } from "zustand";

import type { SpendingsPageState } from "@components/spendings/interfaces/spendingsPageStoreTypes";

const withoutDay = (selected: Record<string, string>, dayIso: string) =>
  Object.fromEntries(Object.entries(selected).filter(([, day]) => day !== dayIso));

/**
 * One store per Spendings page (PFA-189): multi-selection across day cards,
 * the shared-receipt hover highlight and the post-grouping flash. Leaving the
 * page drops it with the provider, so no selection outlives the page.
 */
export const createSpendingsPageStore = () =>
  createStore<SpendingsPageState>()((set) => ({
    selectingDays: [],
    selected: {},
    hoveredReceipt: null,
    flashEntryID: null,
    toggleDaySelection: (dayIso) =>
      set((state) =>
        state.selectingDays.includes(dayIso)
          ? {
              // Leaving a card's selection mode unticks its rows.
              selectingDays: state.selectingDays.filter((day) => day !== dayIso),
              selected: withoutDay(state.selected, dayIso),
            }
          : { selectingDays: [...state.selectingDays, dayIso] },
      ),
    toggleEntry: (entryID, dayIso) =>
      set((state) => {
        if (state.selected[entryID]) {
          const { [entryID]: _removed, ...rest } = state.selected;
          return { selected: rest };
        }
        return { selected: { ...state.selected, [entryID]: dayIso } };
      }),
    exitSelection: () => set({ selectingDays: [], selected: {} }),
    setHoveredReceipt: (invoicefile) => set({ hoveredReceipt: invoicefile }),
    flashEntry: (entryID) => set({ flashEntryID: entryID }),
  }));
