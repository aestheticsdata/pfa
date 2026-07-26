import format from "date-fns/format";
import parseISO from "date-fns/parseISO";

import type { SpendingItem } from "@components/spendings/interfaces/spendingListTypes";
import type { Locale } from "date-fns";

export interface SpendingMonthGroup {
  key: string;
  label: string;
  items: SpendingItem[];
}

const capitalize = (value: string): string => (value ? value.charAt(0).toUpperCase() + value.slice(1) : value);

/**
 * Buckets spendings by calendar month, preserving the incoming order. The search
 * API returns matches newest-first, so both the buckets and the rows inside them
 * stay newest-first (COS-114). Each group carries a "July 2026"-style label,
 * rendered in the date-fns locale passed by the caller.
 */
export const groupSpendingsByMonth = (items: SpendingItem[], locale: Locale): SpendingMonthGroup[] => {
  const groups: SpendingMonthGroup[] = [];
  const byKey = new Map<string, SpendingMonthGroup>();

  for (const item of items) {
    const date = parseISO(item.date);
    const key = format(date, "yyyy-MM");
    let group = byKey.get(key);
    if (!group) {
      group = { key, label: capitalize(format(date, "MMMM yyyy", { locale })), items: [] };
      byKey.set(key, group);
      groups.push(group);
    }
    group.items.push(item);
  }

  return groups;
};
