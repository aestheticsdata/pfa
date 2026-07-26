import getDate from "date-fns/getDate";
import getDay from "date-fns/getDay";
import getDaysInMonth from "date-fns/getDaysInMonth";
import startOfMonth from "date-fns/startOfMonth";

import type { WeekSlice } from "@components/spendings/interfaces/weeklyStatsTypes";

const useWeeklyStatsHelper = () => {
  const makeRange = (from: Date) => {
    const ranges: number[] = [];
    const startDate = startOfMonth(from);
    const dayNumberFromMonthStart = getDay(startDate); // Sunday is 0
    const firstSlice = 7 - dayNumberFromMonthStart;
    const numberOfDaysInMonth = getDaysInMonth(startDate);
    ranges.push(firstSlice);
    const numberOfFullWeeks = Math.floor((numberOfDaysInMonth - firstSlice) / 7);
    for (let i = 0, l = numberOfFullWeeks; i < l; i += 1) {
      ranges.push(7);
    }
    const remainingNumberOfDays = numberOfDaysInMonth - (firstSlice + 7 * numberOfFullWeeks);
    remainingNumberOfDays !== 0 && ranges.push(remainingNumberOfDays);

    return ranges;
  };

  const getSliceDates = (idx: number, ranges: number[]): WeekSlice => {
    const getSumDays = (i: number) => ranges.slice(0, i + 1).reduce((acc, curr) => acc + curr, 0);

    return {
      start: idx === 0 ? 1 : getSumDays(idx - 1) + 1,
      end: getSumDays(idx),
    };
  };

  const makeSlices = (ranges: number[]): WeekSlice[] => ranges.map((_curr, idx, arr) => getSliceDates(idx, arr));

  const isCurrentWeek = (slice: WeekSlice | undefined, from: Date) => slice?.start === getDate(from);

  return {
    makeRange,
    makeSlices,
    isCurrentWeek,
  };
};

export default useWeeklyStatsHelper;
