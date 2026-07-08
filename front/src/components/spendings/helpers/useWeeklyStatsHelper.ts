import startOfMonth from "date-fns/startOfMonth";
import getDay from "date-fns/getDay";
import getDaysInMonth from "date-fns/getDaysInMonth";
import getDate from "date-fns/getDate";


const useWeeklyStatsHelper = () => {
  const makeRange = (from: Date) => {
    const ranges: number[] = [];
    const startDate = startOfMonth(from);
    const dayNumberFromMonthStart = getDay(startDate); // Sunday is 0
    const firstSlice = 7 - dayNumberFromMonthStart;
    const numberOfDaysInMonth = getDaysInMonth(startDate)
    ranges.push(firstSlice);
    const numberOfFullWeeks = Math.floor((numberOfDaysInMonth - firstSlice) / 7);
    for (let i = 0, l = numberOfFullWeeks; i < l; i += 1) {
      ranges.push(7);
    }
    const remainingNumberOfDays = numberOfDaysInMonth - (firstSlice + (7 * numberOfFullWeeks));
    remainingNumberOfDays !== 0 && ranges.push(remainingNumberOfDays);

    return ranges;
  }

  const getSliceDates = (idx: number, ranges: number[]) => {
    const getSumDays = (i: number) => ranges.slice(0, i + 1).reduce((acc, curr) => acc + curr, 0);
    const sliceStart = idx === 0 ? 1 : getSumDays(idx - 1) + 1;
    const sliceEnd = getSumDays(idx);

    return sliceStart === sliceEnd ? sliceStart : `${sliceStart} - ${sliceEnd}`;
  }

  const makeSlices = (ranges: number[]) => ranges.reduce((acc: Array<string | number>, _curr, idx, arr) => {
    acc.push(getSliceDates(idx, arr));
    return acc;
  }, [] as Array<string | number>);

  const isCurrentWeek = (slice: string | number, from: Date) => {
    return typeof slice === 'string' ?
      +(slice.split(' - ')[0]) === getDate(from)
      :
      +(slice) === getDate(from);
  }

  return {
    makeRange,
    makeSlices,
    isCurrentWeek,
  }
}

export default useWeeklyStatsHelper;
