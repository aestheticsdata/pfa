import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useUserStore } from "@auth/store/userStore";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";


const useCharts = (periodType: string) => {
  const { privateRequest } = useRequestHelper();
  const { from, to } = useDatePickerWrapperStore();
  const user = useUserStore((state) => state.user);
  const userID = user?.id;
  const [startDate, setStartDate] = useState<Date | null>();
  const [endDate, setEndDate] = useState<Date | null>();

  useEffect(() => {
    if (periodType === MONTHLY) {
      setStartDate(startOfMonth(from!));
      setEndDate(endOfMonth(from!));
    } else {
      setStartDate(from);
      setEndDate(to);
    }
  }, [from, to]);

  const getCharts = async () => {
    return privateRequest(`/spendings/charts?userID=${userID}&from=${startDate}&to=${endDate}`);
  }

  return useQuery([QUERY_KEYS.CHARTS, startDate, endDate], getCharts, {
    retry: false,
    enabled: !!startDate && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useCharts;
