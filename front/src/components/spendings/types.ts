import type { User } from "@src/interfaces/user";
import type { RecurringItem, SpendingItem } from "@src/schemas/spendings";

export type Month = { start: Date; end: Date } | null;

export type SpendingListItem = SpendingItem | RecurringItem;
export type { RecurringItem, SpendingItem };

export interface SpendingDayGroup {
  dayOfMonth: number;
  total: number;
  items: SpendingItem[];
}

export type SpendingsType = Array<SpendingDayGroup>;

interface SpendingsPartial {
  spendingsByDaySorted: SpendingListItem[];
  isLoading: boolean;
  recurringType?: boolean;
}

export interface SpendingDayItemType extends SpendingsPartial {
  user: User;
  month?: string | null;
  date?: Date;
  total?: number;
}

export interface SpendingsListContainerType extends SpendingsPartial {
  toggleAddSpending: () => void;
  editSpending: (spending: SpendingListItem) => void;
}
