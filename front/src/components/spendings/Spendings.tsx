"use client";

import { useEffect, useState } from "react";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { getWeekRange, getWeekDays } from "@components/datePickerWrapper/helpers";
import SpendingDashboard from "@components/spendings/spendingDashboard/SpendingDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import SpendingDayItem from "@components/spendings/spendingDayItem/SpendingDayItem";
import useBlur from "@components/common/helpers/blurHelper";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";
import type { SpendingDayGroup } from "@components/spendings/types";

const Spendings = () => {
  const { isBlurActive } = useBlur();

  const [month, setMonth] = useState<MonthRange>();
  const { from, to, range, setFrom, setTo, setRange } = useDatePickerWrapperStore();

  // Initialize date range when landing on spendings (e.g. after signup) before DatePickerWrapper mounts.
  // Fixes: can't edit weekly ceiling / monthly amount until page refresh.
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

  const { spendingsByWeek, isLoading: isSpendingsLoading, error } = useSpendings();

  useEffect(() => {
    if (from && to) {
      setMonth({
        start: startOfMonth(from),
        end: endOfMonth(to),
      })
    }
  }, [from, to]);

  if (error) {
    throw error;
  }

  return (
    <>
      {month &&
        <>
          <SpendingDashboard month={month} />
          <div className={`flex justify-center w-full ${isBlurActive && "blur-xs"}`}>
            <div className="flex flex-wrap justify-start mt-36 md:mt-96 md:pl-1 w-full md:w-11/12 space-y-2">
            {/*<div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 mt-36 md:mt-96">*/}
              {spendingsByWeek?.map((spending: SpendingDayGroup, i: number) =>
                <SpendingDayItem
                  key={spending.dayOfMonth}
                  spendingsByDay={spending.items}
                  total={spending.total}
                  date={range![i]}
                  isLoading={isSpendingsLoading}
                />
              )
              }
            </div>
          </div>
        </>
      }
    </>
  );
};

export default Spendings;
