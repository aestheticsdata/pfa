"use client";

import { useEffect } from "react";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import format from "date-fns/format";
import fr from "date-fns/locale/fr";
import { Plus } from "lucide-react";
import { useState } from "react";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import {
  getWeekRange,
  getWeekDays,
} from "@components/datePickerWrapper/helpers";
import SpendingDashboard from "@components/spendings/spendingDashboard/SpendingDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingDayItem from "@components/spendings/spendingDayItem/SpendingDayItem";
import SpendingModal from "@components/spendings/common/spendingModal/SpendingModal";
import { Button } from "@components/ui/button";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingDayGroup } from "@components/spendings/types";

const Spendings = () => {
  const { from, to, range, setFrom, setTo, setRange } =
    useDatePickerWrapperStore();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Initialize date range when landing on spendings before DatePickerWrapper mounts.
  useEffect(() => {
    if (!from) {
      const now = new Date();
      const weekRange = getWeekRange(now);
      const dateRange = getWeekDays(weekRange.from, now);
      setFrom(weekRange.from);
      setTo(weekRange.to);
      setRange(dateRange);
    }
  }, [from, setFrom, setTo, setRange]);

  const {
    spendingsByWeek,
    isLoading: isSpendingsLoading,
    error,
  } = useSpendings();
  const month: MonthRange | null =
    from && to
      ? {
          start: startOfMonth(from),
          end: endOfMonth(to),
        }
      : null;

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
    <div className="flex flex-col gap-6">
      <SpendingDashboard month={month} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-gray-100 text-lg font-medium">
              Dépenses quotidiennes
            </h2>
            {periodLabel && (
              <p className="text-gray-500 text-xs">{periodLabel}</p>
            )}
          </div>
          <Button
            variant="cyan"
            size="default"
            onClick={() => setIsQuickAddOpen(true)}
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </section>

      {isQuickAddOpen && (
        <SpendingModal
          date={new Date()}
          closeModal={() => setIsQuickAddOpen(false)}
          spending={null}
          isEditing={false}
          month={month}
        />
      )}
    </div>
  );
};

export default Spendings;
