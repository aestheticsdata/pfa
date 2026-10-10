import { create } from "zustand";

import type { SelectionState } from "@components/panel/bots/interfaces/botsTypes";

/** The Bots page's selection: survives the 2-second refresh and paging, cleared by "Clear selection". */
export const useSelectionStore = create<SelectionState>((set) => ({
  selected: [],
  toggle: (id) =>
    set((state) => ({
      selected: state.selected.includes(id) ? state.selected.filter((x) => x !== id) : [...state.selected, id],
    })),
  setAll: (ids, on) =>
    set((state) => ({
      selected: on ? [...new Set([...state.selected, ...ids])] : state.selected.filter((x) => !ids.includes(x)),
    })),
  clear: () => set({ selected: [] }),
}));
