import { useAuth } from "@auth/context/AuthContext";
import useDatePickerWrapperStore from "@components/datePickerWrapper/store";
import { MONTHLY, QUERY_KEYS, QUERY_OPTIONS } from "@components/spendings/config/constants";
import useRequestHelper from "@src/helpers/useRequestHelper";
import { ChartsCategoryListSchema } from "@src/schemas/stats";
import endOfMonth from "date-fns/endOfMonth";
import startOfMonth from "date-fns/startOfMonth";
import { useQuery } from "react-query";

import type { ChartsCategory } from "@src/schemas/stats";

const aggregateByCategory = (items: ChartsCategory[]): ChartsCategory[] => {
  const map = new Map<string, ChartsCategory>();
  for (const item of items) {
    const key = item.category ?? "__uncategorized__";
    const existing = map.get(key);
    if (existing) {
      existing.value = (existing.value ?? 0) + (item.value ?? 0);
    } else {
      map.set(key, { ...item, value: item.value ?? 0 });
    }
  }
  return Array.from(map.values()).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
};

const useCharts = (periodType: string) => {
  const { privateRequest } = useRequestHelper();
  const { from, to } = useDatePickerWrapperStore();
  const { user } = useAuth();
  const userID = user?.id;
  const startDate = periodType === MONTHLY ? (from ? startOfMonth(from) : undefined) : from;
  const endDate = periodType === MONTHLY ? (from ? endOfMonth(from) : undefined) : to;

  const getCharts = async () => {
    const response = await privateRequest(`/spendings/charts?userID=${userID}&from=${startDate}&to=${endDate}`);
    const parsed = ChartsCategoryListSchema.parse(response.data);
    return aggregateByCategory(parsed);
  };

  return useQuery([QUERY_KEYS.CHARTS, startDate, endDate], getCharts, {
    retry: false,
    enabled: !!startDate && !!endDate && !!userID,
    ...QUERY_OPTIONS,
  });
};

export default useCharts;
