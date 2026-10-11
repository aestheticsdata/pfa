import { create } from "zustand";

import type { ReceiptLinesState } from "@components/spendings/interfaces/receiptLinesTypes";

/**
 * The spending whose receipt lines are on screen (PFA-214). Global rather than
 * per page: the OCR review is opened from the creation mutation, which outlives
 * the spending modal that started it. One host on the Spendings page renders it.
 */
const useReceiptLinesStore = create<ReceiptLinesState>()((set) => ({
  target: null,
  open: (target) => set({ target }),
  setMode: (mode) => set((state) => (state.target ? { target: { ...state.target, mode } } : state)),
  close: () => set({ target: null }),
}));

export default useReceiptLinesStore;
