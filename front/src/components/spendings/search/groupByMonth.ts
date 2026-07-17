import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import parseISO from "date-fns/parseISO";

import type { SpendingItem } from "@components/spendings/types";

export interface SpendingMonthGroup {
  key: string;
  label: string;
  items: SpendingItem[];
}

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/**
 * Buckets spendings by calendar month, preserving the incoming order. The search
 * API returns matches newest-first, so both the buckets and the rows inside them
 * stay newest-first (COS-114). Each group carries a "Juillet 2026"-style label.
 */
export const groupSpendingsByMonth = (items: SpendingItem[]): SpendingMonthGroup[] => {
  const groups: SpendingMonthGroup[] = [];
  const byKey = new Map<string, SpendingMonthGroup>();

  for (const item of items) {
    const date = parseISO(item.date);
    const key = format(date, "yyyy-MM");
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: capitalize(format(date, "MMMM yyyy", { locale: fr })), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
};
