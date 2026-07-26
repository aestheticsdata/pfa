import type { RecurringItem, SpendingItem } from "@src/schemas/spendings";

export type SpendingListItem = SpendingItem | RecurringItem;
export type { RecurringItem, SpendingItem };

export interface SpendingDayGroup {
  dayOfMonth: number;
  total: number;
  items: SpendingItem[];
}
