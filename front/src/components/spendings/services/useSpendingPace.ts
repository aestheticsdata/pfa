import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { spendingPaceQuery } from "@components/spendings/services/queries";
import { monthStartIso } from "@helpers/dateRoute";
import useRequestHelper from "@helpers/useRequestHelper";
import { useQuery } from "@tanstack/react-query";

/**
 * The totals of the three months before the displayed month (COS-40), newest→
 * oldest, as `{ months: [{ month, total }] }`. Backs the dashboard's "On pace"
 * insight, which turns them into daily rates to gauge the current month's
 * pace. The month is passed as its 1st day; userID is read from the session
 * server-side.
 */
const useSpendingPace = () => {
  const { privateRequest } = useRequestHelper();
  const from = useDatePickerWrapperStore((state) => state.from);
  return useQuery(spendingPaceQuery(privateRequest, monthStartIso(from)));
};

export default useSpendingPace;
