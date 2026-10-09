import type { createSpendingsPageStore } from "@components/spendings/stores/spendingsPageStore";

/** UI state of one Spendings page that several day cards share (PFA-189). */
export interface SpendingsPageState {
  /** Day cards (yyyy-MM-dd) in selection mode — several at once for a multi-day shared receipt. */
  selectingDays: string[];
  /** Selected top-level rows (spending or group ID) → their day. */
  selected: Record<string, string>;
  /** Receipt file under the pointer: every row sharing it lights up, across cards. */
  hoveredReceipt: string | null;
  /** Row that just appeared from a grouping — flashes once. */
  flashEntryID: string | null;
  toggleDaySelection: (dayIso: string) => void;
  toggleEntry: (entryID: string, dayIso: string) => void;
  exitSelection: () => void;
  setHoveredReceipt: (invoicefile: string | null) => void;
  flashEntry: (entryID: string | null) => void;
}

export type SpendingsPageStore = ReturnType<typeof createSpendingsPageStore>;
