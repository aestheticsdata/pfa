import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { buildDayEntries } from "@components/spendings/helpers/dayEntries";
import useSpendings from "@components/spendings/services/useSpendings";
import useSpendingsPageStore from "@components/spendings/stores/useSpendingsPageStore";
import format from "date-fns/format";

import type { SelectedEntry } from "@components/spendings/interfaces/spendingGroupTypes";

/**
 * The ticked rows, whole (PFA-189): a group the card filters narrowed still
 * brings all its lines. In card order, then row order.
 */
const useSelectedEntries = (): SelectedEntry[] => {
  const { spendingsByWeek } = useSpendings();
  const range = useDatePickerWrapperStore((s) => s.range);
  const selected = useSpendingsPageStore((s) => s.selected);

  return (spendingsByWeek ?? []).flatMap((day, i) => {
    const dayIso = range?.[i] ? format(range[i], "yyyy-MM-dd") : "";
    return buildDayEntries(day.items)
      .filter((entry) => selected[entry.ID])
      .map((entry) => ({ entry, dayIso }));
  });
};

export default useSelectedEntries;
