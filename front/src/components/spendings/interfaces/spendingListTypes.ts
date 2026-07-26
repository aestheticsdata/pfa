import type { RecurringItem, SpendingItem } from "@src/schemas/spendings";

export type SpendingListItem = SpendingItem | RecurringItem;
export type { RecurringItem, SpendingItem };

export interface SpendingDayGroup {
  dayOfMonth: number;
  total: number;
  items: SpendingItem[];
}

interface SpendingsPartial {
  spendingsByDaySorted: SpendingListItem[];
  isLoading: boolean;
  recurringType?: boolean;
}

export interface SpendingsListContainerType extends SpendingsPartial {
  toggleAddSpending: () => void;
  editSpending: (spending: SpendingListItem) => void;
}
