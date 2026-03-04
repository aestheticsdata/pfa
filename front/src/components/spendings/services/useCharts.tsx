import { useQuery } from "react-query";
import startOfMonth from "date-fns/startOfMonth";
import endOfMonth from "date-fns/endOfMonth";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { useAuth } from "@auth/context/AuthContext";
import { QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import { MONTHLY } from "@components/spendings/spendingDashboard/common/widgetHeaderConstants";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { ChartsCategoryListSchema } from "@src/schemas/stats";


const useCharts = (periodType: string) => {
  const { privateRequest } = useRequestHelper();
  const { from, to } = useDatePickerWrapperStore();
  const { user } = useAuth();
  const userID = user?.id;
  const startDate = periodType === MONTHLY
    ? (from ? startOfMonth(from) : undefined)
    : from;
  const endDate = periodType === MONTHLY
    ? (from ? endOfMonth(from) : undefined)
    : to;

  const getCharts = async () => {
    const response = await privateRequest(`/spendings/charts?userID=${userID}&from=${startDate}&to=${endDate}`);
    return ChartsCategoryListSchema.parse(response.data);
  }

  return useQuery([QUERY_KEYS.CHARTS, startDate, endDate], getCharts, {
    retry: false,
    enabled: !!startDate && !!endDate && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useCharts;
