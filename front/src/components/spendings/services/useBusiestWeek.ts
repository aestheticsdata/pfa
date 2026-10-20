import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { busiestWeekQuery } from "@components/spendings/services/queries";
import { monthStartIso } from "@helpers/dateRoute";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/**
 * The displayed month's busiest calendar week-range by transaction count
 * (COS-139): the Sun→Sat slice (truncated at the month edges, like the rest of
 * the app) with the most one-off spendings, as `{ count, from, to }` — from/to
 * null when the month is empty. Backs the dashboard's 4th ribbon insight. The
 * month is passed as its 1st day; userID is read from the session server-side.
 */
const useBusiestWeek = () => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  return useQuery(busiestWeekQuery(privateRequest, monthStartIso(from)));
};

export default useBusiestWeek;
