import { DATE_FORMAT } from "@components/spendings/config/constants";
import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";

import type { SpendingItem, SpendingListItem } from "@components/spendings/interfaces/spendingListTypes";
import type { RecurringCopyDates } from "@components/spendings/interfaces/spendingMutationTypes";

const isSpendingItem = (item: SpendingListItem | null): item is SpendingItem => !!item && "date" in item;

/**
 * The modal's starting date (PFA-250): the edited spending's own day, else the day
 * the modal was opened on, else today — as yyyy-MM-dd.
 */
export const initialSpendingDate = (spending: SpendingListItem | null, date?: Date): string => {
  if (isSpendingItem(spending) && spending.date) {
    return spending.date.slice(0, 10);
  }
  return date ? format(date, "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
};

/** "Copy last month's recurrings" into `month`: its bounds and the previous month's. */
export const recurringCopyDates = (month: Date): RecurringCopyDates => {
  const mStart = startOfMonth(month);
  const mEnd = endOfMonth(month);
  return {
    start: format(mStart, DATE_FORMAT),
    end: format(mEnd, DATE_FORMAT),
    previousMonthStart: format(subMonths(mStart, 1), DATE_FORMAT),
    previousMonthEnd: format(subMonths(mEnd, 1), DATE_FORMAT),
  };
};
