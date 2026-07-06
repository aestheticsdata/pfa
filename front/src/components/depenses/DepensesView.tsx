"use client";

import { useState } from "react";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import useEnsureWeekRange from "@components/spendings/helpers/useEnsureWeekRange";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingDayItem from "@components/spendings/spendingDayItem/SpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import { Button } from "@components/ui/button";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingDayGroup } from "@components/spendings/types";

/**
 * Dépenses (weekly) page body — the day-cards timeline for the selected week.
 * (Extracted from the former combined Spendings view; the monthly dashboard
 * block now lives on the /overview route.)
 */
const DepensesView = () => {
  const { from, to, range } = useDatePickerWrapperStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  useEnsureWeekRange();

  const {
    spendingsByWeek,
    isLoading: isSpendingsLoading,
    error,
  } = useSpendings();

  const month: MonthRange | null =
    from && to ? { start: startOfMonth(from), end: endOfMonth(to) } : null;

  if (error) {
    throw error;
  }

  if (!month || !range) {
    return null;
  }

  const periodLabel =
    from && to
      ? `${format(from, "dd MMM yyyy", { locale: fr })} — ${format(to, "dd MMM yyyy", { locale: fr })}`
      : "";

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-medium text-gray-100">
            Dépenses quotidiennes
          </h2>
          {periodLabel && <p className="text-xs text-gray-500">{periodLabel}</p>}
        </div>
        <Button
          variant="cyan"
          size="default"
          onClick={() => setIsQuickAddOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {spendingsByWeek?.map((spending: SpendingDayGroup, i: number) => (
          <SpendingDayItem
            key={spending.dayOfMonth}
            spendingsByDay={spending.items}
            total={spending.total}
            date={range[i]}
            isLoading={isSpendingsLoading}
          />
        ))}
      </div>

      {isQuickAddOpen && (
        <SpendingModal
          date={new Date()}
          closeModal={() => setIsQuickAddOpen(false)}
          spending={null}
          isEditing={false}
          month={month}
        />
      )}
    </section>
  );
};

export default DepensesView;
