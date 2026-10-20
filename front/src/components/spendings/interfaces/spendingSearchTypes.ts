import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";

export interface SpendingMonthGroup {
  key: string;
  label: string;
  items: SpendingItem[];
}
