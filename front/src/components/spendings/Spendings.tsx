"use client";

import { useEffect, useState } from "react";
import { endOfMonth } from "date-fns";
import startOfMonth from "date-fns/startOfMonth";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { getWeekRange, getWeekDays } from "@components/datePickerWrapper/helpers";
import useDashboard from "@components/spendings/services/useDashboard";
import SpendingDashboard from "@components/spendings/spendingDashboard/SpendingDashboard";
import useSpendings from "@components/spendings/services/useSpendings";
import useInitialAmount from "@components/spendings/services/useInitialAmount";
import SpendingDayItem from "@components/spendings/spendingDayItem/SpendingDayItem";
import useBlur from "@components/common/helpers/blurHelper";

import type { MonthRange } from "@components/spendings/interfaces/spendingDashboardTypes";

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

  const { spendingsByWeek, spendingsByMonth, isLoading: isSpendingsLoading } = useSpendings();

  // const { get: { data: dashboard } } = useDashboard();

  // const { data: initialAmount } = useInitialAmount();

  useEffect(() => {
    if (from && to) {
      setMonth({
        start: startOfMonth(from),
        end: endOfMonth(to),
      })
    }
  }, [from, to]);

  return (
    <>
      {month &&
        <>
          <SpendingDashboard month={month} />
          <div className={`flex justify-center w-full ${isBlurActive && "blur-xs"}`}>
            <div className="flex flex-wrap justify-start mt-36 md:mt-96 md:pl-1 w-full md:w-11/12 space-y-2">
            {/*<div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 mt-36 md:mt-96">*/}
              {spendingsByWeek?.map((spending: any, i: number) =>
                <SpendingDayItem
                  key={i}
                  spendingsByDay={spending}
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
